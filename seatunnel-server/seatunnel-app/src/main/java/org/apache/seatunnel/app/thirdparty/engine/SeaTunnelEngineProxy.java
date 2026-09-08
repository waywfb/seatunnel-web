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
package org.apache.seatunnel.app.thirdparty.engine;

import org.apache.seatunnel.engine.client.SeaTunnelClient;
import org.apache.seatunnel.engine.common.config.JobConfig;
import org.apache.seatunnel.engine.common.config.SeaTunnelConfig;
import org.apache.seatunnel.engine.common.config.YamlSeaTunnelConfigBuilder;
import org.apache.seatunnel.engine.common.job.JobStatus;
import org.apache.seatunnel.engine.core.job.JobDAGInfo;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.hazelcast.client.HazelcastClientOfflineException;
import com.hazelcast.core.HazelcastInstanceNotActiveException;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
public class SeaTunnelEngineProxy {

    private static final AtomicInteger CONSECUTIVE_FAILURES = new AtomicInteger();

    /** 运行中任务指标快照缓存：缓存原始 String，TTL=5s，手动 put 由定时任务 fixedDelay 拉取刷新 */
    private static final Cache<String, String> RUNNING_JOB_METRICS_CACHE =
            CacheBuilder.newBuilder().expireAfterWrite(5, TimeUnit.SECONDS).build();

    private static final String RUNNING_JOB_METRICS_CACHE_KEY = "running-job-metrics";

    private static class SeaTunnelEngineProxyHolder {
        private static final SeaTunnelEngineProxy INSTANCE = new SeaTunnelEngineProxy();
    }

    public static SeaTunnelEngineProxy getInstance() {
        return SeaTunnelEngineProxyHolder.INSTANCE;
    }

    private SeaTunnelEngineProxy() {}

    @FunctionalInterface
    private interface EngineCall<T> {
        T apply(SeaTunnelClient client) throws Exception;
    }

    private boolean isConnectionFailure(Throwable e) {
        Throwable cause = e;
        while (cause != null) {
            if (cause instanceof HazelcastInstanceNotActiveException
                    || cause instanceof HazelcastClientOfflineException
                    || cause instanceof IOException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    private void handleFailure(SeaTunnelClient client, Exception e) {
        if (isConnectionFailure(e) && CONSECUTIVE_FAILURES.incrementAndGet() >= 3) {
            log.warn("SeaTunnelClient consecutive connection failures reached 3, reconnect.", e);
            SeaTunnelClientProvider.invalidateAndReconnect(client);
            CONSECUTIVE_FAILURES.set(0);
        }
    }

    private <T> T executeWithClient(EngineCall<T> call) {
        SeaTunnelClient client = SeaTunnelClientProvider.getClient();
        try {
            T result = call.apply(client);
            CONSECUTIVE_FAILURES.set(0);
            return result;
        } catch (RuntimeException e) {
            handleFailure(client, e);
            throw e;
        } catch (Exception e) {
            handleFailure(client, e);
            throw new RuntimeException(e);
        }
    }

    public String getMetricsContent(@NonNull String jobEngineId) {
        return executeWithClient(client -> client.getJobMetrics(Long.valueOf(jobEngineId)));
    }

    public String getJobPipelineStatusStr(@NonNull String jobEngineId) {
        return executeWithClient(client -> client.getJobDetailStatus(Long.valueOf(jobEngineId)));
    }

    public JobDAGInfo getJobInfo(@NonNull String jobEngineId) {
        return executeWithClient(client -> client.getJobInfo(Long.valueOf(jobEngineId)));
    }

    public JobStatus getJobStatus(@NonNull String jobEngineId) {
        try {
            return JobStatus.valueOf(
                    executeWithClient(client -> client.getJobStatus(Long.valueOf(jobEngineId))));
        } catch (Exception e) {
            log.warn("Can not get job from engine.", e);
            return null;
        }
    }

    public Map<String, String> getClusterHealthMetrics() {
        return executeWithClient(SeaTunnelClient::getClusterHealthMetrics);
    }

    public String getAllRunningJobMetricsContent() {
        String cached = RUNNING_JOB_METRICS_CACHE.getIfPresent(RUNNING_JOB_METRICS_CACHE_KEY);
        if (cached != null) {
            return cached;
        }
        return refreshRunningJobMetricsCache();
    }

    public String refreshRunningJobMetricsCache() {
        String content = executeWithClient(client -> client.getJobClient().getRunningJobMetrics());
        RUNNING_JOB_METRICS_CACHE.put(RUNNING_JOB_METRICS_CACHE_KEY, content);
        return content;
    }

    public void pauseJob(@NonNull String jobEngineId) {
        try {
            executeWithClient(
                    client -> {
                        client.getJobClient().savePointJob(Long.valueOf(jobEngineId));
                        return null;
                    });
        } catch (Exception e) {
            log.warn("Can not pause job from engine.", e);
        }
    }

    public void restoreJob(
            @NonNull String filePath, @NonNull Long jobInstanceId, @NonNull Long jobEngineId) {
        JobConfig jobConfig = new JobConfig();
        jobConfig.setName(jobInstanceId + "_job");
        SeaTunnelConfig seaTunnelConfig = new YamlSeaTunnelConfigBuilder().build();
        executeWithClient(
                client -> {
                    client.restoreExecutionContext(
                                    filePath, jobConfig, seaTunnelConfig, jobEngineId)
                            .execute();
                    return null;
                });
    }
}
