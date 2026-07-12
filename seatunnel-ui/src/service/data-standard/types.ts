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

// ========== Request Types ==========

export interface DataStandardPageParams {
  pageNo: number
  pageSize: number
  name?: string
  industry?: string
  status?: number
}

export interface DataStandardReq {
  name: string
  code: string
  industry?: string
  type?: string
  source?: string
  description?: string
}

export interface DataStandardVersionReq {
  description?: string
}

export interface DataStandardFieldReq {
  id?: number
  groupName?: string
  name: string
  code: string
  dataType: string
  length?: number
  precision?: number
  unit?: string
  defaultValue?: string
  required?: boolean
  description?: string
  sortOrder?: number
}

export interface DataStandardFormatReq {
  id?: number
  formatType: string
  fileType?: string
  recordSeparator?: string
  fieldSeparator?: string
  encoding?: string
  headerRows?: number
  quoteChar?: string
  escapeChar?: string
  description?: string
}

export interface DataStandardFieldMappingReq {
  id?: number
  fieldId?: number
  sourceName?: string
  sourceIndex?: number
  mappingType?: string
  sampleValue?: string
}

// ========== Response Types ==========

export interface DataStandardRes {
  id: number
  name: string
  code: string
  industry?: string
  type?: string
  source?: string
  status: number
  currentVersionId?: number
  description?: string
  createTime?: string
  updateTime?: string
}

export interface DataStandardDetailRes extends DataStandardRes {
  versions?: DataStandardVersionRes[]
}

export interface DataStandardVersionRes {
  id: number
  standardId: number
  version: string
  status: string
  isCurrent: boolean
  description?: string
  createTime?: string
}

export interface DataStandardVersionDetailRes extends DataStandardVersionRes {
  fields?: DataStandardFieldRes[]
  formats?: DataStandardFormatRes[]
  mappings?: DataStandardFieldMappingRes[]
}

export interface DataStandardFieldRes {
  id: number
  versionId: number
  groupName?: string
  name: string
  code: string
  dataType: string
  length?: number
  precision?: number
  unit?: string
  defaultValue?: string
  required?: boolean
  description?: string
  sortOrder?: number
}

export interface DataStandardFormatRes {
  id: number
  versionId: number
  formatType: string
  fileType?: string
  recordSeparator?: string
  fieldSeparator?: string
  encoding?: string
  headerRows?: number
  quoteChar?: string
  escapeChar?: string
  description?: string
}

export interface DataStandardFieldMappingRes {
  id: number
  versionId: number
  fieldId?: number
  fieldName?: string
  sourceName?: string
  sourceIndex?: number
  mappingType?: string
  sampleValue?: string
}

export interface DataStandardRelationRes {
  id: number
  standardId: number
  versionId: number
  objectType: string
  objectId: number
  createTime?: string
}

export interface VirtualTableStandardRes {
  id: number
  virtualTableId: number
  standardId: number
  standardVersionId: number
  snapshot?: string
  createTime?: string
}

export interface PageInfo<T> {
  total: number
  list: T[]
}
