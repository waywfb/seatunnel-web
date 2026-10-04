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

package org.apache.seatunnel.app.dal.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/** 告警事件：某次终态触发产生的待发送/已发送记录 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_st_alert_event")
public class AlertEvent {

    public static final int SEND_STATUS_PENDING = 0;
    public static final int SEND_STATUS_SUCCESS = 1;
    public static final int SEND_STATUS_FAILED = 2;

    /** 单条事件最大重试次数，超过后不再推送 */
    public static final int MAX_RETRY = 3;

    @TableId(value = "id", type = IdType.INPUT)
    private Long id;

    @TableField("rule_id")
    private Long ruleId;

    @TableField("job_instance_id")
    private Long jobInstanceId;

    /** 冗余任务定义名称，避免列表查询回表关联 */
    @TableField("job_define_name")
    private String jobDefineName;

    @TableField("error_message")
    private String errorMessage;

    /** 0-待发送 1-已发送 2-发送失败 */
    @TableField("send_status")
    private Integer sendStatus;

    @TableField("retry_count")
    private Integer retryCount;

    @TableField("send_time")
    private Date sendTime;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableField("workspace_id")
    private Long workspaceId;
}
