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

package org.apache.seatunnel.app.dal.mapper;

import org.apache.seatunnel.app.dal.entity.JobInstance;
import org.apache.seatunnel.app.domain.dto.job.SeaTunnelJobInstanceDto;
import org.apache.seatunnel.common.constants.JobMode;
import org.apache.seatunnel.engine.common.job.JobStatus;

import org.apache.ibatis.annotations.Param;

import org.mapstruct.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;

import java.util.Date;
import java.util.List;

@Mapper
public interface JobInstanceMapper extends BaseMapper<JobInstance> {
    IPage<SeaTunnelJobInstanceDto> queryJobInstanceListPaging(
            IPage<JobInstance> page,
            @Param("startTime") Date startTime,
            @Param("endTime") Date endTime,
            @Param("jobDefineName") String jobDefineName,
            @Param("jobMode") JobMode jobMode,
            @Param("workspaceId") Long workspaceId);

    JobInstance getJobExecutionStatus(@Param("jobInstanceId") Long jobInstanceId);

    /**
     * 查询未彻底结束的实例（排除 FINISHED/FAILED/CANCELED），含可恢复终态（如 SAVEPOINT_DONE）与中间态， 供状态同步覆盖「暂停后又恢复运行」的场景
     */
    List<JobInstance> getAllUnfinishedJobInstance();

    /**
     * 按引擎状态回写实例状态，仅当当前 DB 状态未彻底结束时生效，防止异步任务覆盖用户主动停止的终态； 非终态回写时 endTime 传 null，表示重新开始计时；errorMessage
     * 传 null 表示不触碰 error_message， 传空串表示清空（引擎状态丢失标记被解除）
     */
    int updateStatusIfNotEndState(
            @Param("id") Long id,
            @Param("jobStatus") JobStatus jobStatus,
            @Param("endTime") Date endTime,
            @Param("errorMessage") String errorMessage);

    /**
     * 拉起成功后的显性回写：FAILED 等终态行不会被 updateStatusIfNotEndState / 状态同步循环覆盖， 必须在拉起入口主动置为 RUNNING，并清空
     * end_time 与 error_message，否则 DB 状态永远停留在拉起前的失败态
     */
    int resetForRestore(@Param("id") Long id);

    Long countActiveByJobDefinitionId(
            @Param("jobDefinitionId") Long jobDefinitionId, @Param("workspaceId") Long workspaceId);
}
