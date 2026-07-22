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
import type {
  DataStandardPageParams,
  DataStandardReq,
  DataStandardVersionReq,
  DataStandardFieldReq,
  DataStandardFormatReq,
  DataStandardFieldMappingReq
} from './types'

const BASE_URL = '/data-standard'

// ========== Standard CRUD ==========

export function getDataStandardPage(params: DataStandardPageParams): any {
  return axios({
    url: BASE_URL + '/page',
    method: 'get',
    params
  })
}

export function getDataStandardDetail(id: number): any {
  return axios({
    url: BASE_URL + '/' + id,
    method: 'get'
  })
}

export function createDataStandard(data: DataStandardReq): any {
  return axios({
    url: BASE_URL + '/create',
    method: 'post',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

export function updateDataStandard(id: number, data: DataStandardReq): any {
  return axios({
    url: BASE_URL + '/' + id,
    method: 'put',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

export function deleteDataStandard(id: number): any {
  return axios({
    url: BASE_URL + '/' + id,
    method: 'delete'
  })
}

export function enableDataStandard(id: number): any {
  return axios({
    url: BASE_URL + '/' + id + '/enable',
    method: 'post'
  })
}

export function disableDataStandard(id: number): any {
  return axios({
    url: BASE_URL + '/' + id + '/disable',
    method: 'post'
  })
}

export function copyDataStandard(id: number): any {
  return axios({
    url: BASE_URL + '/' + id + '/copy',
    method: 'post'
  })
}

// ========== Version ==========

export function getVersionList(standardId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/list',
    method: 'get'
  })
}

export function getVersionDetail(standardId: number, versionId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId,
    method: 'get'
  })
}

export function createVersion(
  standardId: number,
  data: DataStandardVersionReq
): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/create',
    method: 'post',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

export function updateVersion(
  standardId: number,
  versionId: number,
  data: DataStandardVersionReq
): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId,
    method: 'put',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

export function deleteVersion(standardId: number, versionId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId,
    method: 'delete'
  })
}

export function publishVersion(standardId: number, versionId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId + '/publish',
    method: 'post'
  })
}

export function archiveVersion(standardId: number, versionId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId + '/archive',
    method: 'post'
  })
}

// ========== Field ==========

export function getFieldList(standardId: number, versionId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId + '/field/list',
    method: 'get'
  })
}

export function batchUpdateFields(
  standardId: number,
  versionId: number,
  data: DataStandardFieldReq[]
): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId + '/field/batch',
    method: 'post',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

// ========== Format ==========

export function getFormatList(standardId: number, versionId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/version/' + versionId + '/format/list',
    method: 'get'
  })
}

export function batchUpdateFormats(
  standardId: number,
  versionId: number,
  data: DataStandardFormatReq[]
): any {
  return axios({
    url:
      BASE_URL + '/' + standardId + '/version/' + versionId + '/format/batch',
    method: 'post',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

// ========== Mapping ==========

export function getMappingList(standardId: number, versionId: number): any {
  return axios({
    url:
      BASE_URL + '/' + standardId + '/version/' + versionId + '/mapping/list',
    method: 'get'
  })
}

export function batchUpdateMappings(
  standardId: number,
  versionId: number,
  data: DataStandardFieldMappingReq[]
): any {
  return axios({
    url:
      BASE_URL + '/' + standardId + '/version/' + versionId + '/mapping/batch',
    method: 'post',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    transformRequest: () => JSON.stringify(data)
  })
}

// ========== Relation ==========

export function getRelationList(standardId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/relation/list',
    method: 'get'
  })
}

// ========== Schema ==========

export function getDataStandardSchema(standardId: number): any {
  return axios({
    url: BASE_URL + '/' + standardId + '/schema',
    method: 'get'
  })
}
