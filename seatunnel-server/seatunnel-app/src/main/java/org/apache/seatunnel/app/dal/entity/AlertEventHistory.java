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

package org.apache.seatunnel.app.dal.entity;

import com.baomidou.mybatisplus.annotation.TableName;

/**
 * 告警事件历史归档表。
 *
 * <p>超过保留期的告警事件从 {@link AlertEvent} 迁入本表而非直接删除，满足“允许超期数据离开主表、但不允许业务数据丢失”的要求。
 *
 * <p>字段与 {@link AlertEvent} 完全一致，故直接继承以免重复声明；表结构的任何调整都必须同步到两张表。
 */
@TableName("t_st_alert_event_history")
public class AlertEventHistory extends AlertEvent {

    public AlertEventHistory() {
        super();
    }

    public AlertEventHistory(AlertEvent source) {
        super();
        setId(source.getId());
        setRuleId(source.getRuleId());
        setJobInstanceId(source.getJobInstanceId());
        setJobDefineName(source.getJobDefineName());
        setErrorMessage(source.getErrorMessage());
        setSendStatus(source.getSendStatus());
        setRetryCount(source.getRetryCount());
        setSendTime(source.getSendTime());
        setCreateTime(source.getCreateTime());
        setUpdateTime(source.getUpdateTime());
        setWorkspaceId(source.getWorkspaceId());
    }
}
