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

package org.apache.seatunnel.server.common;

import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

public enum SeatunnelErrorEnum {
    SCRIPT_ALREADY_EXIST(10001, "脚本已存在", "已存在同名脚本 : '%s'"),
    NO_SUCH_SCRIPT(10002, "脚本不存在", "脚本不存在，可能已被其他用户删除。"),
    USER_ALREADY_EXISTS(10003, "用户已存在", "用户名 [%s] 已存在。"),
    NO_SUCH_USER(10004, "用户不存在", "用户不存在，可能已被其他用户删除。"),
    SCHEDULER_CONFIG_NOT_EXIST(10005, "调度配置不存在", "该脚本的调度配置不存在，请核对配置信息。"),
    JSON_TRANSFORM_FAILED(10006, "JSON转换失败", "JSON数据转换异常，该问题大概率为程序bug。"),

    USERNAME_PASSWORD_NO_MATCHED(10007, "账号密码不匹配或用户已被禁用", "用户名与密码不匹配，或者当前用户已被禁用，请检查输入内容。"),

    TOKEN_ILLEGAL(10008, "令牌非法", "令牌已过期或无效，请重新登录。"),
    INVALID_AUTHENTICATION_PROVIDER(10010, "请传入受支持的认证方式，默认使用数据库认证", "无效的认证方式：[%s]"),
    NO_SUCH_JOB(10009, "任务不存在", "任务不存在，可能已被其他用户删除。"),

    /** request dolphinscheduler failed */
    UNEXPECTED_RETURN_CODE(20000, "返回码异常", "异常返回码：[%s]，错误信息：[%s]"),
    QUERY_PROJECT_CODE_FAILED(20001, "查询项目编码失败", "调用数据源查询项目编码请求失败"),
    NO_MATCHED_PROJECT(20002, "无匹配项目", "未找到匹配项目[%s]，请检查配置"),
    NO_MATCHED_SCRIPT_SAVE_DIR(20003, "无匹配脚本保存目录", "未找到匹配的脚本保存目录[%s]，请检查配置"),
    GET_INSTANCE_FAILED(20004, "获取实例失败", "实例获取失败"),

    ERROR_CONFIG(99994, "组件配置错误，请检查", "%s"),
    NO_SUCH_ELEMENT(99995, "元素不存在", "未找到对应元素"),
    UNSUPPORTED_OPERATION(99996, "操作不被支持", "当前不支持执行该操作：[%s]"),
    HTTP_REQUEST_FAILED(99997, "HTTP请求失败", "HTTP调用异常，请求地址：%s"),
    ILLEGAL_STATE(99998, "状态异常", "%s"),
    UNKNOWN(99999, "未知异常", "系统出现未知异常"),

    UNSUPPORTED_CONNECTOR_TYPE(
            30000, "连接器类型不支持", "不支持的连接器类型[%s]，当前仅支持source源、sink目标、transform转换类连接器"),
    CONNECTOR_NOT_FOUND(30001, "连接器不存在", "类型[%s]的连接器[%s]未找到"),

    JOB_METRICS_QUERY_KEY_ERROR(
            40000,
            "任务指标查询键格式错误",
            "指标查询键[%s]必须包含分隔符[" + Constants.METRICS_QUERY_KEY_SPLIT + "]，且分割后数组长度必须为2"),
    LOAD_ENGINE_METRICS_JSON_ERROR(40001, "加载引擎指标JSON失败", "读取引擎[%s]指标JSON数据异常，错误信息：[%s]"),
    LOAD_ENGINE_JOB_STATUS_JSON_ERROR(40002, "从引擎读取任务状态失败", "获取引擎[%s]中的任务状态出错，错误信息：[%s]"),
    UNSUPPORTED_ENGINE(40003, "引擎不兼容", "不支持该引擎[%s]，版本[%s]"),
    JOB_EXEC_SUBMISSION_ERROR(40004, "任务提交执行失败", "%s"),
    LOAD_ENGINE_METRICS_ERROR(40005, "读取引擎指标失败", "获取引擎指标出错，错误信息：[%s]"),
    JOB_NO_VALUE_FOUND_FOR_PLACEHOLDER(40006, "占位符无对应值", "占位符[%s]未配置取值"),
    INVALID_OPERATION(40007, "非法操作", "不允许执行操作[%s]"),

    JOB_RUN_GENERATE_UUID_ERROR(50001, "生成UUID失败", "UUID生成异常"),
    /* datasource and virtual table */
    DATASOURCE_NOT_FOUND(60001, "数据源不存在", "数据源[%s]未找到"),
    VIRTUAL_TABLE_NOT_FOUND(60002, "虚拟表不存在", "虚拟表[%s]未找到"),
    VIRTUAL_TABLE_ALREADY_EXISTS(60003, "虚拟表名称已存在", "虚拟表[%s]已存在"),
    DATASOURCE_NAME_ALREADY_EXISTS(60004, "数据源名称已存在", "数据源[%s]已存在"),
    DATASOURCE_NOT_EXISTS(60005, "数据源不存在", "数据源[%s]不存在"),
    VIRTUAL_TABLE_NOT_EXISTS(60006, "虚拟表不存在", "虚拟表[%s]不存在"),
    DATASOURCE_PRAM_NOT_ALLOWED_NULL(60007, "数据源参数不能为空", "数据源参数[%s]不允许为空"),
    VIRTUAL_TABLE_PRAM_NOT_ALLOWED_NULL(60008, "虚拟表参数不能为空", "虚拟表参数[%s]不允许为空"),
    DATASOURCE_TYPE_NOT_SUPPORT(60009, "数据源类型不支持", "不支持的数据源类型[%s]"),
    DATASOURCE_CONNECT_FAILED(60010, "数据源连接失败", "数据源连接异常"),
    DATASOURCE_CREATE_FAILED(60011, "数据源创建失败", "数据源创建操作失败"),
    VIRTUAL_TABLE_CREATE_FAILED(60012, "虚拟表创建失败", "虚拟表创建操作失败"),
    VIRTUAL_TABLE_ID_IS_NULL(60013, "虚拟表ID为空", "虚拟表ID不能为空"),
    VIRTUAL_TABLE_FIELD_EMPTY(60014, "虚拟表字段为空", "虚拟表字段不能为空"),
    DATASOURCE_CAN_NOT_DELETE(60015, "数据源正在被虚拟表使用，无法删除", "数据源正在被虚拟表使用，无法删除"),
    VIRTUAL_TABLE_CAN_NOT_DELETE(60016, "虚拟表无法删除，已被任务占用", "该虚拟表已被任务引用，不允许删除"),
    CAN_NOT_FOUND_CONNECTOR_FOR_DATASOURCE(60017, "未找到对应数据源的连接器", "未匹配到数据源[%s]对应的连接器"),
    DATA_SOURCE_HAD_USED(1600000, "数据源正在被任务使用，无法删除", "数据源正在被任务使用，无法删除"),
    INVALID_DATASOURCE(-70001, "Datasource invalid", "datasource [{0}] invalid", "数据源无效"),
    MISSING_PARAM(1777000, "缺少参数[{0}]", "缺少参数[{0}]"),
    PARAM_CAN_NOT_BE_NULL(60018, "", "参数[%s]不能为空"),
    INVALID_PARAM(60019, "", "参数[%s]非法。%s"),
    TASK_NAME_ALREADY_EXISTS(60020, "任务名称已存在", "任务[%s]已存在"),
    RESOURCE_NOT_FOUND(404, "", "资源不存在：%s"),
    RESOURCE_ALREADY_EXISTS(60021, "资源已存在", "资源[%s]已存在"),
    ACCESS_DENIED(403, "权限不足", "%s");

    private final int code;
    private final String msg;
    private final String template;
    private final String zhMsg;

    SeatunnelErrorEnum(int code, String msg, String template) {
        this(code, msg, template, msg);
    }

    SeatunnelErrorEnum(int code, String msg, String template, String zhMsg) {
        this.code = code;
        this.msg = msg;
        this.template = template;
        this.zhMsg = zhMsg;
    }

    public int getCode() {
        return code;
    }

    public String getMsg() {
        if (Locale.SIMPLIFIED_CHINESE
                .getLanguage()
                .equals(LocaleContextHolder.getLocale().getLanguage())) {
            return zhMsg;
        }
        return msg;
    }

    public String getTemplate() {
        return template;
    }
}
