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

package org.apache.seatunnel.app.service;

import org.apache.seatunnel.app.dal.entity.JobInstance;
import org.apache.seatunnel.app.domain.request.alert.AlertRuleReq;
import org.apache.seatunnel.app.domain.response.PageInfo;
import org.apache.seatunnel.app.domain.response.alert.AlertEventRes;
import org.apache.seatunnel.app.domain.response.alert.AlertRuleRes;
import org.apache.seatunnel.engine.common.job.JobStatus;

public interface IAlertService {

    /**
     * 任务进入终态时的告警挂钩点。
     *
     * <p>只写入告警事件表，绝不在此处发起 HTTP 推送 —— 否则会拖慢状态同步循环。发送由独立的定时任务 {@link #sendPendingEvents()} 异步处理。
     *
     * <p>幂等性依赖上游 {@code updateStatusIfNotEndState} 的条件更新语义：同一次状态迁移只会有一个调用方拿到
     * updated=1，因此本方法不会因轮询重复触发而产生重复事件。
     *
     * @param jobInstance 任务实例
     * @param newStatus 新写入的终态状态
     */
    void onInstanceTerminal(JobInstance jobInstance, JobStatus newStatus);

    /** 扫描待发送事件并推送 webhook，由独立调度器周期调用 */
    void sendPendingEvents();

    /**
     * 把超过保留期的告警事件迁入历史归档表，防止事件表无限增长拖慢发送扫描。
     *
     * <p>只归档已进入发送终态的事件，待发送事件仍留在主表，由 {@link #sendPendingEvents()} 消化。
     *
     * <p>由调度器周期调用，无用户上下文，故不做权限校验。
     */
    void archiveExpiredEvents();

    Long createRule(AlertRuleReq req);

    void updateRule(Long ruleId, AlertRuleReq req);

    void deleteRule(Long ruleId);

    PageInfo<AlertRuleRes> pageRule(Integer pageNo, Integer pageSize, Integer status, String name);

    PageInfo<AlertEventRes> pageEvent(
            Integer pageNo,
            Integer pageSize,
            Integer sendStatus,
            Long ruleId,
            String jobDefineName);

    /** 用指定规则向其 webhook 地址推送一条测试消息，返回是否成功 */
    boolean sendTestWebhook(Long ruleId);
}
