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

@ApiModel(value = "alertRuleResponse", description = "alert rule response")
@Data
public class AlertRuleRes {

    @ApiModelProperty(value = "rule id", dataType = "Long")
    private Long id;

    @ApiModelProperty(value = "rule name", dataType = "String")
    private String name;

    @ApiModelProperty(value = "event type", dataType = "String")
    private String eventType;

    @ApiModelProperty(value = "webhook url", dataType = "String")
    private String webhookUrl;

    @ApiModelProperty(value = "custom request headers in json format", dataType = "String")
    private String webhookHeaders;

    @ApiModelProperty(value = "message template", dataType = "String")
    private String webhookTemplate;

    @ApiModelProperty(value = "status, 0-disabled 1-enabled", dataType = "Integer")
    private Integer status;

    @ApiModelProperty(value = "cooldown seconds", dataType = "Integer")
    private Integer cooldownSeconds;

    @ApiModelProperty(value = "create time", dataType = "Date")
    private Date createTime;

    @ApiModelProperty(value = "update time", dataType = "Date")
    private Date updateTime;
}
