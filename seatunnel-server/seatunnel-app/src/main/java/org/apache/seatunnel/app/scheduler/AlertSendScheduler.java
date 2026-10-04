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

import org.apache.seatunnel.app.service.IAlertService;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;

/**
 * 告警事件发送调度器。
 *
 * <p>刻意与 {@link MonitorTaskScheduler} 分离：告警推送涉及外部 HTTP，绝不能与任务状态同步共用同一个循环， 否则慢 endpoint 会直接拖垮 3s
 * 的状态同步周期。
 *
 * <p>fixedDelay 而非 fixedRate，保证上一轮发送结束后再开始下一轮，避免重叠执行。
 */
@Slf4j
@Component
public class AlertSendScheduler {

    @Resource private IAlertService alertService;

    @Scheduled(initialDelay = 15000, fixedDelay = 10000)
    public void sendPendingAlerts() {
        try {
            alertService.sendPendingEvents();
        } catch (Exception e) {
            log.warn("Alert send cycle failed", e);
        }
    }

    /** 每小时把超期告警事件迁入历史归档表，防止事件表无限增长拖慢发送扫描 */
    @Scheduled(initialDelay = 60000, fixedDelay = 3600000)
    public void archiveExpiredAlertEvents() {
        try {
            alertService.archiveExpiredEvents();
        } catch (Exception e) {
            log.warn("Alert event archive failed", e);
        }
    }
}
