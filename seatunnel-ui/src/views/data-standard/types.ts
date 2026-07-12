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

export interface DataStandardForm {
  id?: number
  name: string
  code: string
  industry?: string | null
  type?: string | null
  source?: string
  description?: string
}

export interface VersionForm {
  id?: number
  description?: string
}

export interface FieldForm {
  id?: number
  groupName?: string
  name: string
  code: string
  dataType: string
  length?: number | null
  precision?: number | null
  unit?: string
  defaultValue?: string
  required?: boolean
  description?: string
  sortOrder?: number
}

export interface FormatForm {
  id?: number
  formatType: string
  fileType?: string
  recordSeparator?: string
  fieldSeparator?: string
  encoding?: string
  headerRows?: number | null
  quoteChar?: string
  escapeChar?: string
  description?: string
}

export interface MappingForm {
  id?: number
  fieldId?: number | null
  sourceName?: string
  sourceIndex?: number | null
  mappingType?: string
  sampleValue?: string
}

export const DEFAULT_FIELD_FORM: FieldForm = {
  groupName: '',
  name: '',
  code: '',
  dataType: 'STRING',
  length: null,
  precision: null,
  unit: '',
  defaultValue: '',
  required: false,
  description: '',
  sortOrder: 0
}

export const DEFAULT_FORMAT_FORM: FormatForm = {
  formatType: 'FILE',
  fileType: 'CSV',
  recordSeparator: '\\n',
  fieldSeparator: ',',
  encoding: 'UTF-8',
  headerRows: 1,
  quoteChar: '"',
  escapeChar: '\\',
  description: ''
}

export const DEFAULT_MAPPING_FORM: MappingForm = {
  fieldId: null,
  sourceName: '',
  sourceIndex: null,
  mappingType: 'NAME',
  sampleValue: ''
}

export const FORMAT_TYPE_OPTIONS = [
  { label: 'FILE', value: 'FILE' },
  { label: 'JSON', value: 'JSON' },
  { label: 'MQTT', value: 'MQTT' },
  { label: 'API', value: 'API' }
]

export const FILE_TYPE_OPTIONS = [
  { label: 'TXT', value: 'TXT' },
  { label: 'CSV', value: 'CSV' },
  { label: 'JSON', value: 'JSON' },
  { label: 'XML', value: 'XML' }
]

export const DATA_TYPE_OPTIONS = [
  { label: 'STRING', value: 'STRING' },
  { label: 'INT', value: 'INT' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'DOUBLE', value: 'DOUBLE' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'DATE', value: 'DATE' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'BINARY', value: 'BINARY' }
]

export const MAPPING_TYPE_OPTIONS = [
  { label: 'INDEX', value: 'INDEX' },
  { label: 'NAME', value: 'NAME' }
]

export const TYPE_OPTIONS = [
  { label: '国家标准', value: 'GB' },
  { label: '行业标准', value: 'HB' },
  { label: '地方标准', value: 'DB' },
  { label: '团体标准', value: 'T' },
  { label: '企业标准', value: 'Q' },
  { label: '法规标准', value: 'FG' },
  { label: '自定义', value: 'CUSTOM' }
]

export const INDUSTRY_OPTIONS = [
  { label: '金融', value: '金融' },
  { label: '医疗', value: '医疗' },
  { label: '教育', value: '教育' },
  { label: '制造', value: '制造' },
  { label: '零售', value: '零售' },
  { label: '其他', value: '其他' }
]
