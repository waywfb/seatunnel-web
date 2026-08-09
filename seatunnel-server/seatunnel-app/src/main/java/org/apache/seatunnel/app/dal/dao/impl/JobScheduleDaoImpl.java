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

import org.apache.seatunnel.app.common.ScheduleStatusEnum;
import org.apache.seatunnel.app.dal.dao.IJobScheduleDao;
import org.apache.seatunnel.app.dal.entity.JobDefinition;
import org.apache.seatunnel.app.dal.entity.JobSchedule;
import org.apache.seatunnel.app.dal.mapper.JobMapper;
import org.apache.seatunnel.app.dal.mapper.JobScheduleMapper;

import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class JobScheduleDaoImpl implements IJobScheduleDao {

    private final JobScheduleMapper jobScheduleMapper;

    private final JobMapper jobMapper;

    public JobScheduleDaoImpl(JobScheduleMapper jobScheduleMapper, JobMapper jobMapper) {
        this.jobScheduleMapper = jobScheduleMapper;
        this.jobMapper = jobMapper;
    }

    @Override
    public JobSchedule getById(Long id) {
        return jobScheduleMapper.selectById(id);
    }

    @Override
    public JobSchedule getByJobDefinitionId(Long jobDefinitionId, Long workspaceId) {
        return jobScheduleMapper.selectOne(
                Wrappers.<JobSchedule>lambdaQuery()
                        .eq(JobSchedule::getJobDefinitionId, jobDefinitionId)
                        .eq(JobSchedule::getWorkspaceId, workspaceId)
                        .last("limit 1"));
    }

    @Override
    public void insert(JobSchedule schedule) {
        jobScheduleMapper.insert(schedule);
    }

    @Override
    public void update(JobSchedule schedule) {
        jobScheduleMapper.updateById(schedule);
    }

    @Override
    public void deleteById(Long id) {
        jobScheduleMapper.deleteById(id);
    }

    @Override
    public List<JobSchedule> listByWorkspace(Long workspaceId) {
        return jobScheduleMapper.selectList(
                Wrappers.<JobSchedule>lambdaQuery().eq(JobSchedule::getWorkspaceId, workspaceId));
    }

    @Override
    public List<JobSchedule> listEnabled() {
        return jobScheduleMapper.selectList(
                Wrappers.<JobSchedule>lambdaQuery()
                        .eq(JobSchedule::getStatus, ScheduleStatusEnum.ENABLED.getCode()));
    }

    @Override
    public IPage<JobSchedule> queryPage(
            IPage<JobSchedule> page, Long workspaceId, Integer status, String jobName) {
        LambdaQueryWrapper<JobSchedule> wrapper =
                Wrappers.<JobSchedule>lambdaQuery()
                        .eq(JobSchedule::getWorkspaceId, workspaceId)
                        .eq(status != null, JobSchedule::getStatus, status)
                        .orderByDesc(JobSchedule::getUpdateTime);
        if (StringUtils.hasText(jobName)) {
            List<Long> jobDefinitionIds =
                    jobMapper
                            .selectList(
                                    Wrappers.<JobDefinition>lambdaQuery()
                                            .select(JobDefinition::getId)
                                            .like(JobDefinition::getName, jobName))
                            .stream()
                            .map(JobDefinition::getId)
                            .collect(Collectors.toList());
            if (jobDefinitionIds.isEmpty()) {
                return page;
            }
            wrapper.in(JobSchedule::getJobDefinitionId, jobDefinitionIds);
        }
        return jobScheduleMapper.selectPage(page, wrapper);
    }
}
