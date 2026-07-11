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

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@TableName("t_st_data_standard_format")
public class DataStandardFormat {

    @TableId(value = "id", type = IdType.INPUT)
    private Long id;

    @TableField("version_id")
    private Long versionId;

    @TableField("format_type")
    private String formatType;

    @TableField("file_type")
    private String fileType;

    @TableField("record_separator")
    private String recordSeparator;

    @TableField("field_separator")
    private String fieldSeparator;

    @TableField("encoding")
    private String encoding;

    @TableField("header_rows")
    private Integer headerRows;

    @TableField("quote_char")
    private String quoteChar;

    @TableField("escape_char")
    private String escapeChar;

    @TableField("description")
    private String description;

    @TableField("workspace_id")
    private Long workspaceId;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;
}
