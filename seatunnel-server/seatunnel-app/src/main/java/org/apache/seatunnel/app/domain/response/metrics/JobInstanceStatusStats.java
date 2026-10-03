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

package org.apache.seatunnel.app.domain.response.metrics;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/** 实例列表全局状态统计（与列表查询同过滤条件下的全量计数，按当前页外全部数据聚合） */
@Data
@Schema(description = "INSTANCE_STATUS_GLOBAL_STATS")
public class JobInstanceStatusStats {

    /** 不区分状态的全量实例数，供列表页“全部”状态筛选项的角标使用 */
    @Schema(description = "ALL_INSTANCE_COUNT")
    private Integer totalCount = 0;

    @Schema(description = "RUNNING_INSTANCE_COUNT")
    private Integer runningCount = 0;

    @Schema(description = "SUCCESS_INSTANCE_COUNT")
    private Integer successCount = 0;

    @Schema(description = "FAILED_INSTANCE_COUNT")
    private Integer failedCount = 0;
}
