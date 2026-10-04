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

import login from '@/locales/zh_CN/login'
import menu from '@/locales/zh_CN/menu'
import modal from '@/locales/zh_CN/modal'
import user_manage from '@/locales/zh_CN/user-manage'
import log from '@/locales/zh_CN/log'
import tasks from '@/locales/zh_CN/tasks'
import setting from '@/locales/zh_CN/setting'
import datasource from '@/locales/zh_CN/datasource'
import virtual_tables from '@/locales/zh_CN/virtual-tables'
import theme from '@/locales/zh_CN/theme'
import project from '@/locales/zh_CN/project'
import hook from '@/locales/zh_CN/hook'
import common from '@/locales/zh_CN/common'
import security from '@/locales/zh_CN/security'
import data_pipes from '@/locales/zh_CN/data-pipes'
import transforms from '@/locales/zh_CN/transforms'
import data_standard from '@/locales/zh_CN/data-standard'
import alert from '@/locales/zh_CN/alert'

export default {
  security,
  common,
  login,
  menu,
  modal,
  user_manage,
  log,
  tasks,
  setting,
  datasource,
  virtual_tables,
  theme,
  project,
  hook,
  data_pipes,
  transforms,
  data_standard,
  alert,
  dag: {
    nodeConfigHint:
      '双击节点进行配置。配置完成后，连接每个节点的端点到其他节点。'
  },
  cyclic: '周期轮询',
  change_of_state: '状态变更',
  event: '事件触发',
  polling: '轮询',
  subscription: '订阅',
  mode: '采集模式',
  host: '主机地址',
  port: '端口',
  securityPolicy: '安全策略',
  username: '用户名',
  password: '密码',
  connectTimeout: '连接超时(毫秒)',
  readTimeout: '读取超时(毫秒)',
  subscription_type: '订阅类型',
  subscription_interval_ms: '订阅间隔(毫秒)',
  poll_interval_ms: '轮询间隔(毫秒)',
  row_delimiter: '行分隔符',
  field_delimiter: '字段分隔符',
  schema: '数据结构',
  encoding: '编码',
  required: '必填'
}
