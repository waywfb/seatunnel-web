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
import {
  VirtualTableDetail,
  VirtualTableListParameters,
  DynamicConfigParameters
} from './types'

const VIRTUAL_TABLE_BASE_URL = '/virtual_table'

export function createVirtualTable(data: VirtualTableDetail): any {
  return axios({
    url: VIRTUAL_TABLE_BASE_URL + '/create',
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    transformRequest: () => JSON.stringify(data)
  })
}

export function updateVirtualTable(data: VirtualTableDetail, id: string): any {
  return axios({
    url: VIRTUAL_TABLE_BASE_URL + '/' + id,
    method: 'put',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    transformRequest: () => JSON.stringify(data)
  })
}

export function deleteVirtualTable(id: string): any {
  return axios({
    url: VIRTUAL_TABLE_BASE_URL + '/' + id,
    method: 'delete'
  })
}

export function getVirtualTableDetail(id: string): any {
  return axios({
    url: VIRTUAL_TABLE_BASE_URL + '/' + id,
    method: 'get'
  })
}

export function getVirtualTableList(params: VirtualTableListParameters): any {
  return axios({
    url: VIRTUAL_TABLE_BASE_URL + '/list',
    method: 'get',
    params
  })
}

export function getDynamicConfig(params: DynamicConfigParameters): any {
  return axios({
    url: VIRTUAL_TABLE_BASE_URL + '/dynamic_config',
    method: 'get',
    params
  })
}

export function getFieldType(): any {
  return axios({
    url: '/engine/type',
    method: 'get'
  })
}

export function getDatasourceSchema(
  datasourceId: string,
  databaseName: string,
  tableName: string
): any {
  return axios({
    url: '/datasource/schema',
    method: 'get',
    params: { datasourceId, databaseName, tableName }
  })
}

export function getKafkaMessage(
  datasourceId: string,
  topic: string,
  offset?: number
): any {
  return axios({
    url: '/datasource/message',
    method: 'get',
    params: { datasourceId, topic, offset }
  })
}

export function getHttpResponse(datasourceId: string): any {
  return axios({
    url: '/datasource/' + datasourceId + '/response',
    method: 'get'
  })
}

export function deriveFromMessage(value: string): any {
  return axios({
    url: '/datasource/schema/derive',
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    data: { value }
  })
}

export function flattenJson(value: string, strategy: string): any {
  return axios({
    url: '/datasource/json/flatten',
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    data: { value, strategy }
  })
}
