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

import org.apache.seatunnel.app.common.ScheduleMisfirePolicy;
import org.apache.seatunnel.app.dal.dao.IJobScheduleDao;
import org.apache.seatunnel.app.dal.entity.JobSchedule;

import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;

import java.util.List;
import java.util.TimeZone;

@Slf4j
@Component
public class JobScheduleManager implements ApplicationRunner {

    @Resource private Scheduler scheduler;

    @Resource private IJobScheduleDao jobScheduleDao;

    private JobKey jobKey(Long scheduleId) {
        return JobKey.jobKey("schedule_" + scheduleId, JobScheduleConstants.JOB_GROUP);
    }

    private TriggerKey triggerKey(Long scheduleId) {
        return TriggerKey.triggerKey("trigger_" + scheduleId, JobScheduleConstants.JOB_GROUP);
    }

    /** create or reschedule the quartz trigger for the given schedule. */
    public void createOrUpdateSchedule(JobSchedule schedule) throws SchedulerException {
        JobKey jobKey = jobKey(schedule.getId());
        JobDetail jobDetail =
                JobBuilder.newJob(SeaTunnelScheduleJob.class)
                        .withIdentity(jobKey)
                        .usingJobData(JobScheduleConstants.SCHEDULE_ID_KEY, schedule.getId())
                        .storeDurably(true)
                        .build();
        if (!scheduler.checkExists(jobKey)) {
            scheduler.addJob(jobDetail, true);
        }
        Trigger newTrigger = buildTrigger(schedule);
        TriggerKey tKey = triggerKey(schedule.getId());
        if (scheduler.checkExists(tKey)) {
            scheduler.rescheduleJob(tKey, newTrigger);
        } else {
            scheduler.scheduleJob(newTrigger);
        }
    }

    /** enable an existing schedule, create the trigger if it does not exist. */
    public void enableSchedule(JobSchedule schedule) throws SchedulerException {
        JobKey jobKey = jobKey(schedule.getId());
        if (!scheduler.checkExists(jobKey)) {
            createOrUpdateSchedule(schedule);
            return;
        }
        TriggerKey tKey = triggerKey(schedule.getId());
        if (scheduler.checkExists(tKey)) {
            scheduler.resumeTrigger(tKey);
        } else {
            scheduler.scheduleJob(buildTrigger(schedule));
        }
    }

    /** disable an existing schedule by pausing its trigger. */
    public void disableSchedule(Long scheduleId) throws SchedulerException {
        scheduler.pauseTrigger(triggerKey(scheduleId));
    }

    /** remove the schedule and its trigger from quartz. */
    public void deleteSchedule(Long scheduleId) throws SchedulerException {
        scheduler.deleteJob(jobKey(scheduleId));
    }

    private Trigger buildTrigger(JobSchedule schedule) {
        CronScheduleBuilder cronScheduleBuilder =
                CronScheduleBuilder.cronSchedule(schedule.getCronExpression());
        if (schedule.getMisfirePolicy() != null
                && schedule.getMisfirePolicy() == ScheduleMisfirePolicy.FIRE_ONE.getCode()) {
            cronScheduleBuilder.withMisfireHandlingInstructionFireAndProceed();
        } else {
            cronScheduleBuilder.withMisfireHandlingInstructionDoNothing();
        }
        if (StringUtils.hasText(schedule.getTimezone())) {
            cronScheduleBuilder.inTimeZone(TimeZone.getTimeZone(schedule.getTimezone()));
        }
        TriggerBuilder<CronTrigger> triggerBuilder =
                TriggerBuilder.newTrigger()
                        .withIdentity(triggerKey(schedule.getId()))
                        .forJob(jobKey(schedule.getId()))
                        .withSchedule(cronScheduleBuilder)
                        .startNow();
        if (schedule.getActiveStartTime() != null) {
            triggerBuilder.startAt(schedule.getActiveStartTime());
        }
        if (schedule.getActiveEndTime() != null) {
            triggerBuilder.endAt(schedule.getActiveEndTime());
        }
        return triggerBuilder.build();
    }

    @Override
    public void run(ApplicationArguments args) {
        List<JobSchedule> enabledSchedules = jobScheduleDao.listEnabled();
        for (JobSchedule schedule : enabledSchedules) {
            try {
                createOrUpdateSchedule(schedule);
                log.info(
                        "Restore enabled schedule on startup, scheduleId: {}, jobDefinitionId: {}",
                        schedule.getId(),
                        schedule.getJobDefinitionId());
            } catch (SchedulerException e) {
                log.error(
                        "Restore enabled schedule failed on startup, scheduleId: {}",
                        schedule.getId(),
                        e);
            }
        }
    }
}
