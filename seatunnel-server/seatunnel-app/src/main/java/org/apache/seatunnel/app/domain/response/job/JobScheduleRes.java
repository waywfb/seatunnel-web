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

package org.apache.seatunnel.app.domain.response.job;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

@ApiModel(value = "jobScheduleResponse", description = "job schedule response")
@Data
public class JobScheduleRes {

    @ApiModelProperty(value = "schedule id", dataType = "Long")
    private Long id;

    @ApiModelProperty(value = "job definition id", dataType = "Long")
    private Long jobDefinitionId;

    @ApiModelProperty(value = "job name", dataType = "String")
    private String jobName;

    @ApiModelProperty(value = "cron expression", dataType = "String")
    private String cronExpression;

    @ApiModelProperty(value = "timezone", dataType = "String")
    private String timezone;

    @ApiModelProperty(value = "retry times", dataType = "Integer")
    private Integer retryTimes;

    @ApiModelProperty(value = "retry interval, unit seconds", dataType = "Integer")
    private Integer retryInterval;

    @ApiModelProperty(value = "active start time", dataType = "Date")
    private Date activeStartTime;

    @ApiModelProperty(value = "active end time", dataType = "Date")
    private Date activeEndTime;

    @ApiModelProperty(value = "status, 0-disabled 1-enabled", dataType = "Integer")
    private Integer status;

    @ApiModelProperty(value = "concurrent policy, 0-skip 1-parallel", dataType = "Integer")
    private Integer concurrentPolicy;

    @ApiModelProperty(value = "misfire policy, 0-ignore 1-fire one", dataType = "Integer")
    private Integer misfirePolicy;

    @ApiModelProperty(value = "notify type", dataType = "String")
    private String notifyType;

    @ApiModelProperty(value = "notify target", dataType = "String")
    private String notifyTarget;

    @ApiModelProperty(value = "create time", dataType = "Date")
    private Date createTime;

    @ApiModelProperty(value = "update time", dataType = "Date")
    private Date updateTime;
}
