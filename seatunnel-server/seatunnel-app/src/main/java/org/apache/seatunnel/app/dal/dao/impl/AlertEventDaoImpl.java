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

package org.apache.seatunnel.app.dal.dao.impl;

import org.apache.seatunnel.app.dal.dao.IAlertEventDao;
import org.apache.seatunnel.app.dal.entity.AlertEvent;
import org.apache.seatunnel.app.dal.entity.AlertEventHistory;
import org.apache.seatunnel.app.dal.mapper.AlertEventHistoryMapper;
import org.apache.seatunnel.app.dal.mapper.AlertEventMapper;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class AlertEventDaoImpl implements IAlertEventDao {

    private final AlertEventMapper alertEventMapper;

    private final AlertEventHistoryMapper alertEventHistoryMapper;

    public AlertEventDaoImpl(
            AlertEventMapper alertEventMapper, AlertEventHistoryMapper alertEventHistoryMapper) {
        this.alertEventMapper = alertEventMapper;
        this.alertEventHistoryMapper = alertEventHistoryMapper;
    }

    @Override
    public AlertEvent getById(Long id) {
        return alertEventMapper.selectById(id);
    }

    @Override
    public void insert(AlertEvent event) {
        alertEventMapper.insert(event);
    }

    @Override
    public void update(AlertEvent event) {
        alertEventMapper.updateById(event);
    }

    @Override
    public IPage<AlertEvent> queryPage(
            IPage<AlertEvent> page,
            Long workspaceId,
            Integer sendStatus,
            Long ruleId,
            String jobDefineName) {
        LambdaQueryWrapper<AlertEvent> wrapper =
                Wrappers.<AlertEvent>lambdaQuery()
                        .eq(AlertEvent::getWorkspaceId, workspaceId)
                        .eq(sendStatus != null, AlertEvent::getSendStatus, sendStatus)
                        .eq(ruleId != null, AlertEvent::getRuleId, ruleId)
                        .orderByDesc(AlertEvent::getCreateTime);
        if (StringUtils.hasText(jobDefineName)) {
            wrapper.like(AlertEvent::getJobDefineName, jobDefineName);
        }
        return alertEventMapper.selectPage(page, wrapper);
    }

    @Override
    public List<AlertEvent> listPending(int limit) {
        return alertEventMapper.selectList(
                Wrappers.<AlertEvent>lambdaQuery()
                        .eq(AlertEvent::getSendStatus, AlertEvent.SEND_STATUS_PENDING)
                        .orderByAsc(AlertEvent::getCreateTime)
                        .last("limit " + Math.max(1, limit)));
    }

    @Override
    public long countSince(Long ruleId, Long jobInstanceId, Date since) {
        return alertEventMapper.selectCount(
                Wrappers.<AlertEvent>lambdaQuery()
                        .eq(AlertEvent::getRuleId, ruleId)
                        .eq(AlertEvent::getJobInstanceId, jobInstanceId)
                        .ge(AlertEvent::getCreateTime, since));
    }

    @Override
    @Transactional
    public int archiveCreatedBefore(Date cutoff, int limit) {
        int batchSize = Math.max(1, limit);
        List<AlertEvent> expired =
                alertEventMapper.selectList(
                        Wrappers.<AlertEvent>lambdaQuery()
                                .lt(AlertEvent::getCreateTime, cutoff)
                                .ne(AlertEvent::getSendStatus, AlertEvent.SEND_STATUS_PENDING)
                                .orderByAsc(AlertEvent::getId)
                                .last("limit " + batchSize));
        if (expired.isEmpty()) {
            return 0;
        }
        List<AlertEventHistory> histories = new ArrayList<>(expired.size());
        for (AlertEvent event : expired) {
            histories.add(new AlertEventHistory(event));
        }
        alertEventHistoryMapper.insert(histories);
        alertEventMapper.deleteBatchIds(
                expired.stream().map(AlertEvent::getId).collect(Collectors.toList()));
        return expired.size();
    }
}
