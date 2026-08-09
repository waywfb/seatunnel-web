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

@ApiModel(
        value = "jobScheduleTriggerLogResponse",
        description = "job schedule trigger log response")
@Data
public class JobScheduleTriggerLogRes {

    @ApiModelProperty(value = "trigger log id", dataType = "Long")
    private Long id;

    @ApiModelProperty(value = "schedule id", dataType = "Long")
    private Long scheduleId;

    @ApiModelProperty(value = "job definition id", dataType = "Long")
    private Long jobDefinitionId;

    @ApiModelProperty(value = "job name", dataType = "String")
    private String jobName;

    @ApiModelProperty(value = "scheduled fire time", dataType = "Date")
    private Date scheduledFireTime;

    @ApiModelProperty(value = "actual fire time", dataType = "Date")
    private Date actualFireTime;

    @ApiModelProperty(value = "end time", dataType = "Date")
    private Date endTime;

    @ApiModelProperty(
            value = "status, 0-running 1-success 2-failed 3-skipped",
            dataType = "Integer")
    private Integer status;

    @ApiModelProperty(value = "retry count", dataType = "Integer")
    private Integer retryCount;

    @ApiModelProperty(value = "job instance id", dataType = "Long")
    private Long jobInstanceId;

    @ApiModelProperty(value = "error message", dataType = "String")
    private String errorMessage;

    @ApiModelProperty(value = "create time", dataType = "Date")
    private Date createTime;

    @ApiModelProperty(value = "update time", dataType = "Date")
    private Date updateTime;
}
