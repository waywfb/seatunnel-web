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

import org.apache.seatunnel.app.dal.dao.IAlertRuleDao;
import org.apache.seatunnel.app.dal.entity.AlertRule;
import org.apache.seatunnel.app.dal.mapper.AlertRuleMapper;

import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Repository
public class AlertRuleDaoImpl implements IAlertRuleDao {

    private final AlertRuleMapper alertRuleMapper;

    public AlertRuleDaoImpl(AlertRuleMapper alertRuleMapper) {
        this.alertRuleMapper = alertRuleMapper;
    }

    @Override
    public AlertRule getById(Long id) {
        return alertRuleMapper.selectById(id);
    }

    @Override
    public void insert(AlertRule rule) {
        alertRuleMapper.insert(rule);
    }

    @Override
    public void update(AlertRule rule) {
        alertRuleMapper.updateById(rule);
    }

    @Override
    public void deleteById(Long id) {
        alertRuleMapper.deleteById(id);
    }

    @Override
    public IPage<AlertRule> queryPage(
            IPage<AlertRule> page, Long workspaceId, Integer status, String name) {
        LambdaQueryWrapper<AlertRule> wrapper =
                Wrappers.<AlertRule>lambdaQuery()
                        .eq(AlertRule::getWorkspaceId, workspaceId)
                        .eq(status != null, AlertRule::getStatus, status)
                        .orderByDesc(AlertRule::getUpdateTime);
        if (StringUtils.hasText(name)) {
            wrapper.like(AlertRule::getName, name);
        }
        return alertRuleMapper.selectPage(page, wrapper);
    }

    @Override
    public List<AlertRule> listEnabledByEventType(String eventType, Long workspaceId) {
        return alertRuleMapper.selectList(
                Wrappers.<AlertRule>lambdaQuery()
                        .eq(AlertRule::getEventType, eventType)
                        .eq(AlertRule::getStatus, AlertRule.STATUS_ENABLED)
                        .eq(workspaceId != null, AlertRule::getWorkspaceId, workspaceId));
    }

    @Override
    public List<AlertRule> listByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return alertRuleMapper.selectBatchIds(ids);
    }
}
