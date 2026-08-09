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

import org.apache.seatunnel.app.domain.request.job.JobScheduleCronPreviewReq;
import org.apache.seatunnel.app.domain.request.job.JobScheduleReq;
import org.apache.seatunnel.app.domain.response.job.JobScheduleRes;
import org.apache.seatunnel.app.domain.response.job.JobScheduleTriggerLogRes;
import org.apache.seatunnel.app.utils.PageInfo;

import java.util.Date;
import java.util.List;

public interface IJobScheduleService {

    Long createSchedule(JobScheduleReq req);

    void updateSchedule(Long scheduleId, JobScheduleReq req);

    void deleteSchedule(Long scheduleId);

    void enableSchedule(Long scheduleId);

    void disableSchedule(Long scheduleId);

    PageInfo<JobScheduleRes> pageSchedule(
            Integer pageNo, Integer pageSize, Integer status, String jobName);

    PageInfo<JobScheduleTriggerLogRes> pageTriggerLog(
            Long scheduleId, Integer pageNo, Integer pageSize);

    void triggerSchedule(Long scheduleId, Date scheduledFireTime);

    List<Date> previewCronExecution(JobScheduleCronPreviewReq req);
}
