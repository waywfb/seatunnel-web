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

import { axios } from '@/service/service'

/** 告警规则 */
export interface AlertRule {
  id?: number
  name: string
  eventType?: string
  webhookUrl: string
  webhookHeaders?: string
  webhookTemplate?: string
  status?: number
  cooldownSeconds?: number
  createTime?: string
  updateTime?: string
}

/** 告警事件 */
export interface AlertEvent {
  id?: number
  ruleId?: number
  ruleName?: string
  jobInstanceId?: number
  jobDefineName?: string
  errorMessage?: string
  sendStatus?: number
  retryCount?: number
  sendTime?: string
  createTime?: string
}

export interface AlertRulePageQuery {
  pageNo: number
  pageSize: number
  status?: number
  name?: string
}

export interface AlertEventPageQuery {
  pageNo: number
  pageSize: number
  sendStatus?: number
  ruleId?: number
  jobDefineName?: string
}

export function alertRuleList(params: AlertRulePageQuery): any {
  return axios({
    url: '/alert/rule',
    method: 'get',
    params
  })
}

export function alertRuleCreate(data: AlertRule): any {
  return axios({
    url: '/alert/rule',
    method: 'post',
    data
  })
}

export function alertRuleUpdate(ruleId: number, data: AlertRule): any {
  return axios({
    url: `/alert/rule/${ruleId}`,
    method: 'put',
    data
  })
}

export function alertRuleDelete(ruleId: number): any {
  return axios({
    url: `/alert/rule/${ruleId}`,
    method: 'delete'
  })
}

/** 向规则配置的 webhook 发送一条测试消息 */
export function alertRuleTest(ruleId: number): any {
  return axios({
    url: `/alert/rule/${ruleId}/test`,
    method: 'post'
  })
}

export function alertEventList(params: AlertEventPageQuery): any {
  return axios({
    url: '/alert/event',
    method: 'get',
    params
  })
}
