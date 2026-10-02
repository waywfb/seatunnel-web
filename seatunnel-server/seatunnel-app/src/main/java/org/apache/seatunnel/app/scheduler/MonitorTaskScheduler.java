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

package org.apache.seatunnel.app.scheduler;

import org.apache.seatunnel.shade.com.fasterxml.jackson.databind.JsonNode;
import org.apache.seatunnel.shade.com.google.common.util.concurrent.ThreadFactoryBuilder;

import org.apache.seatunnel.app.dal.dao.IJobInstanceDao;
import org.apache.seatunnel.app.dal.dao.IJobMetricsHistoryDao;
import org.apache.seatunnel.app.dal.entity.JobInstance;
import org.apache.seatunnel.app.dal.entity.JobMetricsHistory;
import org.apache.seatunnel.app.domain.response.metrics.JobPipelineDetailMetricsRes;
import org.apache.seatunnel.app.service.IJobMetricsService;
import org.apache.seatunnel.app.thirdparty.engine.SeaTunnelEngineProxy;
import org.apache.seatunnel.app.utils.JobUtils;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.engine.common.job.JobStatus;

import org.apache.commons.lang3.StringUtils;

import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import javax.annotation.PreDestroy;
import javax.annotation.Resource;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MonitorTaskScheduler {

    private final ExecutorService executorService;

    @Resource private IJobInstanceDao jobInstanceDao;

    @Resource private IJobMetricsService jobMetricsService;

    @Resource private IJobMetricsHistoryDao jobMetricsHistoryDao;

    private final ConcurrentHashMap<Long, JobInstance> jobInstanceMap = new ConcurrentHashMap<>();

    private final Object mapLock = new Object();

    /** 引擎返回 UNKNOWABLE（重启/故障转移后丢失任务状态）时写入 error_message 的显性标记， 供前端提示“引擎侧已丢失，可重新拉起” */
    private static final String ENGINE_STATUS_LOST_MESSAGE = "引擎任务状态丢失（引擎重启或故障转移），可重新拉起该实例";

    public MonitorTaskScheduler() {
        // Create thread pool
        this.executorService =
                new ThreadPoolExecutor(
                        5,
                        10,
                        60L,
                        TimeUnit.SECONDS,
                        new LinkedBlockingQueue<>(100),
                        new ThreadFactoryBuilder()
                                .setNameFormat("task-processor-%d")
                                .setUncaughtExceptionHandler(
                                        (t, e) ->
                                                log.error(
                                                        "Thread {} encountered uncaught exception",
                                                        t.getName(),
                                                        e))
                                .build(),
                        new ThreadPoolExecutor.CallerRunsPolicy());
    }

    @Scheduled(initialDelay = 0, fixedRate = 60000)
    public void updateJobInstance() {
        try {
            log.info("Start updating job instance information...");
            List<JobInstance> allJobInstance = jobInstanceDao.getAllUnfinishedJobInstance();

            Map<Long, JobInstance> newInstanceMap =
                    allJobInstance.stream()
                            .collect(
                                    Collectors.toMap(
                                            JobInstance::getId,
                                            instance -> instance,
                                            (existing, replacement) -> replacement));

            synchronized (mapLock) {
                jobInstanceMap.clear();
                jobInstanceMap.putAll(newInstanceMap);
            }

            log.debug(
                    "Job instance information updated, current total instances: {}",
                    jobInstanceMap.size());
        } catch (Exception e) {
            log.error("Error updating job instance information", e);
        }
    }

    public JobInstance getJobInstance(Long jobInstanceId) {
        synchronized (mapLock) {
            return jobInstanceMap.get(jobInstanceId);
        }
    }

    public List<JobInstance> getAllJobInstances() {
        synchronized (mapLock) {
            return new ArrayList<>(jobInstanceMap.values());
        }
    }

    @Scheduled(fixedDelay = 5000)
    public void scheduleTasks() {
        List<JobInstance> instances;
        synchronized (mapLock) {
            instances = new ArrayList<>(jobInstanceMap.values());
        }

        instances.forEach(
                jobInstance -> {
                    if (jobInstance.getJobStatus() != JobStatus.RUNNING) {
                        return;
                    }
                    try {
                        executorService.submit(
                                () -> {
                                    try {
                                        Long jobInstanceId = jobInstance.getId();
                                        List<JobPipelineDetailMetricsRes> metricsResList =
                                                jobMetricsService.getJobPipelineDetailMetricsRes(
                                                        jobInstance);

                                        if (metricsResList != null && !metricsResList.isEmpty()) {
                                            List<JobMetricsHistory> historyList =
                                                    metricsResList.stream()
                                                            .map(
                                                                    metrics ->
                                                                            convertToJobMetricsHistory(
                                                                                    metrics,
                                                                                    jobInstanceId))
                                                            .collect(Collectors.toList());

                                            jobMetricsHistoryDao.insertBatch(historyList);
                                            log.debug(
                                                    "Successfully saved metrics for job {}, total {} records",
                                                    jobInstanceId,
                                                    historyList.size());
                                        }

                                        // 同时刷新 t_job_metrics 的累计行数：
                                        // 实例列表在引擎快照缺失时以 DB 为准，
                                        // 若运行期间从不落库，统计会随快照抖动归零
                                        jobMetricsService.syncRunningMetricsToDb(jobInstance);
                                    } catch (Exception e) {
                                        log.error(
                                                "Error saving job metrics for job instance {}",
                                                jobInstance.getId(),
                                                e);
                                        // DB/持久层异常与引擎作业是否存在无关，跳过引擎核对，
                                        // 避免每次 DB 抖动都多发一次引擎 RPC
                                        if (!(e instanceof DataAccessException)) {
                                            handleEngineJobNotFound(jobInstance);
                                        }
                                    }
                                });
                    } catch (Exception e) {
                        log.error("Task scheduling error", e);
                    }
                });
    }

    @Scheduled(fixedDelay = 3000)
    public void syncEngineStatusToDB() {
        try {
            List<JobInstance> runningInstances = jobInstanceDao.getAllUnfinishedJobInstance();
            if (runningInstances.isEmpty()) {
                return;
            }
            Set<Long> engineRunningJobIds = getEngineRunningJobIds();
            for (JobInstance jobInstance : runningInstances) {
                String jobEngineId = jobInstance.getJobEngineId();
                if (jobEngineId == null) {
                    continue;
                }
                long engineJobId = Long.parseLong(jobEngineId);
                if (engineRunningJobIds.contains(engineJobId)) {
                    // 引擎仍在运行：DB 状态可能停留在暂停/中间态（如从 savepoint 恢复后未回写）
                    if (jobInstance.getJobStatus() != JobStatus.RUNNING) {
                        int updated =
                                jobInstanceDao
                                        .getJobInstanceMapper()
                                        .updateStatusIfNotEndState(
                                                jobInstance.getId(),
                                                JobStatus.RUNNING,
                                                null,
                                                lostMessageOnSync(
                                                        JobStatus.RUNNING,
                                                        jobInstance.getJobStatus()));
                        if (updated > 0) {
                            log.info(
                                    "Job instance {} is running on engine, DB status {} updated to RUNNING",
                                    jobInstance.getId(),
                                    jobInstance.getJobStatus());
                        }
                    }
                    continue;
                }
                JobStatus engineStatus =
                        SeaTunnelEngineProxy.getInstance().getJobStatus(jobEngineId);
                if (engineStatus == null || engineStatus == jobInstance.getJobStatus()) {
                    continue;
                }
                // 非终态回写时清空 end_time，恢复运行后运行时长重新计时
                Date endTime = JobUtils.isJobEndStatus(engineStatus) ? new Date() : null;
                int updated =
                        jobInstanceDao
                                .getJobInstanceMapper()
                                .updateStatusIfNotEndState(
                                        jobInstance.getId(),
                                        engineStatus,
                                        endTime,
                                        lostMessageOnSync(
                                                engineStatus, jobInstance.getJobStatus()));
                if (updated > 0) {
                    log.info(
                            "Job instance {} engine status {} differs from DB status {}, updated",
                            jobInstance.getId(),
                            engineStatus,
                            jobInstance.getJobStatus());
                    if (JobUtils.isJobEndStatus(engineStatus)) {
                        synchronized (mapLock) {
                            jobInstanceMap.remove(jobInstance.getId());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to sync engine status to database", e);
        }
    }

    private Set<Long> getEngineRunningJobIds() {
        Set<Long> engineRunningJobIds = new HashSet<>();
        try {
            String allJobMetricsContent =
                    SeaTunnelEngineProxy.getInstance().refreshRunningJobMetricsCache();
            if (StringUtils.isEmpty(allJobMetricsContent)) {
                return engineRunningJobIds;
            }
            JsonNode jsonNode = JsonUtils.stringToJsonNode(allJobMetricsContent);
            for (JsonNode item : jsonNode) {
                JsonNode sourceReceivedCount = item.get("metrics").get("SourceReceivedCount");
                if (sourceReceivedCount != null && sourceReceivedCount.isArray()) {
                    for (JsonNode node : sourceReceivedCount) {
                        engineRunningJobIds.add(node.get("tags").get("jobId").asLong());
                    }
                }
                JsonNode sinkWriteCount = item.get("metrics").get("SinkWriteCount");
                if (sinkWriteCount != null && sinkWriteCount.isArray()) {
                    for (JsonNode node : sinkWriteCount) {
                        engineRunningJobIds.add(node.get("tags").get("jobId").asLong());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse engine running job metrics", e);
        }
        return engineRunningJobIds;
    }

    /**
     * 计算状态回写时需要一并维护的 error_message： 引擎返回 UNKNOWABLE 时写入丢失标记；从 UNKNOWABLE
     * 迁出（重新拉起后引擎恢复运行/转入其他状态）时传空串清空；其余场景传 null，不触碰该列
     */
    private String lostMessageOnSync(JobStatus engineStatus, JobStatus dbStatus) {
        if (engineStatus == JobStatus.UNKNOWABLE) {
            return ENGINE_STATUS_LOST_MESSAGE;
        }
        return dbStatus == JobStatus.UNKNOWABLE ? "" : null;
    }

    private void handleEngineJobNotFound(JobInstance jobInstance) {
        try {
            String jobEngineId = jobInstance.getJobEngineId();
            if (jobEngineId == null) {
                return;
            }
            JobStatus engineStatus = SeaTunnelEngineProxy.getInstance().getJobStatus(jobEngineId);
            if (engineStatus == null) {
                // getJobStatus 对所有异常（引擎不可达/查询失败）都返回 null，无法证明作业已结束；
                // 作业真丢失时引擎会正常应答 UNKNOWABLE，由 syncEngineStatusToDB 处理。
                // 这里若把 null 当 FAILED 回写，引擎抖动瞬间会把所有 RUNNING 实例误标终态并永久卡死。
                log.warn(
                        "Job instance {} (engineId={}) status query returned null,"
                                + " cannot determine engine state, skip status update",
                        jobInstance.getId(),
                        jobEngineId);
                return;
            }
            if (JobUtils.isJobEndStatus(engineStatus)) {
                log.warn(
                        "Job instance {} (engineId={}) is no longer running on engine,"
                                + " updating DB status to {}",
                        jobInstance.getId(),
                        jobEngineId,
                        engineStatus);
                JobStatus finalStatus = engineStatus;
                // 条件更新，避免覆盖用户主动停止/强制成功写入的终态
                int updated =
                        jobInstanceDao
                                .getJobInstanceMapper()
                                .updateStatusIfNotEndState(
                                        jobInstance.getId(),
                                        finalStatus,
                                        new Date(),
                                        lostMessageOnSync(finalStatus, jobInstance.getJobStatus()));
                if (updated > 0) {
                    synchronized (mapLock) {
                        jobInstanceMap.remove(jobInstance.getId());
                    }
                }
            }
        } catch (Exception ex) {
            log.warn(
                    "Failed to verify job status on engine for job instance {}",
                    jobInstance.getId(),
                    ex);
        }
    }

    private JobMetricsHistory convertToJobMetricsHistory(
            JobPipelineDetailMetricsRes metrics, Long jobInstanceId) {
        return JobMetricsHistory.builder()
                .id(generateId())
                .jobInstanceId(jobInstanceId)
                .pipelineId(metrics.getPipelineId())
                .readRowCount(metrics.getReadRowCount())
                .writeRowCount(metrics.getWriteRowCount())
                .sourceTableNames(metrics.getSourceTableNames())
                .sinkTableNames(metrics.getSinkTableNames())
                .readQps(metrics.getReadQps())
                .writeQps(metrics.getWriteQps())
                .recordDelay(metrics.getRecordDelay())
                .status(metrics.getStatus())
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .createUserId(-1)
                .updateUserId(-1)
                .build();
    }

    private Long generateId() {
        // Here you can use a distributed ID generator, such as Snowflake algorithm
        return System.currentTimeMillis();
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down task scheduler...");
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
