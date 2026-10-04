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
  alert: 'Alert',
  rule_tab: 'Alert Rules',
  event_tab: 'Alert Events',
  history_tab: 'Archived',
  rule_name: 'Rule Name',
  event_type: 'Event Type',
  event_type_task_failed: 'Task Failed',
  webhook_url: 'Webhook URL',
  webhook_headers: 'Headers (JSON)',
  webhook_headers_tips:
    'Optional, JSON format, e.g. {\'{"Content-Type": "application/json"}\'}',
  webhook_template: 'Message Template',
  webhook_template_tips:
    // eslint-disable-next-line quotes -- vue-i18n literal syntax needs single quotes, hence double quotes here
    "Optional, supports placeholders {'{eventName}'} {'{ruleName}'} {'{jobDefineName}'} {'{jobInstanceId}'} {'{errorMessage}'} {'{sendTime}'}",
  status: 'Status',
  status_enabled: 'Enabled',
  status_disabled: 'Disabled',
  cooldown_seconds: 'Cooldown (seconds)',
  cooldown_tips:
    'At most one alert per rule within this interval, defaults to 300 seconds',
  create_rule: 'New Rule',
  edit_rule: 'Edit Rule',
  test_send: 'Test Send',
  test_send_success: 'Test message sent',
  test_send_failed:
    'Test send failed, please check the webhook URL and network',
  delete_rule_tips: 'Delete this alert rule? This cannot be undone',
  job_name: 'Job Name',
  job_instance_id: 'Job Instance ID',
  error_message: 'Error Message',
  send_status: 'Send Status',
  send_status_pending: 'Pending',
  send_status_success: 'Sent',
  send_status_failed: 'Failed',
  retry_count: 'Retries',
  send_time: 'Send Time',
  create_time: 'Create Time',
  event_create_time: 'Occurred At',
  rule_name_required: 'Required',
  webhook_url_required: 'Required, must be an http/https address',
  headers_invalid: 'Must be a valid JSON object',
  rules_empty: 'No alert rules yet, click "New Rule" to create one',
  events_empty: 'No alert events'
}
