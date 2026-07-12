-- ============================================================
-- 数据标准初始化数据：煤矿安全监控系统数据标准
-- ============================================================

-- 1. 标准基本信息
INSERT INTO `t_st_data_standard` (
  `id`, `name`, `code`, `type`, `current_version_id`, `status`, `description`,
  `workspace_id`, `create_user_id`, `update_user_id`, `create_time`, `update_time`
) VALUES (
  1001, '煤矿安全监控系统数据标准', 'coal-safety-monitor', 'GB', 2001, 1,
  '煤矿安全监控系统数据接入标准，包含测点基本信息和消息头数据结构',
  1, 1, 1, NOW(3), NOW(3)
);

-- 2. 版本记录（V1.0，DRAFT状态）
INSERT INTO `t_st_data_standard_version` (
  `id`, `standard_id`, `version`, `status`, `is_current`, `description`,
  `workspace_id`, `create_user_id`, `create_time`
) VALUES (
  2001, 1001, 'V1.0', 'DRAFT', 1, '初始版本，包含测点基本信息和消息头数据结构',
  1, 1, NOW(3)
);

-- ============================================================
-- 3. 字段定义：测点基本信息（24个字段）
-- ============================================================
INSERT INTO `t_st_data_standard_field` (
  `id`, `version_id`, `group_name`, `name`, `code`, `data_type`, `length`, `precision`,
  `unit`, `default_value`, `required`, `description`, `sort_order`, `field_type`,
  `workspace_id`, `create_time`, `update_time`
) VALUES
-- 测点编码
(3001, 2001, '测点基本信息', '测点编码', 'point_code', '字符', 28, NULL,
 NULL, NULL, 1, '必填项，编码规则详见附录 A.2 测点编码', 1, 'BODY', 1, NOW(3), NOW(3)),
-- 系统编码
(3002, 2001, '测点基本信息', '系统编码', 'system_code', '数值', 2, NULL,
 NULL, NULL, 1, '必填项，字典值，参见字典附录 B.1 系统编码', 2, 'BODY', 1, NOW(3), NOW(3)),
-- 分站编码
(3003, 2001, '测点基本信息', '分站编码', 'station_code', '字符', 17, NULL,
 NULL, NULL, 1, '必填项，编码规则详见附录 A.4 分站编码', 3, 'BODY', 1, NOW(3), NOW(3)),
-- 传感器类型
(3004, 2001, '测点基本信息', '传感器类型', 'sensor_type', '数值', 4, NULL,
 NULL, NULL, 1, '必填项，字典值，参见数据字典附录 B.2 传感器类型', 4, 'BODY', 1, NOW(3), NOW(3)),
-- 测点数值类型
(3005, 2001, '测点基本信息', '测点数值类型', 'point_value_type', '字符', 2, NULL,
 NULL, NULL, 1, '必填项，字典值，参见数据字典附录 B.5 测点数值类型', 5, 'BODY', 1, NOW(3), NOW(3)),
-- 测点数值单位
(3006, 2001, '测点基本信息', '测点数值单位', 'point_value_unit', '字符', 0, NULL,
 NULL, NULL, 0, '如果测点数值类型是 MN（模拟量）则为必填项，否则为空。字典值，参见数据字典附录 B.6 测点数值单位', 6, 'BODY', 1, NOW(3), NOW(3)),
-- 高量程
(3007, 2001, '测点基本信息', '高量程', 'high_range', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 7, 'BODY', 1, NOW(3), NOW(3)),
-- 低量程
(3008, 2001, '测点基本信息', '低量程', 'low_range', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 8, 'BODY', 1, NOW(3), NOW(3)),
-- 上限报警门限
(3009, 2001, '测点基本信息', '上限报警门限', 'high_alarm_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 9, 'BODY', 1, NOW(3), NOW(3)),
-- 上限解报门限
(3010, 2001, '测点基本信息', '上限解报门限', 'high_clear_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 10, 'BODY', 1, NOW(3), NOW(3)),
-- 下限报警门限
(3011, 2001, '测点基本信息', '下限报警门限', 'low_alarm_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 11, 'BODY', 1, NOW(3), NOW(3)),
-- 下限解报门限
(3012, 2001, '测点基本信息', '下限解报门限', 'low_clear_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 12, 'BODY', 1, NOW(3), NOW(3)),
-- 上限断电门限
(3013, 2001, '测点基本信息', '上限断电门限', 'high_power_off_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 13, 'BODY', 1, NOW(3), NOW(3)),
-- 上限复电门限
(3014, 2001, '测点基本信息', '上限复电门限', 'high_power_on_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 14, 'BODY', 1, NOW(3), NOW(3)),
-- 下限断电门限
(3015, 2001, '测点基本信息', '下限断电门限', 'low_power_off_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 15, 'BODY', 1, NOW(3), NOW(3)),
-- 下限复电门限
(3016, 2001, '测点基本信息', '下限复电门限', 'low_power_on_threshold', '数值', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 MN（模拟量）时，该字段为必填项；为其他值时字段为空', 16, 'BODY', 1, NOW(3), NOW(3)),
-- 开描述
(3017, 2001, '测点基本信息', '开描述', 'on_description', '字符', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 KG（开关量）时，该字段为必填项；为其他值时字段为空', 17, 'BODY', 1, NOW(3), NOW(3)),
-- 停描述
(3018, 2001, '测点基本信息', '停描述', 'off_description', '字符', NULL, NULL,
 NULL, NULL, 0, '当测点数值类型字段为 KG（开关量）时，该字段为必填项；为其他值时字段为空', 18, 'BODY', 1, NOW(3), NOW(3)),
-- 测点安装位置
(3019, 2001, '测点基本信息', '测点安装位置', 'point_location', '字符', NULL, NULL,
 NULL, NULL, 1, '必填项，汉字，传感器实际安装位置', 19, 'BODY', 1, NOW(3), NOW(3)),
-- 位置 X
(3020, 2001, '测点基本信息', '位置 X', 'position_x', '数值', 10, 2,
 NULL, NULL, 0, '非必填项，设备位置 X 坐标，统一为 2000 坐标系', 20, 'BODY', 1, NOW(3), NOW(3)),
-- 位置 Y
(3021, 2001, '测点基本信息', '位置 Y', 'position_y', '数值', 10, 2,
 NULL, NULL, 0, '非必填项，设备位置 Y 坐标，统一为 2000 坐标系', 21, 'BODY', 1, NOW(3), NOW(3)),
-- 位置 Z
(3022, 2001, '测点基本信息', '位置 Z', 'position_z', '数值', 10, 2,
 NULL, NULL, 0, '非必填项，设备位置 Z 坐标，统一为 2000 坐标系', 22, 'BODY', 1, NOW(3), NOW(3)),
-- 传感器关联关系
(3023, 2001, '测点基本信息', '传感器关联关系 (D、K、Z)', 'sensor_relation', '字符', NULL, NULL,
 NULL, NULL, 0, '非必填项，具体参看字典附录 B.7 测点关联关系', 23, 'BODY', 1, NOW(3), NOW(3)),
-- 数据时间
(3024, 2001, '测点基本信息', '数据时间', 'data_time', '日期', 14, NULL,
 NULL, NULL, 1, '必填项，传感器定义时间。日期时间格式字符串，格式为 yyyy-MM-dd HH:mm:ss', 24, 'BODY', 1, NOW(3), NOW(3));

-- ============================================================
-- 4. 字段定义：消息头数据结构（7个字段）- 属于测点基本信息
-- ============================================================
INSERT INTO `t_st_data_standard_field` (
  `id`, `version_id`, `group_name`, `name`, `code`, `data_type`, `length`, `precision`,
  `unit`, `default_value`, `required`, `description`, `sort_order`, `field_type`,
  `workspace_id`, `create_time`, `update_time`
) VALUES
-- 煤矿编码
(3101, 2001, '测点基本信息', '煤矿编码', 'coal_mine_code', '字符', 12, NULL,
 NULL, NULL, 1, '煤矿安全监察系统定义，12位', 25, 'HEADER', 1, NOW(3), NOW(3)),
-- 矿井名称
(3102, 2001, '测点基本信息', '矿井名称', 'mine_name', '字符', 50, NULL,
 NULL, NULL, 1, '矿井中文名称', 26, 'HEADER', 1, NOW(3), NOW(3)),
-- 系统型号
(3103, 2001, '测点基本信息', '系统型号', 'system_model', '字符', 50, NULL,
 'N', NULL, 0, '系统型号', 27, 'HEADER', 1, NOW(3), NOW(3)),
-- 系统名称
(3104, 2001, '测点基本信息', '系统名称', 'system_name', '字符', 50, NULL,
 'N', NULL, 0, '系统名称', 28, 'HEADER', 1, NOW(3), NOW(3)),
-- 生产厂家名称
(3105, 2001, '测点基本信息', '生产厂家名称', 'manufacturer_name', '字符', 50, NULL,
 'N', NULL, 0, '系统生产厂家名称', 29, 'HEADER', 1, NOW(3), NOW(3)),
-- 安全标志有效期
(3106, 2001, '测点基本信息', '安全标志有效期', 'safety_cert_expire', '日期', 10, NULL,
 'N', NULL, 0, '安标的有效期，格式为yyyy-MM-dd', 30, 'HEADER', 1, NOW(3), NOW(3)),
-- 数据上传时间
(3107, 2001, '测点基本信息', '数据上传时间', 'data_upload_time', '日期', 19, NULL,
 NULL, NULL, 1, '数据上传时间，格式为yyyy-MM-dd hh:mm:ss', 31, 'HEADER', 1, NOW(3), NOW(3));

-- ============================================================
-- 5. 格式配置
-- ============================================================
INSERT INTO `t_st_data_standard_format` (
  `id`, `version_id`, `format_type`, `file_type`, `record_separator`, `field_separator`,
  `encoding`, `header_rows`, `quote_char`, `escape_char`, `file_terminator`, `description`,
  `workspace_id`, `create_time`, `update_time`
) VALUES (
  4001, 2001, 'DELIMITER', '.txt', '~', ';',
  'UTF-8', 0, NULL, NULL, '||',
  '文件格式：每行一条记录用~结尾，字段用;分隔，文件末尾用||表示结束，UTF-8无BOM编码，无全角符号',
  1, NOW(3), NOW(3)
);
