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

import org.apache.seatunnel.app.common.Result;
import org.apache.seatunnel.app.common.ScheduleConcurrentPolicy;
import org.apache.seatunnel.app.common.ScheduleStatusEnum;
import org.apache.seatunnel.app.common.ScheduleTriggerStatus;
import org.apache.seatunnel.app.dal.dao.IJobDefinitionDao;
import org.apache.seatunnel.app.dal.dao.IJobInstanceDao;
import org.apache.seatunnel.app.dal.dao.IJobScheduleDao;
import org.apache.seatunnel.app.dal.dao.IJobScheduleTriggerLogDao;
import org.apache.seatunnel.app.dal.dao.IUserDao;
import org.apache.seatunnel.app.dal.dao.IWorkspaceDao;
import org.apache.seatunnel.app.dal.entity.JobDefinition;
import org.apache.seatunnel.app.dal.entity.JobSchedule;
import org.apache.seatunnel.app.dal.entity.JobScheduleTriggerLog;
import org.apache.seatunnel.app.dal.entity.User;
import org.apache.seatunnel.app.dal.entity.Workspace;
import org.apache.seatunnel.app.domain.request.job.JobScheduleCronPreviewReq;
import org.apache.seatunnel.app.domain.request.job.JobScheduleReq;
import org.apache.seatunnel.app.domain.response.job.JobScheduleRes;
import org.apache.seatunnel.app.domain.response.job.JobScheduleTriggerLogRes;
import org.apache.seatunnel.app.scheduler.JobScheduleConstants;
import org.apache.seatunnel.app.scheduler.JobScheduleManager;
import org.apache.seatunnel.app.security.UserContext;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.IJobExecutorService;
import org.apache.seatunnel.app.service.IJobScheduleService;
import org.apache.seatunnel.app.utils.PageInfo;
import org.apache.seatunnel.app.utils.ServletUtils;
import org.apache.seatunnel.common.access.AccessInfo;
import org.apache.seatunnel.common.constants.JobMode;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.quartz.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;
import java.util.stream.Collectors;

@Slf4j
@Service
public class JobScheduleServiceImpl implements IJobScheduleService {

    @Resource private IJobScheduleDao jobScheduleDao;

    @Resource private IJobScheduleTriggerLogDao jobScheduleTriggerLogDao;

    @Resource private IJobDefinitionDao jobDefinitionDao;

    @Resource private IJobInstanceDao jobInstanceDao;

    @Resource private IJobExecutorService jobExecutorService;

    @Resource private IUserDao userDao;

    @Resource private IWorkspaceDao workspaceDao;

    @Resource private JobScheduleManager jobScheduleManager;

    @Override
    public Long createSchedule(JobScheduleReq req) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        Integer userId = ServletUtils.getCurrentUserId();
        validateRequest(req, null);
        JobSchedule exists =
                jobScheduleDao.getByJobDefinitionId(req.getJobDefinitionId(), workspaceId);
        if (exists != null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_ALREADY_EXISTS, req.getJobDefinitionId());
        }
        Date now = new Date();
        JobSchedule schedule =
                JobSchedule.builder()
                        .id(generateId())
                        .jobDefinitionId(req.getJobDefinitionId())
                        .cronExpression(req.getCronExpression())
                        .timezone(req.getTimezone())
                        .retryTimes(req.getRetryTimes() == null ? 0 : req.getRetryTimes())
                        .retryInterval(req.getRetryInterval() == null ? 0 : req.getRetryInterval())
                        .activeStartTime(req.getActiveStartTime())
                        .activeEndTime(req.getActiveEndTime())
                        .status(ScheduleStatusEnum.DISABLED.getCode())
                        .concurrentPolicy(req.getConcurrentPolicy())
                        .misfirePolicy(req.getMisfirePolicy())
                        .notifyType(req.getNotifyType())
                        .notifyTarget(req.getNotifyTarget())
                        .createUserId(userId)
                        .updateUserId(userId)
                        .createTime(now)
                        .updateTime(now)
                        .workspaceId(workspaceId)
                        .build();
        jobScheduleDao.insert(schedule);
        return schedule.getId();
    }

    @Override
    public void updateSchedule(Long scheduleId, JobScheduleReq req) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        Integer userId = ServletUtils.getCurrentUserId();
        JobSchedule schedule = getScheduleOrThrow(scheduleId, workspaceId);
        validateRequest(req, schedule);
        schedule.setCronExpression(req.getCronExpression());
        schedule.setTimezone(req.getTimezone());
        schedule.setRetryTimes(req.getRetryTimes() == null ? 0 : req.getRetryTimes());
        schedule.setRetryInterval(req.getRetryInterval() == null ? 0 : req.getRetryInterval());
        schedule.setActiveStartTime(req.getActiveStartTime());
        schedule.setActiveEndTime(req.getActiveEndTime());
        schedule.setConcurrentPolicy(req.getConcurrentPolicy());
        schedule.setMisfirePolicy(req.getMisfirePolicy());
        schedule.setNotifyType(req.getNotifyType());
        schedule.setNotifyTarget(req.getNotifyTarget());
        schedule.setUpdateUserId(userId);
        schedule.setUpdateTime(new Date());
        if (schedule.getStatus() != null
                && schedule.getStatus() == ScheduleStatusEnum.ENABLED.getCode()) {
            try {
                jobScheduleManager.createOrUpdateSchedule(schedule);
            } catch (Exception e) {
                throw new SeatunnelException(
                        SeatunnelErrorEnum.JOB_SCHEDULE_QUARTZ_OPERATION_FAILED,
                        "update",
                        e.getMessage());
            }
        }
        jobScheduleDao.update(schedule);
    }

    @Override
    public void deleteSchedule(Long scheduleId) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        JobSchedule schedule = getScheduleOrThrow(scheduleId, workspaceId);
        try {
            jobScheduleManager.deleteSchedule(schedule.getId());
        } catch (Exception e) {
            log.error("Delete schedule from quartz failed, scheduleId: {}", scheduleId, e);
        }
        jobScheduleTriggerLogDao.deleteByScheduleId(scheduleId);
        jobScheduleDao.deleteById(scheduleId);
    }

    @Override
    public void enableSchedule(Long scheduleId) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        Integer userId = ServletUtils.getCurrentUserId();
        JobSchedule schedule = getScheduleOrThrow(scheduleId, workspaceId);
        validateCron(schedule.getCronExpression());
        schedule.setStatus(ScheduleStatusEnum.ENABLED.getCode());
        schedule.setUpdateUserId(userId);
        schedule.setUpdateTime(new Date());
        try {
            jobScheduleManager.enableSchedule(schedule);
        } catch (Exception e) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_QUARTZ_OPERATION_FAILED,
                    "enable",
                    e.getMessage());
        }
        jobScheduleDao.update(schedule);
    }

    @Override
    public void disableSchedule(Long scheduleId) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        Integer userId = ServletUtils.getCurrentUserId();
        JobSchedule schedule = getScheduleOrThrow(scheduleId, workspaceId);
        schedule.setStatus(ScheduleStatusEnum.DISABLED.getCode());
        schedule.setUpdateUserId(userId);
        schedule.setUpdateTime(new Date());
        try {
            jobScheduleManager.disableSchedule(schedule.getId());
        } catch (Exception e) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_QUARTZ_OPERATION_FAILED,
                    "disable",
                    e.getMessage());
        }
        jobScheduleDao.update(schedule);
    }

    @Override
    public PageInfo<JobScheduleRes> pageSchedule(
            Integer pageNo, Integer pageSize, Integer status, String jobName) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        IPage<JobSchedule> schedulePage =
                jobScheduleDao.queryPage(
                        new Page<>(pageNo, pageSize), workspaceId, status, jobName);
        List<JobScheduleRes> records =
                schedulePage.getRecords().stream()
                        .map(this::toScheduleRes)
                        .collect(Collectors.toList());
        PageInfo<JobScheduleRes> pageInfo = new PageInfo<>(pageNo, pageSize);
        pageInfo.setTotal((int) schedulePage.getTotal());
        pageInfo.setTotalList(records);
        return pageInfo;
    }

    @Override
    public PageInfo<JobScheduleTriggerLogRes> pageTriggerLog(
            Long scheduleId, Integer pageNo, Integer pageSize) {
        Long workspaceId = ServletUtils.getCurrentWorkspaceId();
        IPage<JobScheduleTriggerLog> logPage =
                jobScheduleTriggerLogDao.queryPage(
                        new Page<>(pageNo, pageSize), scheduleId, workspaceId);
        List<JobScheduleTriggerLogRes> records =
                logPage.getRecords().stream()
                        .map(this::toTriggerLogRes)
                        .collect(Collectors.toList());
        PageInfo<JobScheduleTriggerLogRes> pageInfo = new PageInfo<>(pageNo, pageSize);
        pageInfo.setTotal((int) logPage.getTotal());
        pageInfo.setTotalList(records);
        return pageInfo;
    }

    @Override
    public void triggerSchedule(Long scheduleId, Date scheduledFireTime) {
        JobSchedule schedule = jobScheduleDao.getById(scheduleId);
        if (schedule == null) {
            log.warn("Schedule not found when triggered, scheduleId: {}", scheduleId);
            return;
        }
        if (schedule.getStatus() == null
                || schedule.getStatus() != ScheduleStatusEnum.ENABLED.getCode()) {
            log.warn(
                    "Schedule is disabled when triggered, scheduleId: {}, skip execution",
                    scheduleId);
            return;
        }
        Date now = new Date();
        if (schedule.getActiveStartTime() != null && now.before(schedule.getActiveStartTime())) {
            return;
        }
        if (schedule.getActiveEndTime() != null && now.after(schedule.getActiveEndTime())) {
            return;
        }
        Long workspaceId = schedule.getWorkspaceId();
        Long activeCount =
                jobInstanceDao.countActiveByJobDefinitionId(
                        schedule.getJobDefinitionId(), workspaceId);
        boolean concurrentPolicySkip =
                schedule.getConcurrentPolicy() == null
                        || schedule.getConcurrentPolicy()
                                == ScheduleConcurrentPolicy.SKIP.getCode();
        if (activeCount > 0 && concurrentPolicySkip) {
            log.warn(
                    "Schedule job has active instance, skip execution, scheduleId: {}, jobDefinitionId: {}",
                    scheduleId,
                    schedule.getJobDefinitionId());
            insertTriggerLog(
                    schedule,
                    scheduledFireTime,
                    ScheduleTriggerStatus.SKIPPED.getCode(),
                    null,
                    null,
                    "There is already an active job instance, the schedule trigger was skipped.");
            return;
        }
        Long triggerLogId =
                insertTriggerLog(
                        schedule,
                        scheduledFireTime,
                        ScheduleTriggerStatus.RUNNING.getCode(),
                        null,
                        null,
                        null);
        // Quartz threads have no HTTP request context, so UserContextHolder.getUser() throws
        // "User context not found" when the scheduled job reaches jobExecute ->
        // createExecuteResource.
        // Inject the schedule creator's user context here and clean it up in a finally block to
        // prevent context leaking into other Quartz jobs on the same worker thread.
        boolean userContextInjected = false;
        try {
            if (!UserContextHolder.hasUserContext()) {
                UserContextHolder.setUserContext(buildScheduleUserContext(schedule));
                userContextInjected = true;
            }
            Result<Long> executeResult =
                    jobExecutorService.jobExecute(schedule.getJobDefinitionId(), null);
            if (executeResult.getCode() == 0) {
                updateTriggerLog(
                        triggerLogId,
                        ScheduleTriggerStatus.SUCCESS.getCode(),
                        executeResult.getData(),
                        null);
            } else {
                updateTriggerLog(
                        triggerLogId,
                        ScheduleTriggerStatus.FAILED.getCode(),
                        null,
                        executeResult.getMsg());
                log.error(
                        "Schedule job execute failed, scheduleId: {}, jobDefinitionId: {}, error: {}",
                        scheduleId,
                        schedule.getJobDefinitionId(),
                        executeResult.getMsg());
            }
        } catch (Exception e) {
            updateTriggerLog(
                    triggerLogId, ScheduleTriggerStatus.FAILED.getCode(), null, e.getMessage());
            log.error(
                    "Schedule job execute failed, scheduleId: {}, jobDefinitionId: {}",
                    scheduleId,
                    schedule.getJobDefinitionId(),
                    e);
        } finally {
            if (userContextInjected) {
                UserContextHolder.clear();
            }
        }
    }

    @Override
    public List<Date> previewCronExecution(JobScheduleCronPreviewReq req) {
        validateCron(req.getCronExpression());
        int count = req.getCount() == null ? 5 : req.getCount();
        if (count <= 0 || count > 100) {
            count = 5;
        }
        List<Date> nextFireTimes = new ArrayList<>();
        try {
            CronExpression cronExpression = new CronExpression(req.getCronExpression());
            String timezone =
                    StringUtils.hasText(req.getTimezone())
                            ? req.getTimezone()
                            : JobScheduleConstants.DEFAULT_TIMEZONE;
            cronExpression.setTimeZone(TimeZone.getTimeZone(timezone));
            Date nextTime = new Date();
            for (int i = 0; i < count; i++) {
                nextTime = cronExpression.getNextValidTimeAfter(nextTime);
                if (nextTime == null) {
                    break;
                }
                nextFireTimes.add(nextTime);
            }
            return nextFireTimes;
        } catch (ParseException e) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_INVALID_CRON, req.getCronExpression());
        }
    }

    private Long insertTriggerLog(
            JobSchedule schedule,
            Date scheduledFireTime,
            Integer status,
            Long jobInstanceId,
            Integer retryCount,
            String errorMessage) {
        Date now = new Date();
        JobScheduleTriggerLog triggerLog =
                JobScheduleTriggerLog.builder()
                        .id(generateId())
                        .scheduleId(schedule.getId())
                        .jobDefinitionId(schedule.getJobDefinitionId())
                        .scheduledFireTime(scheduledFireTime)
                        .actualFireTime(now)
                        .status(status)
                        .retryCount(retryCount == null ? 0 : retryCount)
                        .jobInstanceId(jobInstanceId)
                        .errorMessage(errorMessage)
                        .createTime(now)
                        .updateTime(now)
                        .workspaceId(schedule.getWorkspaceId())
                        .build();
        jobScheduleTriggerLogDao.insert(triggerLog);
        return triggerLog.getId();
    }

    private void updateTriggerLog(
            Long triggerLogId, Integer status, Long jobInstanceId, String errorMessage) {
        JobScheduleTriggerLog triggerLog = jobScheduleTriggerLogDao.getById(triggerLogId);
        if (triggerLog == null) {
            return;
        }
        triggerLog.setStatus(status);
        triggerLog.setJobInstanceId(jobInstanceId);
        triggerLog.setErrorMessage(errorMessage);
        triggerLog.setEndTime(new Date());
        triggerLog.setUpdateTime(new Date());
        jobScheduleTriggerLogDao.update(triggerLog);
    }

    private UserContext buildScheduleUserContext(JobSchedule schedule) {
        User user = userDao.getById(schedule.getCreateUserId());
        if (user == null) {
            throw new SeatunnelException(SeatunnelErrorEnum.NO_SUCH_USER);
        }
        Workspace workspace = workspaceDao.selectWorkspaceById(schedule.getWorkspaceId());
        AccessInfo accessInfo = new AccessInfo();
        accessInfo.setUsername(user.getUsername());
        accessInfo.setWorkspaceName(workspace == null ? null : workspace.getWorkspaceName());
        return new UserContext(user, schedule.getWorkspaceId(), accessInfo);
    }

    private JobSchedule getScheduleOrThrow(Long scheduleId, Long workspaceId) {
        JobSchedule schedule = jobScheduleDao.getById(scheduleId);
        if (schedule == null || !schedule.getWorkspaceId().equals(workspaceId)) {
            throw new SeatunnelException(SeatunnelErrorEnum.JOB_SCHEDULE_NOT_FOUND);
        }
        return schedule;
    }

    private void validateRequest(JobScheduleReq req, JobSchedule schedule) {
        JobDefinition jobDefinition = jobDefinitionDao.getJob(req.getJobDefinitionId());
        if (jobDefinition == null) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_JOB_NOT_FOUND, req.getJobDefinitionId());
        }
        if (JobMode.STREAMING.name().equals(jobDefinition.getJobMode())) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_STREAMING_NOT_SUPPORTED,
                    jobDefinition.getName());
        }
        validateCron(req.getCronExpression());
        if (req.getActiveStartTime() != null
                && req.getActiveEndTime() != null
                && req.getActiveStartTime().after(req.getActiveEndTime())) {
            throw new SeatunnelException(SeatunnelErrorEnum.JOB_SCHEDULE_INVALID_TIME_RANGE);
        }
    }

    private void validateCron(String cronExpression) {
        if (cronExpression == null || !CronExpression.isValidExpression(cronExpression)) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.JOB_SCHEDULE_INVALID_CRON, cronExpression);
        }
    }

    private JobScheduleRes toScheduleRes(JobSchedule schedule) {
        JobScheduleRes res = new JobScheduleRes();
        res.setId(schedule.getId());
        res.setJobDefinitionId(schedule.getJobDefinitionId());
        res.setJobName(getJobName(schedule.getJobDefinitionId()));
        res.setCronExpression(schedule.getCronExpression());
        res.setTimezone(schedule.getTimezone());
        res.setRetryTimes(schedule.getRetryTimes());
        res.setRetryInterval(schedule.getRetryInterval());
        res.setActiveStartTime(schedule.getActiveStartTime());
        res.setActiveEndTime(schedule.getActiveEndTime());
        res.setStatus(schedule.getStatus());
        res.setConcurrentPolicy(schedule.getConcurrentPolicy());
        res.setMisfirePolicy(schedule.getMisfirePolicy());
        res.setNotifyType(schedule.getNotifyType());
        res.setNotifyTarget(schedule.getNotifyTarget());
        res.setCreateTime(schedule.getCreateTime());
        res.setUpdateTime(schedule.getUpdateTime());
        return res;
    }

    private JobScheduleTriggerLogRes toTriggerLogRes(JobScheduleTriggerLog log) {
        JobScheduleTriggerLogRes res = new JobScheduleTriggerLogRes();
        res.setId(log.getId());
        res.setScheduleId(log.getScheduleId());
        res.setJobDefinitionId(log.getJobDefinitionId());
        res.setJobName(getJobName(log.getJobDefinitionId()));
        res.setScheduledFireTime(log.getScheduledFireTime());
        res.setActualFireTime(log.getActualFireTime());
        res.setEndTime(log.getEndTime());
        res.setStatus(log.getStatus());
        res.setRetryCount(log.getRetryCount());
        res.setJobInstanceId(log.getJobInstanceId());
        res.setErrorMessage(log.getErrorMessage());
        res.setCreateTime(log.getCreateTime());
        res.setUpdateTime(log.getUpdateTime());
        return res;
    }

    private String getJobName(Long jobDefinitionId) {
        JobDefinition jobDefinition = jobDefinitionDao.getJob(jobDefinitionId);
        return jobDefinition == null ? null : jobDefinition.getName();
    }

    private Long generateId() {
        try {
            return CodeGenerateUtils.getInstance().genCode();
        } catch (CodeGenerateUtils.CodeGenerateException e) {
            throw new SeatunnelException(SeatunnelErrorEnum.JOB_RUN_GENERATE_UUID_ERROR);
        }
    }
}
