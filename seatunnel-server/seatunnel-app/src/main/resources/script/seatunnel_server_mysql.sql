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

-- 本脚本用于全新建库，会对全部 23 张业务表执行 DROP TABLE，执行前务必确认目标库。
-- 必须显式指定目标库，否则 MySQL 报 "No database selected"：
--   mysql -h<host> -P<port> -u<user> -p<pwd> -D<dbname> < seatunnel_server_mysql.sql
-- 推荐使用同目录 init_sql.sh，目标库由 seatunnel_server_env.sh 的 DATABASE 指定。
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `type` int(2) NOT NULL,
  `role_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of role
-- ----------------------------
-- 幂等：role_name / username / workspace_name 均无唯一键，裸 INSERT 每执行一次就多一份
INSERT INTO `role`(`type`,`role_name`,`description`)
SELECT 0, 'ADMIN_ROLE', 'Admin User' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `role` WHERE `role_name` = 'ADMIN_ROLE' LIMIT 1) `t`);
INSERT INTO `role`(`type`,`role_name`,`description`)
SELECT 1, 'NORMAL_ROLE', 'Normal User' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `role` WHERE `role_name` = 'NORMAL_ROLE' LIMIT 1) `t`);

-- ----------------------------
-- Table structure for role_user_relation
-- ----------------------------
DROP TABLE IF EXISTS `role_user_relation`;
CREATE TABLE `role_user_relation`  (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `role_id` int(20) NOT NULL,
  `user_id` int(20) NOT NULL,
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_datasource
-- ----------------------------
DROP TABLE IF EXISTS `t_st_datasource`;
CREATE TABLE `t_st_datasource`  (
  `id` bigint(20) NOT NULL,
  `datasource_name` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `plugin_name` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `plugin_version` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT '1.0.0',
  `datasource_config` varchar(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `t_st_datasource_datasource_name_uindex`(`datasource_name`, `workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_definition
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_definition`;
CREATE TABLE `t_st_job_definition`  (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `job_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `job_mode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`, `workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_instance
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_instance`;
CREATE TABLE `t_st_job_instance`  (
  `id` bigint(20) NOT NULL,
  `job_define_id` bigint(20) NOT NULL,
  `job_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `job_config` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `engine_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `engine_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `job_engine_id` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `create_user_id` int(20) NOT NULL,
  `update_user_id` int(20) NULL DEFAULT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `end_time` timestamp(3) NULL DEFAULT NULL,
  `job_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `error_message` varchar(4096) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_instance_history
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_instance_history`;
CREATE TABLE `t_st_job_instance_history`  (
  `id` bigint(20) NOT NULL,
  `dag` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_line
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_line`;
CREATE TABLE `t_st_job_line`  (
  `id` bigint(20) NOT NULL,
  `version_id` bigint(20) NOT NULL,
  `input_plugin_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `target_plugin_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `job_line_version_index`(`version_id`, `workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_metrics
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_metrics`;
CREATE TABLE `t_st_job_metrics`  (
  `id` bigint(20) NOT NULL,
  `job_instance_id` bigint(20) NOT NULL,
  `pipeline_id` int(20) NOT NULL,
  `read_row_count` bigint(20) NOT NULL,
  `write_row_count` bigint(20) NOT NULL,
  `source_table_names` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `sink_table_names` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `read_qps` bigint(20) NULL DEFAULT NULL,
  `write_qps` bigint(20) NULL DEFAULT NULL,
  `record_delay` bigint(20) NULL DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `create_user_id` int(20) NOT NULL,
  `update_user_id` int(20) NULL DEFAULT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_task
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_task`;
CREATE TABLE `t_st_job_task`  (
  `id` bigint(20) NOT NULL,
  `version_id` bigint(20) NOT NULL,
  `plugin_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `config` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `transform_options` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `output_schema` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `connector_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `datasource_id` bigint(20) NULL DEFAULT NULL,
  `datasource_option` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `select_table_fields` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `scene_mode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `job_task_plugin_id_index`(`plugin_id`, `workspace_id` ) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_job_version
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_version`;
CREATE TABLE `t_st_job_version`  (
  `id` bigint(20) NOT NULL,
  `job_id` bigint(20) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `job_mode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `env` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  `engine_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `engine_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_virtual_table
-- ----------------------------
DROP TABLE IF EXISTS `t_st_virtual_table`;
CREATE TABLE `t_st_virtual_table`  (
  `id` bigint(20) NOT NULL,
  `datasource_id` bigint(20) NOT NULL,
  `virtual_database_name` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `virtual_table_name` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `table_fields` varchar(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `virtual_table_config` varchar(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NOT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` tinyint(4) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `auth_provider` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'DB',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_login_log
-- ----------------------------
DROP TABLE IF EXISTS `user_login_log`;
CREATE TABLE `user_login_log`  (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `token_status` tinyint(1) NOT NULL,
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 106 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_login_log
-- ----------------------------

INSERT INTO `user`(`username`,`password`,`status`,`type`)
SELECT 'admin', '7f97da8846fed829bb8d1fd9f8030f3b', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `user` WHERE `username` = 'admin' LIMIT 1) `t`);

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- Workspace related tables
-- ----------------------------
DROP TABLE IF EXISTS `workspace`;
CREATE TABLE `workspace`  (
                         `id` bigint(20) NOT NULL AUTO_INCREMENT,
                         `workspace_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
                         `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
                         `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                         `update_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                         PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

INSERT INTO `workspace`(`workspace_name`,`description`)
SELECT 'default', 'default workspace' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `workspace` WHERE `workspace_name` = 'default' LIMIT 1) `t`);


DROP TABLE IF EXISTS `t_st_job_metrics_history`;
-- auto-generated definition
create table t_st_job_metrics_history
(
    id                 bigint                                    not null
        primary key,
    job_instance_id    bigint                                    not null,
    pipeline_id        int(20)                                   not null,
    read_row_count     bigint                                    not null,
    write_row_count    bigint                                    not null,
    source_table_names varchar(200)                              null,
    sink_table_names   varchar(200)                              null,
    read_qps           bigint                                    null,
    write_qps          bigint                                    null,
    record_delay       bigint                                    null,
    status             varchar(20)                               null,
    create_user_id     int(20)                                   not null,
    update_user_id     int(20)                                   null,
    create_time        timestamp(3) default CURRENT_TIMESTAMP(3) not null,
    update_time        timestamp(3) default CURRENT_TIMESTAMP(3) not null on update CURRENT_TIMESTAMP(3)
)
    collate = utf8mb4_bin
    row_format = DYNAMIC;

create index idx_job_instance_id_create_time
    on t_st_job_metrics_history (job_instance_id, create_time);

-- ----------------------------
-- Table structure for t_st_datasource_tag_group
-- ----------------------------
DROP TABLE IF EXISTS `t_st_datasource_tag_group`;
CREATE TABLE `t_st_datasource_tag_group` (
  `id` bigint(20) NOT NULL,
  `datasource_id` bigint(20) NOT NULL,
  `level` int(11) NOT NULL DEFAULT 1,
  `path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `group_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `enabled` tinyint(1) DEFAULT 1,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_tg_datasource_id`(`datasource_id`) USING BTREE,
  INDEX `idx_tg_path`(`path`) USING BTREE,
  UNIQUE INDEX `uk_tg_datasource_path`(`datasource_id`, `path`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_datasource_tag
-- ----------------------------
DROP TABLE IF EXISTS `t_st_datasource_tag`;
CREATE TABLE `t_st_datasource_tag` (
  `id` bigint(20) NOT NULL,
  `datasource_id` bigint(20) NOT NULL,
  `group_id` bigint(20) DEFAULT NULL,
  `native_id` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tag_address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tag_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `source` tinyint(4) NOT NULL DEFAULT 1,
  `status` tinyint(4) NOT NULL DEFAULT 1,
  `alias` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `display_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `enabled` tinyint(1) DEFAULT 1,
  `sampling_interval` int(11) DEFAULT NULL,
  `deadband` double DEFAULT NULL,
  `read_only` tinyint(1) DEFAULT 0,
  `unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `precision` int(11) DEFAULT NULL,
  `properties` json DEFAULT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_dt_datasource_id`(`datasource_id`) USING BTREE,
  INDEX `idx_dt_group_id`(`group_id`) USING BTREE,
  INDEX `idx_dt_status`(`status`) USING BTREE,
  UNIQUE INDEX `uk_dt_datasource_native_id`(`datasource_id`, `native_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_st_config_audit_log (采集配置变更审计日志表)
-- ----------------------------
DROP TABLE IF EXISTS `t_st_config_audit_log`;
CREATE TABLE `t_st_config_audit_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `biz_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '业务类型: TAG(点位), GROUP(分组)',
  `biz_id` bigint(20) NOT NULL COMMENT '对应原表的主键 ID',
  `datasource_id` bigint(20) NOT NULL COMMENT '所属数据源 ID',
  `action_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '操作类型: INSERT(新增), UPDATE(修改), DELETE(物理删除)',
  `operator` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '操作人账号/系统自动导入',
  `before_snapshot` json DEFAULT NULL COMMENT '修改前的完整数据快照(JSON)',
  `after_snapshot` json DEFAULT NULL COMMENT '修改后的/新插入的完整数据快照(JSON)',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '备注/变更原因',
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_log_biz`(`biz_type`, `biz_id`) USING BTREE,
  INDEX `idx_log_datasource`(`datasource_id`) USING BTREE
) ENGINE=InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT=DYNAMIC COMMENT='采集配置变更审计日志表';


-- ----------------------------
-- Table structure for t_st_job_schedule (任务定时调度配置)
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_schedule`;
CREATE TABLE `t_st_job_schedule` (
  `id` bigint(20) NOT NULL COMMENT '主键 ID',
  `job_definition_id` bigint(20) NOT NULL COMMENT '关联任务定义 ID',
  `cron_expression` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Cron 表达式',
  `timezone` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'Asia/Shanghai' COMMENT '时区',
  `retry_times` int(11) NOT NULL DEFAULT 0 COMMENT '失败重试次数',
  `retry_interval` int(11) NOT NULL DEFAULT 60 COMMENT '重试间隔(秒)',
  `active_start_time` timestamp(3) NULL DEFAULT NULL COMMENT '生效开始时间',
  `active_end_time` timestamp(3) NULL DEFAULT NULL COMMENT '生效结束时间',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '调度状态: 0-停用 1-启用',
  `concurrent_policy` tinyint(4) NOT NULL DEFAULT 0 COMMENT '并发策略: 0-跳过(SKIP) 1-并行(PARALLEL)',
  `misfire_policy` tinyint(4) NOT NULL DEFAULT 0 COMMENT '错过补偿策略: 0-忽略 1-补执行一次',
  `notify_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '预留: 通知类型(邮件/钉钉/webhook)',
  `notify_target` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '预留: 通知目标',
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NULL DEFAULT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_schedule_job_definition`(`job_definition_id`, `workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic COMMENT='任务定时调度配置表';

-- ----------------------------
-- Table structure for t_st_job_schedule_trigger_log (调度触发记录)
-- ----------------------------
DROP TABLE IF EXISTS `t_st_job_schedule_trigger_log`;
CREATE TABLE `t_st_job_schedule_trigger_log` (
  `id` bigint(20) NOT NULL COMMENT '主键 ID',
  `schedule_id` bigint(20) NOT NULL COMMENT '调度配置 ID',
  `job_definition_id` bigint(20) NOT NULL COMMENT '任务定义 ID',
  `scheduled_fire_time` timestamp(3) NOT NULL COMMENT '预期触发时间',
  `actual_fire_time` timestamp(3) NOT NULL COMMENT '实际触发时间',
  `end_time` timestamp(3) NULL DEFAULT NULL COMMENT '结束时间',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '状态: 0-执行中 1-成功 2-失败 3-跳过',
  `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '本次触发已重试次数',
  `job_instance_id` bigint(20) NULL DEFAULT NULL COMMENT '关联任务实例 ID',
  `error_message` varchar(4096) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '失败原因',
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_tl_schedule`(`schedule_id`, `workspace_id`) USING BTREE,
  INDEX `idx_tl_job_definition`(`job_definition_id`, `workspace_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic COMMENT='任务调度触发记录表';

-- ----------------------------
-- Table structure for t_st_alert_rule (告警规则)
-- ----------------------------
DROP TABLE IF EXISTS `t_st_alert_rule`;
CREATE TABLE `t_st_alert_rule` (
  `id` bigint(20) NOT NULL COMMENT '主键 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '规则名称',
  `event_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'JOB_FAILED' COMMENT '触发事件类型: JOB_FAILED-任务失败',
  `webhook_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Webhook 推送地址',
  `webhook_headers` json DEFAULT NULL COMMENT '自定义请求头 JSON，如签名鉴权头',
  `webhook_template` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '消息模板，支持 ${jobName} ${errorMessage} 等占位符',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态: 1-启用 0-停用',
  `cooldown_seconds` int(11) NOT NULL DEFAULT 300 COMMENT '同实例告警冷却时间(秒)，防抖动重复推送',
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NULL DEFAULT NULL,
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_alert_rule_workspace`(`workspace_id`, `status`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic COMMENT='告警规则表';

-- ----------------------------
-- Table structure for t_st_alert_event (告警事件)
-- ----------------------------
DROP TABLE IF EXISTS `t_st_alert_event`;
CREATE TABLE `t_st_alert_event` (
  `id` bigint(20) NOT NULL COMMENT '主键 ID',
  `rule_id` bigint(20) NOT NULL COMMENT '触发的告警规则 ID',
  `job_instance_id` bigint(20) NOT NULL COMMENT '来源任务实例 ID',
  `job_define_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '任务定义名称(冗余存储，便于列表展示)',
  `error_message` varchar(4096) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '失败原因',
  `send_status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '发送状态: 0-待发送 1-已发送 2-发送失败',
  `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '已重试次数',
  `send_time` timestamp(3) NULL DEFAULT NULL COMMENT '发送成功时间',
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_alert_event_status`(`send_status`) USING BTREE,
  INDEX `idx_alert_event_instance`(`job_instance_id`, `workspace_id`) USING BTREE,
  INDEX `idx_alert_event_workspace_time`(`workspace_id`, `create_time`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic COMMENT='告警事件表';

-- ----------------------------
-- Table structure for t_st_alert_event_history (告警事件历史归档)
-- ----------------------------
DROP TABLE IF EXISTS `t_st_alert_event_history`;
CREATE TABLE `t_st_alert_event_history` (
  `id` bigint(20) NOT NULL COMMENT '主键 ID',
  `rule_id` bigint(20) NOT NULL COMMENT '触发的告警规则 ID',
  `job_instance_id` bigint(20) NOT NULL COMMENT '来源任务实例 ID',
  `job_define_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '任务定义名称(冗余存储，便于列表展示)',
  `error_message` varchar(4096) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL COMMENT '失败原因',
  `send_status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '发送状态: 0-待发送 1-已发送 2-发送失败',
  `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '已重试次数',
  `send_time` timestamp(3) NULL DEFAULT NULL COMMENT '发送成功时间',
  `create_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '事件产生时间(保留原值)',
  `update_time` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `workspace_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_alert_event_history_workspace_time`(`workspace_id`, `create_time`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic COMMENT='告警事件历史归档表(超过保留期的事件由 t_st_alert_event 迁入，只增不删)';

