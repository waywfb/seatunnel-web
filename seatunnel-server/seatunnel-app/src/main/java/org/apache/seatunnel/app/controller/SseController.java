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

package org.apache.seatunnel.app.controller;

import org.apache.seatunnel.app.dal.dao.IJobInstanceDao;
import org.apache.seatunnel.app.dal.entity.JobInstance;
import org.apache.seatunnel.app.security.UserContext;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.IJobMetricsService;
import org.apache.seatunnel.app.sse.SseEmitterManager;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;

@Slf4j
@RestController
@RequestMapping("/seatunnel/api/v1/sse")
@Api(tags = "SSE 实时推送")
public class SseController {

    private static final long PUSH_INTERVAL_MS = 5000L;
    private static final String JOB_INSTANCE_TOPIC_PREFIX = "job-instance:";
    private static final String JOB_INSTANCE_SUMMARY_TOPIC_PREFIX = "job-instance-summary:";

    @Resource private SseEmitterManager sseEmitterManager;
    @Resource private IJobInstanceDao jobInstanceDao;
    @Resource private IJobMetricsService jobMetricsService;

    /**
     * 订阅同步任务实例的运行指标，服务端定时推送。
     *
     * <p>token 经认证拦截器校验（EventSource 无法携带 header，token 通过 query 参数传递）。
     */
    @GetMapping(value = "/job-instance/metrics", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @ApiOperation(value = "订阅任务实例运行指标", httpMethod = "GET")
    public SseEmitter subscribeJobInstanceMetrics(
            @ApiParam(value = "任务实例 ID", required = true) @RequestParam @NonNull Long jobInstanceId) {
        // 推送线程为 daemon 线程、无 Servlet 上下文；此处捕获订阅请求的用户上下文，
        // 在每次推送时 set/clear（与 AsyncConfig.ContextCopyingDecorator 策略一致）。
        UserContext userContext = UserContextHolder.getUserContext();
        String topic = JOB_INSTANCE_TOPIC_PREFIX + jobInstanceId;
        sseEmitterManager.register(
                topic,
                () -> {
                    UserContextHolder.setUserContext(userContext);
                    try {
                        JobInstance jobInstance = jobInstanceDao.getJobInstance(jobInstanceId);
                        if (jobInstance == null) {
                            return null;
                        }
                        return jobMetricsService.getJobPipelineDetailMetricsRes(jobInstance);
                    } finally {
                        UserContextHolder.clear();
                    }
                },
                PUSH_INTERVAL_MS);
        return sseEmitterManager.subscribe(topic);
    }

    /**
     * 订阅同步任务实例的概览指标（数据链路节点读/写行数与状态），服务端定时推送。
     *
     * <p>token 经认证拦截器校验（EventSource 无法携带 header，token 通过 query 参数传递）。
     */
    @GetMapping(value = "/job-instance/summary", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @ApiOperation(value = "订阅任务实例概览指标", httpMethod = "GET")
    public SseEmitter subscribeJobInstanceSummary(
            @ApiParam(value = "任务实例 ID", required = true) @RequestParam @NonNull Long jobInstanceId) {
        UserContext userContext = UserContextHolder.getUserContext();
        String topic = JOB_INSTANCE_SUMMARY_TOPIC_PREFIX + jobInstanceId;
        sseEmitterManager.register(
                topic,
                () -> {
                    UserContextHolder.setUserContext(userContext);
                    try {
                        JobInstance jobInstance = jobInstanceDao.getJobInstance(jobInstanceId);
                        if (jobInstance == null) {
                            return null;
                        }
                        return jobMetricsService.getJobPipelineSummaryMetrics(jobInstance);
                    } finally {
                        UserContextHolder.clear();
                    }
                },
                PUSH_INTERVAL_MS);
        return sseEmitterManager.subscribe(topic);
    }
}
