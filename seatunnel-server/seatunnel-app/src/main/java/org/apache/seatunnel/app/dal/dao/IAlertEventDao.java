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

package org.apache.seatunnel.app.dal.dao;

import org.apache.seatunnel.app.dal.entity.AlertEvent;

import com.baomidou.mybatisplus.core.metadata.IPage;

import java.util.Date;
import java.util.List;

public interface IAlertEventDao {

    AlertEvent getById(Long id);

    void insert(AlertEvent event);

    void update(AlertEvent event);

    IPage<AlertEvent> queryPage(
            IPage<AlertEvent> page,
            Long workspaceId,
            Integer sendStatus,
            Long ruleId,
            String jobDefineName);

    /** 发送循环取待发送事件，不区分工作空间（系统级任务） */
    List<AlertEvent> listPending(int limit);

    /** 冷却判断：该规则对同一实例在 since 之后是否已产生过事件 */
    long countSince(Long ruleId, Long jobInstanceId, Date since);

    /**
     * 把 create_time 早于 cutoff 且已进入发送终态的事件迁入历史表，单次最多搬 limit 条。
     *
     * <p>只处理 {@link AlertEvent#SEND_STATUS_SUCCESS}/{@link AlertEvent#SEND_STATUS_FAILED}，绝不触碰待发送
     * (send_status=0) 的行，避免与 10s 的发送调度争抢同一批数据。
     *
     * <p>插入历史表与删除主表行在同一事务内完成，调用方需分批循环直至返回值小于 limit。
     *
     * @return 实际迁移行数
     */
    int archiveCreatedBefore(Date cutoff, int limit);
}
