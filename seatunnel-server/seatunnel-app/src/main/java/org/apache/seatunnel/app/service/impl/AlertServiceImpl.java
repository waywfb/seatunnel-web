/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.seatunnel.app.service.impl;

import org.apache.seatunnel.app.dal.dao.IAlertEventDao;
import org.apache.seatunnel.app.dal.dao.IAlertRuleDao;
import org.apache.seatunnel.app.dal.entity.AlertEvent;
import org.apache.seatunnel.app.dal.entity.AlertRule;
import org.apache.seatunnel.app.dal.entity.JobDefinition;
import org.apache.seatunnel.app.dal.entity.JobInstance;
import org.apache.seatunnel.app.dal.mapper.JobMapper;
import org.apache.seatunnel.app.domain.request.alert.AlertRuleReq;
import org.apache.seatunnel.app.domain.response.PageInfo;
import org.apache.seatunnel.app.domain.response.alert.AlertEventRes;
import org.apache.seatunnel.app.domain.response.alert.AlertRuleRes;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.IAlertService;
import org.apache.seatunnel.app.utils.ServletUtils;
import org.apache.seatunnel.common.access.AccessType;
import org.apache.seatunnel.common.access.ResourceType;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.engine.common.job.JobStatus;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AlertServiceImpl extends SeatunnelBaseServiceImpl implements IAlertService {

    private static final int DEFAULT_COOLDOWN_SECONDS = 300;

    /** 单轮发送批量上限，避免一次循环处理过多 */
    private static final int SEND_BATCH_SIZE = 50;

    /** 告警推送超时，刻意收紧：发送线程不可被慢 endpoint 长时间占住 */
    private static final int CONNECT_TIMEOUT_MS = 5000;

    private static final int READ_TIMEOUT_MS = 5000;

    private static final int MAX_ERROR_MESSAGE_LENGTH = 4000;

    /** 单次清理批量上限，避免大事务与长时间锁表 */
    private static final int CLEANUP_BATCH_SIZE = 1000;

    /** 单轮清理最多执行的批次数。Spring 调度默认单线程，巨量堆积时不限批次会长时间占用线程，进而推迟告警发送。 */
    private static final int CLEANUP_MAX_BATCHES = 100;

    private static final long MILLIS_PER_DAY = 86400000L;

    private static final Pattern PLACEHOLDER = Pattern.compile("\\$\\{(\\w+)}");

    /** 告警事件保留天数，0 或负数表示关闭自动清理 */
    @Value("${seatunnel-web.alert.event-retention-days:30}")
    private int eventRetentionDays;

    @Resource private IAlertRuleDao alertRuleDao;

    @Resource private IAlertEventDao alertEventDao;

    @Resource private JobMapper jobMapper;

    /**
     * 任务进入终态的告警挂钩点。
     *
     * <p>只写事件表，绝不在此发起 HTTP —— 调用方是状态同步循环（fixedDelay=3s），同步推送会直接拖垮其周期。
     *
     * <p>整体捕获所有异常且不外抛：告警记录失败绝不能影响任务状态回写。
     */
    @Override
    public void onInstanceTerminal(JobInstance jobInstance, JobStatus newStatus) {
        if (jobInstance == null || newStatus != JobStatus.FAILED) {
            return;
        }
        try {
            Long workspaceId = jobInstance.getWorkspaceId();
            List<AlertRule> rules =
                    alertRuleDao.listEnabledByEventType(
                            AlertRule.EVENT_TYPE_JOB_FAILED, workspaceId);
            if (rules == null || rules.isEmpty()) {
                return;
            }
            Long jobInstanceId = jobInstance.getId();
            String jobDefineName = resolveJobDefineName(jobInstance.getJobDefineId());
            String errorMessage = truncate(jobInstance.getErrorMessage());
            for (AlertRule rule : rules) {
                if (isInCooldown(rule, jobInstanceId)) {
                    continue;
                }
                AlertEvent event =
                        AlertEvent.builder()
                                .id(generateId())
                                .ruleId(rule.getId())
                                .jobInstanceId(jobInstanceId)
                                .jobDefineName(jobDefineName)
                                .errorMessage(errorMessage)
                                .sendStatus(AlertEvent.SEND_STATUS_PENDING)
                                .retryCount(0)
                                .workspaceId(workspaceId)
                                .build();
                alertEventDao.insert(event);
            }
        } catch (Exception e) {
            log.warn("Failed to record alert event for job instance {}", jobInstance.getId(), e);
        }
    }

    @Override
    public void sendPendingEvents() {
        List<AlertEvent> pending = alertEventDao.listPending(SEND_BATCH_SIZE);
        if (pending == null || pending.isEmpty()) {
            return;
        }
        for (AlertEvent event : pending) {
            try {
                sendOne(event);
            } catch (Exception e) {
                log.warn("Failed to send alert event {}", event.getId(), e);
                markSendFailed(event, e.getMessage());
            }
        }
    }

    @Override
    public void cleanupExpiredEvents() {
        if (eventRetentionDays <= 0) {
            return;
        }
        Date cutoff = new Date(System.currentTimeMillis() - eventRetentionDays * MILLIS_PER_DAY);
        int total = 0;
        for (int i = 0; i < CLEANUP_MAX_BATCHES; i++) {
            int deleted = alertEventDao.deleteCreatedBefore(cutoff, CLEANUP_BATCH_SIZE);
            total += deleted;
            if (deleted < CLEANUP_BATCH_SIZE) {
                break;
            }
        }
        if (total > 0) {
            log.info(
                    "Cleaned up {} expired alert events, retention {} days",
                    total,
                    eventRetentionDays);
        }
    }

    private void sendOne(AlertEvent event) throws Exception {
        AlertRule rule = alertRuleDao.getById(event.getRuleId());
        if (rule == null) {
            markTerminated(event, "alert rule has been deleted");
            return;
        }
        if (!rule.isEnabled()) {
            markTerminated(event, "alert rule is disabled");
            return;
        }
        int responseCode = postWebhook(rule, renderBody(rule, event));
        if (responseCode >= 200 && responseCode < 300) {
            event.setSendStatus(AlertEvent.SEND_STATUS_SUCCESS);
            event.setSendTime(new Date());
            alertEventDao.update(event);
        } else {
            markSendFailed(event, "webhook responded with http status " + responseCode);
        }
    }

    /** 终态失败：规则已删除或已停用时，重试不可能成功，直接置为失败而不进入重试循环。 */
    private void markTerminated(AlertEvent event, String reason) {
        event.setSendStatus(AlertEvent.SEND_STATUS_FAILED);
        log.warn("Alert event {} terminated without retry, reason: {}", event.getId(), reason);
        alertEventDao.update(event);
    }

    private void markSendFailed(AlertEvent event, String reason) {
        int retried = event.getRetryCount() == null ? 0 : event.getRetryCount() + 1;
        event.setRetryCount(retried);
        if (retried >= AlertEvent.MAX_RETRY) {
            event.setSendStatus(AlertEvent.SEND_STATUS_FAILED);
            log.warn(
                    "Alert event {} marked as failed after {} retries, reason: {}",
                    event.getId(),
                    retried,
                    reason);
        } else {
            // 保持待发送状态，由下一轮调度重试
            event.setSendStatus(AlertEvent.SEND_STATUS_PENDING);
        }
        alertEventDao.update(event);
    }

    /** 同一规则对同一实例在冷却窗口内已产生过事件则跳过 */
    private boolean isInCooldown(AlertRule rule, Long jobInstanceId) {
        int cooldown =
                rule.getCooldownSeconds() != null
                        ? rule.getCooldownSeconds()
                        : DEFAULT_COOLDOWN_SECONDS;
        if (cooldown <= 0) {
            return false;
        }
        Date since = new Date(System.currentTimeMillis() - cooldown * 1000L);
        return alertEventDao.countSince(rule.getId(), jobInstanceId, since) > 0;
    }

    private int postWebhook(AlertRule rule, String body) throws Exception {
        URL url = new URL(rule.getWebhookUrl());
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        try {
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            applyCustomHeaders(connection, rule.getWebhookHeaders());
            connection.setDoOutput(true);
            try (OutputStream os = connection.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }
            return connection.getResponseCode();
        } finally {
            connection.disconnect();
        }
    }

    private void applyCustomHeaders(HttpURLConnection connection, String headersJson) {
        if (!StringUtils.hasText(headersJson)) {
            return;
        }
        try {
            Map<String, String> headers = JsonUtils.toMap(headersJson);
            if (headers == null) {
                return;
            }
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                if (StringUtils.hasText(entry.getKey())) {
                    connection.setRequestProperty(entry.getKey(), entry.getValue());
                }
            }
        } catch (Exception e) {
            log.warn("Invalid webhook headers json, skip header setting", e);
        }
    }

    /** 渲染消息体：配置了自定义模板则做占位符替换（值经 JSON 转义），否则输出标准 JSON 结构。 */
    private String renderBody(AlertRule rule, AlertEvent event) {
        Map<String, String> values = new HashMap<>();
        values.put("jobName", nvl(event.getJobDefineName()));
        values.put("jobInstanceId", String.valueOf(event.getJobInstanceId()));
        values.put("errorMessage", nvl(event.getErrorMessage()));
        values.put("eventType", nvl(rule.getEventType()));
        values.put("ruleName", nvl(rule.getName()));
        if (!StringUtils.hasText(rule.getWebhookTemplate())) {
            return JsonUtils.toJsonString(values);
        }
        Matcher matcher = PLACEHOLDER.matcher(rule.getWebhookTemplate());
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = values.containsKey(key) ? jsonEscape(values.get(key)) : matcher.group();
            matcher.appendReplacement(sb, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private static String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length() + 16);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    private String resolveJobDefineName(Long jobDefineId) {
        if (jobDefineId == null) {
            return null;
        }
        try {
            JobDefinition jobDefinition = jobMapper.selectById(jobDefineId);
            return jobDefinition == null ? null : jobDefinition.getName();
        } catch (Exception e) {
            log.warn("Failed to resolve job define name for id {}", jobDefineId, e);
            return null;
        }
    }

    private static String nvl(String value) {
        return value == null ? "" : value;
    }

    private static String truncate(String value) {
        if (value == null || value.length() <= MAX_ERROR_MESSAGE_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    private Long generateId() {
        try {
            return CodeGenerateUtils.getInstance().genCode();
        } catch (CodeGenerateUtils.CodeGenerateException e) {
            throw new SeatunnelException(SeatunnelErrorEnum.JOB_RUN_GENERATE_UUID_ERROR);
        }
    }

    @Override
    public Long createRule(AlertRuleReq req) {
        checkPermission(req == null ? null : req.getName(), AccessType.CREATE);
        validateRule(req);
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        Integer userId = ServletUtils.getCurrentUserId();
        AlertRule rule =
                AlertRule.builder()
                        .id(generateId())
                        .name(req.getName().trim())
                        .eventType(normalizeEventType(req.getEventType()))
                        .webhookUrl(req.getWebhookUrl().trim())
                        .webhookHeaders(req.getWebhookHeaders())
                        .webhookTemplate(req.getWebhookTemplate())
                        .status(
                                req.getStatus() == null
                                        ? AlertRule.STATUS_ENABLED
                                        : req.getStatus())
                        .cooldownSeconds(
                                req.getCooldownSeconds() == null
                                        ? DEFAULT_COOLDOWN_SECONDS
                                        : req.getCooldownSeconds())
                        .createUserId(userId)
                        .workspaceId(workspaceId)
                        .build();
        alertRuleDao.insert(rule);
        return rule.getId();
    }

    @Override
    public void updateRule(Long ruleId, AlertRuleReq req) {
        AlertRule existing = requireRule(ruleId);
        checkPermission(existing.getName(), AccessType.UPDATE);
        validateRule(req);
        existing.setName(req.getName().trim());
        existing.setEventType(normalizeEventType(req.getEventType()));
        existing.setWebhookUrl(req.getWebhookUrl().trim());
        existing.setWebhookHeaders(req.getWebhookHeaders());
        existing.setWebhookTemplate(req.getWebhookTemplate());
        if (req.getStatus() != null) {
            existing.setStatus(req.getStatus());
        }
        if (req.getCooldownSeconds() != null) {
            existing.setCooldownSeconds(req.getCooldownSeconds());
        }
        existing.setUpdateUserId(ServletUtils.getCurrentUserId());
        alertRuleDao.update(existing);
    }

    @Override
    public void deleteRule(Long ruleId) {
        AlertRule rule = requireRule(ruleId);
        checkPermission(rule.getName(), AccessType.DELETE);
        alertRuleDao.deleteById(ruleId);
    }

    @Override
    public PageInfo<AlertRuleRes> pageRule(
            Integer pageNo, Integer pageSize, Integer status, String name) {
        checkPermission(null, AccessType.READ);
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        IPage<AlertRule> rulePage =
                alertRuleDao.queryPage(new Page<>(pageNo, pageSize), workspaceId, status, name);
        PageInfo<AlertRuleRes> pageInfo = new PageInfo<>();
        pageInfo.setPageSize(pageSize);
        pageInfo.setPageNo(pageNo);
        pageInfo.setData(
                rulePage.getRecords().stream().map(this::toRuleRes).collect(Collectors.toList()));
        // setTotalCount 依赖已设置的 pageSize 计算 totalPage，必须放在最后
        pageInfo.setTotalCount((int) rulePage.getTotal());
        return pageInfo;
    }

    @Override
    public PageInfo<AlertEventRes> pageEvent(
            Integer pageNo,
            Integer pageSize,
            Integer sendStatus,
            Long ruleId,
            String jobDefineName) {
        checkPermission(null, AccessType.READ);
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        IPage<AlertEvent> eventPage =
                alertEventDao.queryPage(
                        new Page<>(pageNo, pageSize),
                        workspaceId,
                        sendStatus,
                        ruleId,
                        jobDefineName);
        PageInfo<AlertEventRes> pageInfo = new PageInfo<>();
        pageInfo.setPageSize(pageSize);
        pageInfo.setPageNo(pageNo);
        pageInfo.setData(toEventResList(eventPage.getRecords()));
        // setTotalCount 依赖已设置的 pageSize 计算 totalPage，必须放在最后
        pageInfo.setTotalCount((int) eventPage.getTotal());
        return pageInfo;
    }

    @Override
    public boolean sendTestWebhook(Long ruleId) {
        AlertRule rule = requireRule(ruleId);
        checkPermission(rule.getName(), AccessType.EXECUTE);
        AlertEvent probe =
                AlertEvent.builder()
                        .id(0L)
                        .ruleId(rule.getId())
                        .jobInstanceId(0L)
                        .jobDefineName("test-alarm")
                        .errorMessage("This is a test message from SeaTunnel Web")
                        .build();
        try {
            int code = postWebhook(rule, renderBody(rule, probe));
            return code >= 200 && code < 300;
        } catch (Exception e) {
            log.warn("Test webhook failed for rule {}", ruleId, e);
            return false;
        }
    }

    /**
     * 告警资源权限校验，资源名为空时回落为模块名，避免校验实现拿到 null。
     *
     * <p>仅用于用户请求入口。系统钩子（{@link #onInstanceTerminal}）与调度任务（{@link #sendPendingEvents}、{@link
     * #cleanupExpiredEvents}） 无用户上下文，调用会导致 UserContextHolder 抛异常，不得加校验。
     */
    private void checkPermission(String resourceName, AccessType accessType) {
        permissionCheck(
                StringUtils.hasText(resourceName) ? resourceName : "alert",
                ResourceType.ALERT,
                accessType,
                UserContextHolder.getAccessInfo());
    }

    private AlertRule requireRule(Long ruleId) {
        AlertRule rule = alertRuleDao.getById(ruleId);
        if (rule == null || !rule.getWorkspaceId().equals(ServletUtils.getCurrentWorkspaceId())) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.RESOURCE_NOT_FOUND, "alert rule " + ruleId);
        }
        return rule;
    }

    private void validateRule(AlertRuleReq req) {
        if (req == null || !StringUtils.hasText(req.getName())) {
            throw new SeatunnelException(SeatunnelErrorEnum.PARAM_CAN_NOT_BE_NULL, "name");
        }
        if (!StringUtils.hasText(req.getWebhookUrl())) {
            throw new SeatunnelException(SeatunnelErrorEnum.PARAM_CAN_NOT_BE_NULL, "webhookUrl");
        }
        String url = req.getWebhookUrl().trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.INVALID_PARAM, "webhookUrl", "must start with http(s)://");
        }
        if (req.getCooldownSeconds() != null && req.getCooldownSeconds() < 0) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.INVALID_PARAM, "cooldownSeconds", "must not be negative");
        }
    }

    private String normalizeEventType(String eventType) {
        return StringUtils.hasText(eventType) ? eventType.trim() : AlertRule.EVENT_TYPE_JOB_FAILED;
    }

    private AlertRuleRes toRuleRes(AlertRule rule) {
        AlertRuleRes res = new AlertRuleRes();
        res.setId(rule.getId());
        res.setName(rule.getName());
        res.setEventType(rule.getEventType());
        res.setWebhookUrl(rule.getWebhookUrl());
        res.setWebhookHeaders(rule.getWebhookHeaders());
        res.setWebhookTemplate(rule.getWebhookTemplate());
        res.setStatus(rule.getStatus());
        res.setCooldownSeconds(rule.getCooldownSeconds());
        res.setCreateTime(rule.getCreateTime());
        res.setUpdateTime(rule.getUpdateTime());
        return res;
    }

    private List<AlertEventRes> toEventResList(List<AlertEvent> events) {
        if (events == null || events.isEmpty()) {
            return Collections.emptyList();
        }
        // 批量取规则名，避免逐条查询造成 N+1
        Map<Long, String> ruleNames = new HashMap<>();
        List<Long> ruleIds =
                events.stream()
                        .map(AlertEvent::getRuleId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
        if (!ruleIds.isEmpty()) {
            for (AlertRule rule : alertRuleDao.listByIds(ruleIds)) {
                ruleNames.put(rule.getId(), rule.getName());
            }
        }
        List<AlertEventRes> result = new ArrayList<>(events.size());
        for (AlertEvent event : events) {
            AlertEventRes res = new AlertEventRes();
            res.setId(event.getId());
            res.setRuleId(event.getRuleId());
            res.setRuleName(ruleNames.get(event.getRuleId()));
            res.setJobInstanceId(event.getJobInstanceId());
            res.setJobDefineName(event.getJobDefineName());
            res.setErrorMessage(event.getErrorMessage());
            res.setSendStatus(event.getSendStatus());
            res.setRetryCount(event.getRetryCount());
            res.setSendTime(event.getSendTime());
            res.setCreateTime(event.getCreateTime());
            result.add(res);
        }
        return result;
    }
}
