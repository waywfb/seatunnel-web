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

package org.apache.seatunnel.app.domain.response.alert;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

@ApiModel(value = "alertEventResponse", description = "alert event response")
@Data
public class AlertEventRes {

    @ApiModelProperty(value = "event id", dataType = "Long")
    private Long id;

    @ApiModelProperty(value = "rule id", dataType = "Long")
    private Long ruleId;

    @ApiModelProperty(value = "rule name", dataType = "String")
    private String ruleName;

    @ApiModelProperty(value = "job instance id", dataType = "Long")
    private Long jobInstanceId;

    @ApiModelProperty(value = "job definition name", dataType = "String")
    private String jobDefineName;

    @ApiModelProperty(value = "error message", dataType = "String")
    private String errorMessage;

    @ApiModelProperty(value = "send status, 0-pending 1-success 2-failed", dataType = "Integer")
    private Integer sendStatus;

    @ApiModelProperty(value = "retry count", dataType = "Integer")
    private Integer retryCount;

    @ApiModelProperty(value = "send time", dataType = "Date")
    private Date sendTime;

    @ApiModelProperty(value = "create time", dataType = "Date")
    private Date createTime;
}
