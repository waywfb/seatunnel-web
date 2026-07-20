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
  DatasourceListParameters,
  DataSourceDetail,
  DatasourceTestConnectParameters
} from './types'

const DATASOURCE_BASE_URL = '/datasource'

export function createDatasource(data: DataSourceDetail): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/create',
    method: 'post',
    data
  })
}

export function updateDatasource(data: DataSourceDetail, id: string): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/' + id,
    method: 'put',
    data
  })
}

// export function checkConnect(data: any): any {
//   return axios({
//     url: DATASOURCE_BASE_URL + '/check/connect',
//     method: 'post',
//     data,
//     timeout: 0
//   })
// }

export function deleteDatasource(id: string): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/' + id,
    method: 'delete'
  })
}

export function getDatasourceDetail(id: string): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/' + id,
    method: 'get'
  })
}

export function getDatasourceList(params: DatasourceListParameters): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/list',
    method: 'get',
    params
  })
}

export function getDatasourceType(params: {
  showVirtualDataSource: boolean
  source?: 'WS' | 'WT'
}): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/support-datasources',
    method: 'get',
    params
  })
}

export function getDynamicFormItems(pluginName: string): any {
  return axios({
    url: DATASOURCE_BASE_URL + '/dynamic-form',
    method: 'get',
    params: { pluginName }
  })
}

export function getDatasourceTablesById(datasourceId: string, database: string): any {
  return axios({
    url: `/data-quality/tables/${datasourceId}`,
    method: 'get',
    params: {
      database
    }
  })
}

export function getDatasourceTableColumnsById(
  datasourceId: string,
  database: string,
  tableName: string
): any {
  return axios({
    url: '/ws/data-quality/schema',
    method: 'get',
    params: {
      datasourceId,
      database,
      tableName
    }
  })
}

export function datasourceDetail(id: string): any {
  return axios({
    url: `${DATASOURCE_BASE_URL}/` + id,
    method: 'get'
  })
}

export function datasourceAdd(data: any): any {
  return axios({
    // url: '/datasource/create',
    url: `${DATASOURCE_BASE_URL}/create`,
    method: 'post',
    data
  })
}

export function datasourceUpdate(data: any, id: string): any {
  return axios({
    url: `${DATASOURCE_BASE_URL}/` + id,
    method: 'put',
    data
  })
}

export function checkConnect(data: any): any {
  return axios({
    // url: '/datasource/check/connect',
    url: `${DATASOURCE_BASE_URL}/check/connect`,
    method: 'post',
    data
  })
}

export function dynamicFormItems(pluginName: string): any {
  return axios({
    url: `${DATASOURCE_BASE_URL}/dynamic-form`,
    method: 'get',
    params: { pluginName }
  })
}

export function datasourceList(params: any): any {
  return axios({
    url: `${DATASOURCE_BASE_URL}/list`,
    method: 'get',
    params
  })
}

export function datasourceDelete(id: string): any {
  return axios({
    url: `${DATASOURCE_BASE_URL}/` + id,
    method: 'delete'
  })
}

// ---- Tag Management APIs ----

const PLC_BASE_URL = '/datasource'

export function discoverTags(data: { connectionId: string; parentNodeId?: string; limit?: number; offset?: number }): any {
  return axios({
    url: PLC_BASE_URL + '/tags/discover',
    method: 'post',
    data
  })
}

export function importTags(id: string, data: any): any {
  return axios({
    url: PLC_BASE_URL + '/' + id + '/tags/import',
    method: 'post',
    data
  })
}

export function refreshTags(id: string, data?: any): any {
  return axios({
    url: PLC_BASE_URL + '/' + id + '/tags/refresh',
    method: 'post',
    data: data || {}
  })
}

export function getSyncTaskStatus(taskId: string): any {
  return axios({
    url: PLC_BASE_URL + '/sync-tasks/' + taskId,
    method: 'get'
  })
}

export function getTagList(datasourceId: string): any {
  return axios({
    url: PLC_BASE_URL + '/tags',
    method: 'get',
    params: { datasourceId }
  })
}

export function updateTag(tagId: string, data: any): any {
  return axios({
    url: PLC_BASE_URL + '/tags/' + tagId,
    method: 'put',
    data
  })
}

export function deleteTag(tagId: string): any {
  return axios({
    url: PLC_BASE_URL + '/tags/' + tagId,
    method: 'delete'
  })
}

export function getGroupTree(datasourceId: string): any {
  return axios({
    url: PLC_BASE_URL + '/groups',
    method: 'get',
    params: { datasourceId }
  })
}

export function createGroup(datasourceId: string, data: { parentPath: string; groupName: string; description?: string; sortOrder?: number; enabled?: boolean }): any {
  return axios({
    url: PLC_BASE_URL + '/groups',
    method: 'post',
    params: { datasourceId },
    data: [data]
  })
}

export function deleteGroup(groupId: string): any {
  return axios({
    url: PLC_BASE_URL + '/groups/' + groupId,
    method: 'delete'
  })
}

export function getDataStandardEnabledList(): any {
  return axios({
    url: '/seatunnel/api/v1/data-standard/enabled-list',
    method: 'get'
  })
}

export function getDataStandardFormat(standardId: string): any {
  return axios({
    url: '/seatunnel/api/v1/data-standard/' + standardId + '/format',
    method: 'get'
  })
}
