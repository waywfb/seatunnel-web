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

import org.apache.seatunnel.app.dal.dao.IJobScheduleTriggerLogDao;
import org.apache.seatunnel.app.dal.entity.JobScheduleTriggerLog;
import org.apache.seatunnel.app.dal.mapper.JobScheduleTriggerLogMapper;

import org.springframework.stereotype.Repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

@Repository
public class JobScheduleTriggerLogDaoImpl implements IJobScheduleTriggerLogDao {

    private final JobScheduleTriggerLogMapper jobScheduleTriggerLogMapper;

    public JobScheduleTriggerLogDaoImpl(JobScheduleTriggerLogMapper jobScheduleTriggerLogMapper) {
        this.jobScheduleTriggerLogMapper = jobScheduleTriggerLogMapper;
    }

    @Override
    public void insert(JobScheduleTriggerLog log) {
        jobScheduleTriggerLogMapper.insert(log);
    }

    @Override
    public void update(JobScheduleTriggerLog log) {
        jobScheduleTriggerLogMapper.updateById(log);
    }

    @Override
    public JobScheduleTriggerLog getById(Long id) {
        return jobScheduleTriggerLogMapper.selectById(id);
    }

    @Override
    public IPage<JobScheduleTriggerLog> queryPage(
            IPage<JobScheduleTriggerLog> page, Long scheduleId, Long workspaceId) {
        LambdaQueryWrapper<JobScheduleTriggerLog> wrapper =
                Wrappers.<JobScheduleTriggerLog>lambdaQuery()
                        .eq(JobScheduleTriggerLog::getWorkspaceId, workspaceId)
                        .eq(scheduleId != null, JobScheduleTriggerLog::getScheduleId, scheduleId)
                        .orderByDesc(JobScheduleTriggerLog::getId);
        return jobScheduleTriggerLogMapper.selectPage(page, wrapper);
    }

    @Override
    public void deleteByScheduleId(Long scheduleId) {
        jobScheduleTriggerLogMapper.delete(
                Wrappers.<JobScheduleTriggerLog>lambdaQuery()
                        .eq(JobScheduleTriggerLog::getScheduleId, scheduleId));
    }
}
