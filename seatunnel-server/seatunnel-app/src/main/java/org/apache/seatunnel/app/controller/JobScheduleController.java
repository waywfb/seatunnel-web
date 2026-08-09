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

import org.apache.seatunnel.app.common.Result;
import org.apache.seatunnel.app.domain.request.job.JobScheduleCronPreviewReq;
import org.apache.seatunnel.app.domain.request.job.JobScheduleReq;
import org.apache.seatunnel.app.domain.response.job.JobScheduleRes;
import org.apache.seatunnel.app.domain.response.job.JobScheduleTriggerLogRes;
import org.apache.seatunnel.app.service.IJobScheduleService;
import org.apache.seatunnel.app.utils.PageInfo;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import javax.annotation.Resource;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/seatunnel/api/v1/job-schedule")
@Api(tags = "任务调度管理")
public class JobScheduleController extends BaseController {

    @Resource private IJobScheduleService jobScheduleService;

    @PostMapping
    @ApiOperation(value = "create job schedule", httpMethod = "POST")
    public Result<Long> createSchedule(@RequestBody JobScheduleReq req) {
        return Result.success(jobScheduleService.createSchedule(req));
    }

    @PutMapping("/{scheduleId}")
    @ApiOperation(value = "update job schedule", httpMethod = "PUT")
    public Result<Void> updateSchedule(
            @ApiParam(value = "schedule id", required = true) @PathVariable Long scheduleId,
            @RequestBody JobScheduleReq req) {
        jobScheduleService.updateSchedule(scheduleId, req);
        return Result.success();
    }

    @DeleteMapping("/{scheduleId}")
    @ApiOperation(value = "delete job schedule", httpMethod = "DELETE")
    public Result<Void> deleteSchedule(
            @ApiParam(value = "schedule id", required = true) @PathVariable Long scheduleId) {
        jobScheduleService.deleteSchedule(scheduleId);
        return Result.success();
    }

    @PostMapping("/{scheduleId}/enable")
    @ApiOperation(value = "enable job schedule", httpMethod = "POST")
    public Result<Void> enableSchedule(
            @ApiParam(value = "schedule id", required = true) @PathVariable Long scheduleId) {
        jobScheduleService.enableSchedule(scheduleId);
        return Result.success();
    }

    @PostMapping("/{scheduleId}/disable")
    @ApiOperation(value = "disable job schedule", httpMethod = "POST")
    public Result<Void> disableSchedule(
            @ApiParam(value = "schedule id", required = true) @PathVariable Long scheduleId) {
        jobScheduleService.disableSchedule(scheduleId);
        return Result.success();
    }

    @GetMapping("/page")
    @ApiOperation(value = "page job schedule", httpMethod = "GET")
    public Result<PageInfo<JobScheduleRes>> pageSchedule(
            @ApiParam(value = "page num", required = true) @RequestParam Integer pageNo,
            @ApiParam(value = "page size", required = true) @RequestParam Integer pageSize,
            @ApiParam(value = "schedule status") @RequestParam(required = false) Integer status,
            @ApiParam(value = "job name") @RequestParam(required = false) String jobName) {
        return Result.success(jobScheduleService.pageSchedule(pageNo, pageSize, status, jobName));
    }

    @GetMapping("/{scheduleId}/trigger-log")
    @ApiOperation(value = "page schedule trigger log", httpMethod = "GET")
    public Result<PageInfo<JobScheduleTriggerLogRes>> pageTriggerLog(
            @ApiParam(value = "schedule id", required = true) @PathVariable Long scheduleId,
            @ApiParam(value = "page num", required = true) @RequestParam Integer pageNo,
            @ApiParam(value = "page size", required = true) @RequestParam Integer pageSize) {
        return Result.success(jobScheduleService.pageTriggerLog(scheduleId, pageNo, pageSize));
    }

    @PostMapping("/{scheduleId}/trigger")
    @ApiOperation(value = "trigger job schedule", httpMethod = "POST")
    public Result<Void> triggerSchedule(
            @ApiParam(value = "schedule id", required = true) @PathVariable Long scheduleId) {
        jobScheduleService.triggerSchedule(scheduleId, new Date());
        return Result.success();
    }

    @PostMapping("/cron-preview")
    @ApiOperation(value = "preview cron execution time", httpMethod = "POST")
    public Result<List<Date>> previewCronExecution(@RequestBody JobScheduleCronPreviewReq req) {
        return Result.success(jobScheduleService.previewCronExecution(req));
    }
}
