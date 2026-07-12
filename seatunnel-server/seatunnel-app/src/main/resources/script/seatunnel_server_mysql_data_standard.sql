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

-- ----------------------------
-- Table structure for t_st_data_standard
-- ----------------------------
DROP TABLE IF EXISTS `t_st_data_standard`;
CREATE TABLE `t_st_data_standard` (
  `id` bigint(20) NOT NULL,
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `industry` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'CUSTOM',
  `current_version_id` bigint(20) NULL DEFAULT NULL,
  `source` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `description` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `workspace_id` bigint(20) NOT NULL,
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `t_st_data_standard_code_uindex`(`code`, `workspace_id`) USING BTREE,
  INDEX `t_st_data_standard_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_data_standard_version
-- ----------------------------
DROP TABLE IF EXISTS `t_st_data_standard_version`;
CREATE TABLE `t_st_data_standard_version` (
  `id` bigint(20) NOT NULL,
  `standard_id` bigint(20) NOT NULL,
  `version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'DRAFT',
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `description` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `workspace_id` bigint(20) NOT NULL,
  `create_user_id` int(11) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `t_st_data_standard_version_standard_id_index`(`standard_id`) USING BTREE,
  INDEX `t_st_data_standard_version_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_data_standard_field
-- ----------------------------
DROP TABLE IF EXISTS `t_st_data_standard_field`;
CREATE TABLE `t_st_data_standard_field` (
  `id` bigint(20) NOT NULL,
  `version_id` bigint(20) NOT NULL,
  `group_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `data_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `length` int(11) NULL DEFAULT NULL,
  `precision` int(11) NULL DEFAULT NULL,
  `unit` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `default_value` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `required` tinyint(1) NOT NULL DEFAULT 0,
  `description` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `field_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT 'BODY',
  `workspace_id` bigint(20) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `t_st_data_standard_field_version_id_index`(`version_id`) USING BTREE,
  INDEX `t_st_data_standard_field_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_data_standard_format
-- ----------------------------
DROP TABLE IF EXISTS `t_st_data_standard_format`;
CREATE TABLE `t_st_data_standard_format` (
  `id` bigint(20) NOT NULL,
  `version_id` bigint(20) NOT NULL,
  `format_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `file_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `record_separator` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `field_separator` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `encoding` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `header_rows` int(11) NULL DEFAULT NULL,
  `quote_char` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `escape_char` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `file_terminator` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `description` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `workspace_id` bigint(20) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `t_st_data_standard_format_version_id_index`(`version_id`) USING BTREE,
  INDEX `t_st_data_standard_format_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_data_standard_field_mapping
-- ----------------------------
DROP TABLE IF EXISTS `t_st_data_standard_field_mapping`;
CREATE TABLE `t_st_data_standard_field_mapping` (
  `id` bigint(20) NOT NULL,
  `version_id` bigint(20) NOT NULL,
  `field_id` bigint(20) NOT NULL,
  `source_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `source_index` int(11) NULL DEFAULT NULL,
  `mapping_type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'INDEX',
  `sample_value` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `workspace_id` bigint(20) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `t_st_data_standard_field_mapping_version_id_index`(`version_id`) USING BTREE,
  INDEX `t_st_data_standard_field_mapping_field_id_index`(`field_id`) USING BTREE,
  INDEX `t_st_data_standard_field_mapping_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_data_standard_relation
-- ----------------------------
DROP TABLE IF EXISTS `t_st_data_standard_relation`;
CREATE TABLE `t_st_data_standard_relation` (
  `id` bigint(20) NOT NULL,
  `standard_id` bigint(20) NOT NULL,
  `object_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `object_id` bigint(20) NOT NULL,
  `workspace_id` bigint(20) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `t_st_data_standard_relation_standard_id_index`(`standard_id`) USING BTREE,
  INDEX `t_st_data_standard_relation_object_index`(`object_type`, `object_id`) USING BTREE,
  INDEX `t_st_data_standard_relation_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_virtual_table_standard
-- ----------------------------
DROP TABLE IF EXISTS `t_st_virtual_table_standard`;
CREATE TABLE `t_st_virtual_table_standard` (
  `id` bigint(20) NOT NULL,
  `virtual_table_id` bigint(20) NOT NULL,
  `standard_id` bigint(20) NOT NULL,
  `standard_version_id` bigint(20) NOT NULL,
  `workspace_id` bigint(20) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `t_st_virtual_table_standard_virtual_table_id_index`(`virtual_table_id`) USING BTREE,
  INDEX `t_st_virtual_table_standard_standard_id_index`(`standard_id`) USING BTREE,
  INDEX `t_st_virtual_table_standard_workspace_id_index`(`workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;
