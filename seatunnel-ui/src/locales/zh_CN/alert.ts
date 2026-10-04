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

export default {
  alert: '告警',
  rule_tab: '告警规则',
  event_tab: '告警事件',
  history_tab: '历史归档',
  rule_name: '规则名称',
  event_type: '告警事件类型',
  event_type_task_failed: '任务失败',
  webhook_url: 'Webhook 地址',
  webhook_headers: '请求头（JSON）',
  webhook_headers_tips:
    '可选，JSON 格式，例如 {\'{"Content-Type": "application/json"}\'}',
  webhook_template: '消息模板',
  webhook_template_tips:
    // eslint-disable-next-line quotes -- vue-i18n 字面量语法需单引号，prettier 因此改用双引号
    "可选，支持占位符 {'{eventName}'} {'{ruleName}'} {'{jobDefineName}'} {'{jobInstanceId}'} {'{errorMessage}'} {'{sendTime}'}",
  status: '状态',
  status_enabled: '启用',
  status_disabled: '停用',
  cooldown_seconds: '冷却时间（秒）',
  cooldown_tips: '同一条规则在该时间内最多发送一次告警，默认 300 秒',
  create_rule: '新建规则',
  edit_rule: '编辑规则',
  test_send: '测试发送',
  test_send_success: '测试消息已发送',
  test_send_failed: '测试发送失败，请检查 Webhook 地址与网络',
  delete_rule_tips: '是否删除该告警规则？删除后无法恢复',
  job_name: '任务名称',
  job_instance_id: '任务实例 ID',
  error_message: '错误信息',
  send_status: '发送状态',
  send_status_pending: '待发送',
  send_status_success: '发送成功',
  send_status_failed: '发送失败',
  retry_count: '重试次数',
  send_time: '发送时间',
  create_time: '创建时间',
  event_create_time: '发生时间',
  rule_name_required: '必填字段',
  webhook_url_required: '必填字段，且必须为 http/https 地址',
  headers_invalid: '必须为合法的 JSON 对象',
  rules_empty: '暂无告警规则，点击「新建规则」创建',
  events_empty: '暂无告警记录'
}
