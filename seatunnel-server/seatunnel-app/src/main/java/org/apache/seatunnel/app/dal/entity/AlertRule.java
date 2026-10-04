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

/** 告警规则：定义何种事件触发、推送到哪个 webhook */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_st_alert_rule")
public class AlertRule {

    public static final String EVENT_TYPE_JOB_FAILED = "JOB_FAILED";

    public static final int STATUS_DISABLED = 0;
    public static final int STATUS_ENABLED = 1;

    @TableId(value = "id", type = IdType.INPUT)
    private Long id;

    @TableField("name")
    private String name;

    /** 触发事件类型，当前仅 {@link #EVENT_TYPE_JOB_FAILED} */
    @TableField("event_type")
    private String eventType;

    @TableField("webhook_url")
    private String webhookUrl;

    /** 自定义请求头 JSON，如钉钉/企微签名鉴权头 */
    @TableField("webhook_headers")
    private String webhookHeaders;

    /** 消息模板，支持 ${jobName} 等占位符 */
    @TableField("webhook_template")
    private String webhookTemplate;

    /** 1-启用 0-停用 */
    @TableField("status")
    private Integer status;

    /** 同实例告警冷却时间(秒)，防抖动重复推送 */
    @TableField("cooldown_seconds")
    private Integer cooldownSeconds;

    @TableField("create_user_id")
    private Integer createUserId;

    @TableField("update_user_id")
    private Integer updateUserId;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableField("workspace_id")
    private Long workspaceId;

    public boolean isEnabled() {
        return status != null && status == STATUS_ENABLED;
    }
}
