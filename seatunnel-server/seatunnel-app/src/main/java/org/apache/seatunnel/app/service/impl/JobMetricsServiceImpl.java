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

import org.apache.seatunnel.app.common.EngineType;
import org.apache.seatunnel.app.dal.dao.IJobInstanceDao;
import org.apache.seatunnel.app.dal.dao.IJobInstanceHistoryDao;
import org.apache.seatunnel.app.dal.dao.IJobMetricsDao;
import org.apache.seatunnel.app.dal.entity.JobInstance;
import org.apache.seatunnel.app.dal.entity.JobInstanceHistory;
import org.apache.seatunnel.app.dal.entity.JobMetrics;
import org.apache.seatunnel.app.dal.entity.JobMetricsHistory;
import org.apache.seatunnel.app.dal.mapper.JobMetricsHistoryMapper;
import org.apache.seatunnel.app.domain.response.engine.Engine;
import org.apache.seatunnel.app.domain.response.metrics.JobDAG;
import org.apache.seatunnel.app.domain.response.metrics.JobPipelineDetailMetricsRes;
import org.apache.seatunnel.app.domain.response.metrics.JobPipelineSummaryMetricsRes;
import org.apache.seatunnel.app.domain.response.metrics.JobSummaryMetricsRes;
import org.apache.seatunnel.app.permission.constants.SeatunnelFuncPermissionKeyConstant;
import org.apache.seatunnel.app.service.IJobMetricsService;
import org.apache.seatunnel.app.thirdparty.engine.SeaTunnelEngineProxy;
import org.apache.seatunnel.app.thirdparty.metrics.EngineMetricsExtractorFactory;
import org.apache.seatunnel.app.thirdparty.metrics.IEngineMetricsExtractor;
import org.apache.seatunnel.app.utils.JobUtils;
import org.apache.seatunnel.app.utils.ServletUtils;
import org.apache.seatunnel.common.constants.JobMode;
import org.apache.seatunnel.common.utils.JsonUtils;
import org.apache.seatunnel.engine.common.job.JobStatus;
import org.apache.seatunnel.server.common.CodeGenerateUtils;
import org.apache.seatunnel.server.common.Constants;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.ImmutablePair;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class JobMetricsServiceImpl extends SeatunnelBaseServiceImpl implements IJobMetricsService {

    /** 定时任务无 HTTP 会话时使用的系统用户 id */
    private static final int SYSTEM_USER_ID = -1;

    @Resource private IJobMetricsDao jobMetricsDao;

    @Resource private IJobInstanceHistoryDao jobInstanceHistoryDao;

    @Resource private IJobInstanceDao jobInstanceDao;

    @Autowired private JobMetricsHistoryMapper jobMetricsHistoryMapper;

    @Override
    public List<JobPipelineSummaryMetricsRes> getJobPipelineSummaryMetrics(
            @NonNull Long jobInstanceId) {
        int userId = ServletUtils.getCurrentUserId();
        funcPermissionCheck(SeatunnelFuncPermissionKeyConstant.JOB_METRICS_SUMMARY, userId);
        JobInstance jobInstance = jobInstanceDao.getJobInstance(jobInstanceId);
        List<JobMetrics> jobPipelineDetailMetrics = getJobPipelineDetailMetrics(jobInstance);
        return summaryMetrics(jobPipelineDetailMetrics);
    }

    @Override
    public List<JobPipelineSummaryMetricsRes> getJobPipelineSummaryMetrics(
            @NonNull JobInstance jobInstance) {
        if (JobUtils.isJobEndStatus(jobInstance.getJobStatus())) {
            return new ArrayList<>();
        }
        List<JobMetrics> jobPipelineDetailMetrics =
                getJobMetricsFromEngine(jobInstance, jobInstance.getJobEngineId());
        return summaryMetrics(jobPipelineDetailMetrics);
    }

    @Override
    public JobSummaryMetricsRes getJobSummaryMetrics(
            @NonNull Long jobInstanceId, @NonNull String jobEngineId) {
        int userId = ServletUtils.getCurrentUserId();
        funcPermissionCheck(SeatunnelFuncPermissionKeyConstant.JOB_METRICS_SUMMARY, userId);
        JobInstance jobInstance = jobInstanceDao.getJobInstance(jobInstanceId);
        Engine engine = new Engine(jobInstance.getEngineName(), jobInstance.getEngineVersion());
        IEngineMetricsExtractor engineMetricsExtractor =
                (new EngineMetricsExtractorFactory(engine)).getEngineMetricsExtractor();
        JobStatus jobStatus = engineMetricsExtractor.getJobStatus(jobEngineId);

        List<JobMetrics> jobPipelineDetailMetrics = getJobPipelineDetailMetrics(jobInstance);
        long readCount =
                jobPipelineDetailMetrics.stream().mapToLong(JobMetrics::getReadRowCount).sum();
        long writeCount =
                jobPipelineDetailMetrics.stream().mapToLong(JobMetrics::getWriteRowCount).sum();

        return new JobSummaryMetricsRes(
                jobInstanceId, Long.parseLong(jobEngineId), readCount, writeCount, jobStatus);
    }

    @Override
    public Map<Long, JobSummaryMetricsRes> getALLJobSummaryMetrics(
            @NonNull Map<Long, Long> jobInstanceIdAndJobEngineIdMap,
            @NonNull List<Long> jobInstanceIdList,
            @NonNull JobMode jobMode) {
        int userId = ServletUtils.getCurrentUserId();
        funcPermissionCheck(SeatunnelFuncPermissionKeyConstant.JOB_METRICS_SUMMARY, userId);
        if (jobInstanceIdList.isEmpty()) {
            log.debug("getALLJobSummaryMetrics : jobInstanceIdList is empty");
            return new HashMap<>();
        }
        List<JobInstance> allJobInstance = jobInstanceDao.getAllJobInstance(jobInstanceIdList);
        if (allJobInstance.isEmpty()) {
            log.warn(
                    "getALLJobSummaryMetrics : allJobInstance is empty, task id list is {}",
                    jobInstanceIdList);
            return new HashMap<>();
        }
        Map<Long, JobSummaryMetricsRes> result = null;
        Map<Long, HashMap<Integer, JobMetrics>> allRunningJobMetricsFromEngine =
                getAllRunningJobMetricsGroupedByEngine(allJobInstance);

        if (JobMode.BATCH == jobMode) {
            result =
                    getMatricsListIfTaskTypeIsBatch(
                            allJobInstance,
                            allRunningJobMetricsFromEngine,
                            jobInstanceIdAndJobEngineIdMap);
        } else if (JobMode.STREAMING == jobMode) {
            result =
                    getMatricsListIfTaskTypeIsStreaming(
                            allJobInstance,
                            allRunningJobMetricsFromEngine,
                            jobInstanceIdAndJobEngineIdMap);
        }

        return result;
    }

    private Map<Long, JobSummaryMetricsRes> getMatricsListIfTaskTypeIsBatch(
            List<JobInstance> allJobInstance,
            Map<Long, HashMap<Integer, JobMetrics>> allRunningJobMetricsFromEngine,
            Map<Long, Long> jobInstanceIdAndJobEngineIdMap) {

        HashMap<Long, JobSummaryMetricsRes> jobSummaryMetricsResMap = new HashMap<>();

        // Traverse all jobInstances in allJobInstance
        for (JobInstance jobInstance : allJobInstance) {
            try {
                JobStatus status = jobInstance.getJobStatus();
                Long engineId = jobInstanceIdAndJobEngineIdMap.get(jobInstance.getId());

                if (status == JobStatus.FINISHED || status == JobStatus.CANCELED) {
                    // If the status of the job is finished or cancelled, the monitoring
                    // information is directly obtained from MySQL
                    JobSummaryMetricsRes jobMetricsFromDb =
                            getJobSummaryMetricsResByDb(
                                    jobInstance, String.valueOf(engineId), engineId);
                    if (jobMetricsFromDb != null) {
                        jobSummaryMetricsResMap.put(jobInstance.getId(), jobMetricsFromDb);
                    }
                    continue;
                }

                // 运行中或中间态：引擎快照与 DB 记录取较大值，
                // 避免引擎瞬时快照缺失/计数器回退时数据量被覆盖为更小值或 0
                JobSummaryMetricsRes fromEngine =
                        getRunningJobMetricsFromEngine(
                                allRunningJobMetricsFromEngine,
                                jobInstanceIdAndJobEngineIdMap,
                                jobInstance);
                JobSummaryMetricsRes fromDb =
                        getJobSummaryMetricsResByDb(
                                jobInstance, String.valueOf(engineId), engineId);
                JobSummaryMetricsRes merged =
                        mergeKeepingLargerCounts(fromEngine, fromDb, jobInstance, engineId);
                if (merged != null) {
                    jobSummaryMetricsResMap.put(jobInstance.getId(), merged);
                }
            } catch (Exception e) {
                // 单实例指标获取失败时降级跳过，不因单个实例异常导致整个列表返回 500
                log.warn(
                        "Failed to get metrics for job instance {}, skip it",
                        jobInstance.getId(),
                        e);
            }
        }

        return jobSummaryMetricsResMap;
    }

    private Map<Long, JobSummaryMetricsRes> getMatricsListIfTaskTypeIsStreaming(
            List<JobInstance> allJobInstance,
            Map<Long, HashMap<Integer, JobMetrics>> allRunningJobMetricsFromEngine,
            Map<Long, Long> jobInstanceIdAndJobEngineIdMap) {

        HashMap<Long, JobSummaryMetricsRes> jobSummaryMetricsResMap = new HashMap<>();

        // Traverse all jobInstances in allJobInstance
        for (JobInstance jobInstance : allJobInstance) {
            try {
                JobStatus status = jobInstance.getJobStatus();
                Long engineId = jobInstanceIdAndJobEngineIdMap.get(jobInstance.getId());

                // 已取消/已彻底结束的实例以 DB 记录为准，引擎侧数据不再可靠。
                // SAVEPOINT_DONE 是可恢复的暂停态，仍需读取指标
                if (status != null && status.isEndState() && status != JobStatus.SAVEPOINT_DONE) {
                    JobSummaryMetricsRes jobMetricsFromDb =
                            getJobSummaryMetricsResByDb(
                                    jobInstance, String.valueOf(engineId), engineId);
                    if (jobMetricsFromDb != null) {
                        jobSummaryMetricsResMap.put(jobInstance.getId(), jobMetricsFromDb);
                    }
                    continue;
                }

                // 运行中（含从 savepoint 恢复的实例）：引擎快照与 DB 记录取较大值，
                // 避免引擎瞬时快照缺失/计数器回退时数据量被覆盖为更小值或 0
                JobSummaryMetricsRes fromEngine =
                        getRunningJobMetricsFromEngine(
                                allRunningJobMetricsFromEngine,
                                jobInstanceIdAndJobEngineIdMap,
                                jobInstance);
                JobSummaryMetricsRes fromDb =
                        getJobSummaryMetricsResByDb(
                                jobInstance, String.valueOf(engineId), engineId);
                JobSummaryMetricsRes merged =
                        mergeKeepingLargerCounts(fromEngine, fromDb, jobInstance, engineId);
                if (merged != null) {
                    jobSummaryMetricsResMap.put(jobInstance.getId(), merged);
                }
            } catch (Exception e) {
                // 单实例指标获取失败时降级跳过，不因单个实例异常导致整个列表返回 500
                log.warn(
                        "Failed to get metrics for job instance {}, skip it",
                        jobInstance.getId(),
                        e);
            }
        }
        return jobSummaryMetricsResMap;
    }

    /** 合并引擎快照与 DB 记录的行数：行数是单调递增的累计量，任一来源出现 0 或更小值时保留较大值， 避免运行一段时间后统计被瞬时快照覆盖成 0。 */
    private JobSummaryMetricsRes mergeKeepingLargerCounts(
            JobSummaryMetricsRes fromEngine,
            JobSummaryMetricsRes fromDb,
            JobInstance jobInstance,
            Long engineId) {
        if (fromEngine == null) {
            return fromDb;
        }
        if (fromDb == null) {
            return fromEngine;
        }
        return new JobSummaryMetricsRes(
                jobInstance.getId(),
                engineId != null ? engineId : fromEngine.getJobEngineId(),
                Math.max(fromEngine.getReadRowCount(), fromDb.getReadRowCount()),
                Math.max(fromEngine.getWriteRowCount(), fromDb.getWriteRowCount()),
                fromEngine.getStatus() != null ? fromEngine.getStatus() : fromDb.getStatus());
    }

    private JobSummaryMetricsRes getRunningJobMetricsFromEngine(
            Map<Long, HashMap<Integer, JobMetrics>> allRunningJobMetricsFromEngine,
            Map<Long, Long> jobInstanceIdAndJobEngineIdMap,
            JobInstance jobInstance) {

        Long engineJobId = jobInstanceIdAndJobEngineIdMap.get(jobInstance.getId());
        HashMap<Integer, JobMetrics> jobMetricsFromEngine =
                allRunningJobMetricsFromEngine == null
                        ? null
                        : allRunningJobMetricsFromEngine.get(engineJobId);
        if (jobMetricsFromEngine == null || jobMetricsFromEngine.isEmpty()) {
            return null;
        }
        long readCount =
                jobMetricsFromEngine.values().stream().mapToLong(JobMetrics::getReadRowCount).sum();
        long writeCount =
                jobMetricsFromEngine.values().stream()
                        .mapToLong(JobMetrics::getWriteRowCount)
                        .sum();

        return new JobSummaryMetricsRes(
                jobInstance.getId(),
                engineJobId != null ? engineJobId : 0L,
                readCount,
                writeCount,
                JobStatus.RUNNING);
    }

    private JobSummaryMetricsRes getJobSummaryMetricsResByDb(
            JobInstance jobInstance, String jobEngineId, Long engineId) {
        if (jobEngineId == null || "null".equals(jobEngineId)) {
            return null;
        }
        List<JobMetrics> jobMetricsFromDb = getJobMetricsFromDb(jobInstance, jobEngineId);
        if (!jobMetricsFromDb.isEmpty()) {
            long readCount = jobMetricsFromDb.stream().mapToLong(JobMetrics::getReadRowCount).sum();
            long writeCount =
                    jobMetricsFromDb.stream().mapToLong(JobMetrics::getWriteRowCount).sum();
            return new JobSummaryMetricsRes(
                    jobInstance.getId(),
                    engineId != null ? engineId : 0L,
                    readCount,
                    writeCount,
                    jobInstance.getJobStatus());
        }
        return null;
    }

    private Map<Long, HashMap<Integer, JobMetrics>> getAllRunningJobMetricsGroupedByEngine(
            List<JobInstance> allJobInstance) {
        Map<String, JobInstance> engineGroupRepresentatives = new HashMap<>();
        for (JobInstance jobInstance : allJobInstance) {
            engineGroupRepresentatives.computeIfAbsent(
                    jobInstance.getEngineName() + ":" + jobInstance.getEngineVersion(),
                    key -> jobInstance);
        }
        Map<Long, HashMap<Integer, JobMetrics>> mergedMetricsMap = new HashMap<>();
        for (JobInstance representative : engineGroupRepresentatives.values()) {
            mergedMetricsMap.putAll(
                    getAllRunningJobMetricsFromEngine(
                            representative.getEngineName(), representative.getEngineVersion()));
        }
        return mergedMetricsMap;
    }

    private Map<Long, HashMap<Integer, JobMetrics>> getAllRunningJobMetricsFromEngine(
            EngineType engineName, String engineVersion) {
        Engine engine = new Engine(engineName, engineVersion);

        IEngineMetricsExtractor engineMetricsExtractor =
                (new EngineMetricsExtractorFactory(engine)).getEngineMetricsExtractor();

        return engineMetricsExtractor.getAllRunningJobMetrics();
    }

    private JobStatus getJobStatusByJobEngineId(String jobEngineId) {
        return SeaTunnelEngineProxy.getInstance().getJobStatus(jobEngineId);
    }

    private Map<Integer, JobMetrics> getJobMetricsFromEngineMap(
            @NonNull JobInstance jobInstance, @NonNull String jobEngineId) {

        log.debug("enter getJobMetricsFromEngine");
        Engine engine = new Engine(jobInstance.getEngineName(), jobInstance.getEngineVersion());

        IEngineMetricsExtractor engineMetricsExtractor =
                (new EngineMetricsExtractorFactory(engine)).getEngineMetricsExtractor();

        return engineMetricsExtractor.getMetricsByJobEngineIdRTMap(jobEngineId);
    }

    private List<JobMetrics> getJobPipelineDetailMetrics(@NonNull JobInstance jobInstance) {
        List<JobMetrics> jobMetrics;
        if (JobUtils.isJobEndStatus(jobInstance.getJobStatus())) {
            jobMetrics = getJobMetricsFromDb(jobInstance, jobInstance.getJobEngineId());
            if (CollectionUtils.isEmpty(jobMetrics)) {
                jobMetrics = getJobMetricsFromEngine(jobInstance, jobInstance.getJobEngineId());
                if (!jobMetrics.isEmpty()) {
                    // If engine returns some metrics then it makes sens to insert into database
                    syncMetricsToDb(jobInstance, jobInstance.getJobEngineId());
                }
            }
        } else {
            // If job is not end state, get metrics from engine.
            jobMetrics = getJobMetricsFromEngine(jobInstance, jobInstance.getJobEngineId());
        }
        return jobMetrics;
    }

    @Override
    public List<JobPipelineDetailMetricsRes> getJobPipelineDetailMetricsRes(
            @NonNull Long jobInstanceId) {
        int userId = ServletUtils.getCurrentUserId();
        funcPermissionCheck(SeatunnelFuncPermissionKeyConstant.JOB_DETAIL, userId);
        JobInstance jobInstance = jobInstanceDao.getJobInstance(jobInstanceId);
        List<JobMetrics> jobPipelineDetailMetrics = getJobPipelineDetailMetrics(jobInstance);
        return jobPipelineDetailMetrics.stream()
                .map(this::wrapperJobMetrics)
                .collect(Collectors.toList());
    }

    @Override
    public List<JobPipelineDetailMetricsRes> getJobPipelineDetailMetricsRes(
            @NonNull JobInstance jobInstance) {
        if (JobUtils.isJobEndStatus(jobInstance.getJobStatus())) {
            return new ArrayList<>();
        }
        List<JobMetrics> jobPipelineDetailMetrics =
                getJobMetricsFromEngine(jobInstance, jobInstance.getJobEngineId());
        return jobPipelineDetailMetrics.stream()
                .map(this::wrapperJobMetrics)
                .collect(Collectors.toList());
    }

    @Override
    public JobDAG getJobDAG(@NonNull Long jobInstanceId) {
        int userId = ServletUtils.getCurrentUserId();
        funcPermissionCheck(SeatunnelFuncPermissionKeyConstant.JOB_DAG, userId);
        JobInstance jobInstance = jobInstanceDao.getJobInstance(jobInstanceId);
        String jobEngineId = jobInstance.getJobEngineId();
        JobInstanceHistory history = getJobHistoryFromDb(jobInstance, jobEngineId);
        if (history != null) {
            String dag = history.getDag();
            return JsonUtils.parseObject(dag, JobDAG.class);
        }
        Engine engine = new Engine(jobInstance.getEngineName(), jobInstance.getEngineVersion());
        IEngineMetricsExtractor engineMetricsExtractor =
                (new EngineMetricsExtractorFactory(engine)).getEngineMetricsExtractor();

        if (engineMetricsExtractor.isJobEnd(jobEngineId)) {
            syncHistoryJobInfoToDb(jobInstance, jobEngineId);
            history = getJobHistoryFromDb(jobInstance, jobEngineId);
        } else {
            history = getJobHistoryFromEngine(jobInstance, jobEngineId);
        }
        if (history != null) {
            String dag = history.getDag();
            return JsonUtils.parseObject(dag, JobDAG.class);
        }
        return null;
    }

    private JobInstanceHistory getJobHistoryFromEngine(
            @NonNull JobInstance jobInstance, String jobEngineId) {

        Engine engine = new Engine(jobInstance.getEngineName(), jobInstance.getEngineVersion());

        IEngineMetricsExtractor engineMetricsExtractor =
                (new EngineMetricsExtractorFactory(engine)).getEngineMetricsExtractor();

        return engineMetricsExtractor.getJobHistoryById(jobEngineId);
    }

    private JobInstanceHistory getJobHistoryFromDb(
            @NonNull JobInstance jobInstance, String jobEngineId) {
        // relation jobInstanceId and jobEngineId
        relationJobInstanceAndJobEngineId(jobInstance, jobEngineId);
        return jobInstanceHistoryDao.getByInstanceId(jobInstance.getId());
    }

    @Override
    public void syncJobDataToDb(@NonNull JobInstance jobInstance, @NonNull String jobEngineId) {
        relationJobInstanceAndJobEngineId(jobInstance, jobEngineId);
        syncMetricsToDb(jobInstance, jobEngineId);
        syncHistoryJobInfoToDb(jobInstance, jobEngineId);
        syncCompleteJobInfoToDb(jobInstance);
    }

    private void syncMetricsToDb(@NonNull JobInstance jobInstance, @NonNull String jobEngineId) {
        Map<Integer, JobMetrics> jobMetricsFromEngineMap =
                getJobMetricsFromEngineMap(jobInstance, jobEngineId);
        int userId = ServletUtils.getCurrentUserId();
        List<JobMetrics> jobMetricsFromDb = getJobMetricsFromDb(jobInstance, jobEngineId);
        if (jobMetricsFromDb.isEmpty()) {
            List<JobMetrics> jobMetricsFromEngine =
                    Arrays.asList(jobMetricsFromEngineMap.values().toArray(new JobMetrics[0]));
            jobMetricsFromEngine.forEach(
                    metrics -> {
                        try {
                            metrics.setId(CodeGenerateUtils.getInstance().genCode());
                        } catch (CodeGenerateUtils.CodeGenerateException e) {
                            throw new SeatunnelException(
                                    SeatunnelErrorEnum.JOB_RUN_GENERATE_UUID_ERROR);
                        }
                        metrics.setJobInstanceId(jobInstance.getId());
                        metrics.setCreateUserId(userId);
                        metrics.setUpdateUserId(userId);
                        metrics.setWorkspaceId(jobInstance.getWorkspaceId());
                    });

            if (!jobMetricsFromEngine.isEmpty()) {
                jobMetricsDao.getJobMetricsMapper().insertBatchMetrics(jobMetricsFromEngine);
            }
        } else {
            JobStatus jobStatus = getJobStatusByJobEngineId(jobEngineId);
            for (JobMetrics jobMetrics : jobMetricsFromDb) {
                Integer pipelineId = jobMetrics.getPipelineId();
                JobMetrics currentPiplinejobMetricsFromEngine =
                        jobMetricsFromEngineMap.get(pipelineId);
                if (currentPiplinejobMetricsFromEngine == null) {
                    // 引擎快照缺少该 pipeline（如 savepoint 恢复后重建），保留 DB 已有累计值，
                    // 不能用 0 覆盖，否则统计会随轮询归零
                    continue;
                }
                jobMetrics.setWriteQps(currentPiplinejobMetricsFromEngine.getWriteQps());
                jobMetrics.setReadQps(currentPiplinejobMetricsFromEngine.getReadQps());
                // 行数是单调递增的累计量，引擎计数器回退时保留较大值
                jobMetrics.setReadRowCount(
                        Math.max(
                                jobMetrics.getReadRowCount(),
                                currentPiplinejobMetricsFromEngine.getReadRowCount()));
                jobMetrics.setWriteRowCount(
                        Math.max(
                                jobMetrics.getWriteRowCount(),
                                currentPiplinejobMetricsFromEngine.getWriteRowCount()));
                jobMetrics.setStatus(jobStatus);
                jobMetricsDao.getJobMetricsMapper().updateById(jobMetrics);
            }
        }
    }

    @Override
    public void syncRunningMetricsToDb(@NonNull JobInstance jobInstance) {
        String jobEngineId = jobInstance.getJobEngineId();
        if (StringUtils.isEmpty(jobEngineId)) {
            return;
        }
        Map<Integer, JobMetrics> jobMetricsFromEngineMap =
                getJobMetricsFromEngineMap(jobInstance, jobEngineId);
        if (jobMetricsFromEngineMap == null || jobMetricsFromEngineMap.isEmpty()) {
            return;
        }
        List<JobMetrics> jobMetricsFromDb = jobMetricsDao.getByInstanceId(jobInstance.getId());
        if (jobMetricsFromDb.isEmpty()) {
            List<JobMetrics> pending =
                    Arrays.asList(jobMetricsFromEngineMap.values().toArray(new JobMetrics[0]));
            for (JobMetrics metrics : pending) {
                try {
                    metrics.setId(CodeGenerateUtils.getInstance().genCode());
                } catch (CodeGenerateUtils.CodeGenerateException e) {
                    throw new SeatunnelException(SeatunnelErrorEnum.JOB_RUN_GENERATE_UUID_ERROR);
                }
                metrics.setJobInstanceId(jobInstance.getId());
                metrics.setCreateUserId(SYSTEM_USER_ID);
                metrics.setUpdateUserId(SYSTEM_USER_ID);
                metrics.setWorkspaceId(jobInstance.getWorkspaceId());
            }
            jobMetricsDao.getJobMetricsMapper().insertBatchMetrics(pending);
            return;
        }
        for (JobMetrics dbMetrics : jobMetricsFromDb) {
            JobMetrics engineMetrics = jobMetricsFromEngineMap.get(dbMetrics.getPipelineId());
            if (engineMetrics == null) {
                continue;
            }
            dbMetrics.setWriteQps(engineMetrics.getWriteQps());
            dbMetrics.setReadQps(engineMetrics.getReadQps());
            dbMetrics.setReadRowCount(
                    Math.max(dbMetrics.getReadRowCount(), engineMetrics.getReadRowCount()));
            dbMetrics.setWriteRowCount(
                    Math.max(dbMetrics.getWriteRowCount(), engineMetrics.getWriteRowCount()));
            dbMetrics.setStatus(JobStatus.RUNNING);
            jobMetricsDao.getJobMetricsMapper().updateById(dbMetrics);
        }
    }

    private void syncHistoryJobInfoToDb(
            @NonNull JobInstance jobInstance, @NonNull String jobEngineId) {
        JobInstanceHistory jobHistoryFromEngine = getJobHistoryFromEngine(jobInstance, jobEngineId);

        jobHistoryFromEngine.setId(jobInstance.getId());

        JobInstanceHistory byInstanceId =
                jobInstanceHistoryDao.getByInstanceId(jobInstance.getId());
        if (byInstanceId == null) {
            try {
                jobInstanceHistoryDao.insert(jobHistoryFromEngine);
            } catch (DuplicateKeyException e) {
                // Handle the race condition gracefully
                jobInstanceHistoryDao.updateJobInstanceHistory(jobHistoryFromEngine);
            }
        } else {
            jobInstanceHistoryDao.updateJobInstanceHistory(jobHistoryFromEngine);
        }
    }

    private void syncCompleteJobInfoToDb(@NonNull JobInstance jobInstance) {
        jobInstance.setEndTime(new Date());
        jobInstanceDao.update(jobInstance);
    }

    private void relationJobInstanceAndJobEngineId(
            @NonNull JobInstance jobInstance, @NonNull String jobEngineId) {
        // relation jobInstanceId and jobEngineId
        if (StringUtils.isEmpty(jobInstance.getJobEngineId())) {
            int userId = ServletUtils.getCurrentUserId();
            jobInstance.setJobEngineId(jobEngineId);
            jobInstance.setUpdateUserId(userId);
            jobInstanceDao.update(jobInstance);
        }
    }

    private List<JobMetrics> getJobMetricsFromEngine(
            @NonNull JobInstance jobInstance, @NonNull String jobEngineId) {
        Engine engine = new Engine(jobInstance.getEngineName(), jobInstance.getEngineVersion());

        IEngineMetricsExtractor engineMetricsExtractor =
                (new EngineMetricsExtractorFactory(engine)).getEngineMetricsExtractor();

        return engineMetricsExtractor.getMetricsByJobEngineId(jobEngineId);
    }

    private List<JobPipelineSummaryMetricsRes> summaryMetrics(
            @NonNull List<JobMetrics> jobPipelineDetailedMetrics) {
        return jobPipelineDetailedMetrics.stream()
                .map(
                        metrics ->
                                new JobPipelineSummaryMetricsRes(
                                        metrics.getPipelineId(),
                                        metrics.getReadRowCount(),
                                        metrics.getWriteRowCount(),
                                        metrics.getStatus()))
                .collect(Collectors.toList());
    }

    private List<JobMetrics> getJobMetricsFromDb(
            @NonNull JobInstance jobInstance, @NonNull String jobEngineId) {

        // relation jobInstanceId and jobEngineId
        relationJobInstanceAndJobEngineId(jobInstance, jobEngineId);

        // get metrics from db
        return jobMetricsDao.getByInstanceId(jobInstance.getId());
    }

    @Override
    public ImmutablePair<Long, String> getInstanceIdAndEngineId(@NonNull String key) {
        if (!key.contains(Constants.METRICS_QUERY_KEY_SPLIT)
                || key.split(Constants.METRICS_QUERY_KEY_SPLIT).length != 2) {
            throw new SeatunnelException(SeatunnelErrorEnum.JOB_METRICS_QUERY_KEY_ERROR, key);
        }

        String[] split = key.split(Constants.METRICS_QUERY_KEY_SPLIT);
        Long jobInstanceId = Long.valueOf(split[0]);
        String jobEngineId = split[1];
        return new ImmutablePair<>(jobInstanceId, jobEngineId);
    }

    private JobPipelineDetailMetricsRes wrapperJobMetrics(@NonNull JobMetrics metrics) {
        return new JobPipelineDetailMetricsRes(
                metrics.getId(),
                metrics.getPipelineId(),
                metrics.getReadRowCount(),
                metrics.getWriteRowCount(),
                metrics.getSourceTableNames(),
                metrics.getSinkTableNames(),
                metrics.getReadQps(),
                metrics.getWriteQps(),
                metrics.getRecordDelay(),
                metrics.getStatus());
    }

    @Override
    @NonNull public List<JobMetricsHistory> getJobMetricsHistory(@NonNull Long jobInstanceId) {
        return jobMetricsHistoryMapper.queryJobMetricsHistoryByInstanceId(jobInstanceId);
    }

    @Override
    public List<JobMetricsHistory> getJobMetricsHistory(
            Long jobInstanceId, String startTime, String endTime) {
        if (StringUtils.isNotEmpty(startTime) && StringUtils.isNotEmpty(endTime)) {
            return jobMetricsHistoryMapper.queryJobMetricsHistoryByInstanceIdAndTimeRange(
                    jobInstanceId, startTime, endTime);
        }
        return getJobMetricsHistory(jobInstanceId);
    }
}
