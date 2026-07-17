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

import * as XLSX from 'xlsx'
import Papa from 'papaparse'

/**
 * 中文字段名到英文字段名的映射
 */
const FIELD_NAME_MAP: Record<string, string> = {
  '字段名称': 'name',
  '字段编码': 'code',
  '数据类型': 'dataType',
  '字段类型': 'fieldType',
  '字段长度': 'length',
  '数值精度': 'precision',
  '单位': 'unit',
  '默认值': 'defaultValue',
  '是否必填': 'required',
  '字段描述': 'description',
  '字段分组': 'groupName'
}

/**
 * 英文字段名到中文字段名的映射
 */
const FIELD_NAME_MAP_CN: Record<string, string> = {
  'name': '字段名称',
  'code': '字段编码',
  'dataType': '数据类型',
  'fieldType': '字段类型',
  'length': '字段长度',
  'precision': '数值精度',
  'unit': '单位',
  'defaultValue': '默认值',
  'required': '是否必填',
  'description': '字段描述',
  'groupName': '字段分组'
}

/**
 * 字段说明映射
 */
const FIELD_DESCRIPTIONS: Record<string, string> = {
  '字段名称': '字段的显示名称，例如：设备编号',
  '字段编码': '字段的唯一标识编码，例如：device_code',
  '数据类型': '字段的数据类型，可选值：字符、数值、日期、布尔',
  '字段类型': '字段所属位置，可选值：HEADER（消息头）、BODY（消息体）',
  '字段长度': '字段的最大长度（可选）',
  '数值精度': '数值字段的精度（可选）',
  '单位': '字段的单位，例如：℃、MPa（可选）',
  '默认值': '字段的默认值（可选）',
  '是否必填': '是否为必填字段，可选值：是、否',
  '字段描述': '字段的详细说明（可选）',
  '字段分组': '字段所属的分组名称（可选）'
}

export interface FieldData {
  name: string
  code: string
  dataType: string
  fieldType: string
  length?: number | null
  precision?: number | null
  unit?: string
  defaultValue?: string
  required?: boolean
  description?: string
  groupName?: string
  sortOrder?: number
}

/**
 * 将中文值转换为英文值
 */
function convertValue(key: string, value: any): any {
  if (key === 'required') {
    if (value === '是' || value === 'true' || value === '1' || value === true) return true
    return false
  }
  if (key === 'dataType') {
    const map: Record<string, string> = {
      '字符': '字符',
      '数值': '数值',
      '日期': '日期',
      '布尔': 'BOOLEAN',
      'STRING': '字符',
      'INT': '数值',
      'BIGINT': '数值',
      'FLOAT': '数值',
      'DOUBLE': '数值',
      'DATE': '日期',
      'TIMESTAMP': '日期'
    }
    return map[value] || value
  }
  if (key === 'fieldType') {
    const map: Record<string, string> = {
      '消息头': 'HEADER',
      '消息体': 'BODY',
      'HEADER': 'HEADER',
      'BODY': 'BODY'
    }
    return map[value] || 'BODY'
  }
  return value
}

/**
 * 解析行数据，将中文字段名转换为英文字段名
 */
function parseRow(row: Record<string, any>): FieldData {
  const result: FieldData = {
    name: '',
    code: '',
    dataType: '字符',
    fieldType: 'BODY'
  }

  for (const [key, value] of Object.entries(row)) {
    const englishKey = FIELD_NAME_MAP[key] || key
    if (englishKey in result || ['length', 'precision', 'unit', 'defaultValue', 'required', 'description', 'groupName'].includes(englishKey)) {
      const convertedValue = convertValue(englishKey, value)
      if (englishKey === 'length' || englishKey === 'precision') {
        ;(result as any)[englishKey] = convertedValue ? Number(convertedValue) : null
      } else {
        ;(result as any)[englishKey] = convertedValue
      }
    }
  }

  return result
}

/**
 * 解析 CSV 文件
 */
export function parseCSV(file: File): Promise<FieldData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const fields = results.data
            .filter((row: any) => row['字段名称'] || row['name'])
            .map((row: any) => parseRow(row))
          resolve(fields)
        } catch (e) {
          reject(new Error('CSV 解析失败'))
        }
      },
      error: (error) => {
        reject(new Error('CSV 文件读取失败: ' + error.message))
      }
    })
  })
}

/**
 * 解析 Excel 文件（xls/xlsx）
 */
export async function parseExcel(file: File): Promise<FieldData[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet)

  return data
    .filter((row: any) => row['字段名称'] || row['name'])
    .map((row: any) => parseRow(row as Record<string, any>))
}

/**
 * 根据文件类型解析文件
 */
export async function parseFile(file: File): Promise<FieldData[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return parseCSV(file)
  } else if (ext === 'xls' || ext === 'xlsx') {
    return parseExcel(file)
  } else {
    throw new Error('不支持的文件格式，请上传 CSV、XLS 或 XLSX 文件')
  }
}

/**
 * 生成 CSV 模板
 */
export function generateCSVTemplate(): string {
  const headers = Object.keys(FIELD_NAME_MAP)
  const descriptions = headers.map(h => FIELD_DESCRIPTIONS[h])
  const exampleRow = ['设备编号', 'device_code', '字符', 'BODY', '64', '', '', '', '是', '设备唯一编码', '设备信息']
  const noteRow = headers.map(h => `说明：${FIELD_DESCRIPTIONS[h]}`)

  let csv = '\uFEFF' // BOM for UTF-8
  csv += headers.join(',') + '\n'
  csv += exampleRow.join(',') + '\n'
  csv += '\n'
  csv += '# 字段说明\n'
  csv += noteRow.join(',') + '\n'

  return csv
}

/**
 * 生成 CSV 导出内容
 */
export function generateCSVExport(fields: FieldData[]): string {
  const headers = ['字段名称', '字段编码', '数据类型', '字段类型', '字段长度', '数值精度', '单位', '默认值', '是否必填', '字段描述', '字段分组']

  let csv = '\uFEFF' // BOM for UTF-8
  csv += headers.join(',') + '\n'

  fields.forEach(field => {
    const row = [
      field.name,
      field.code,
      field.dataType,
      field.fieldType === 'HEADER' ? '消息头' : '消息体',
      field.length || '',
      field.precision || '',
      field.unit || '',
      field.defaultValue || '',
      field.required ? '是' : '否',
      field.description || '',
      field.groupName || ''
    ]
    csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n'
  })

  return csv
}

/**
 * 生成 Excel 模板
 */
export function generateExcelTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  // 字段定义表
  const wsData: any[][] = [
    Object.keys(FIELD_NAME_MAP),
    ['设备编号', 'device_code', '字符', 'BODY', '64', '', '', '', '是', '设备唯一编码', '设备信息'],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['# 字段说明'],
    ...Object.entries(FIELD_DESCRIPTIONS).map(([name, desc]) => [name, desc])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 30 }, { wch: 12 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, '字段定义')

  return wb
}

/**
 * 生成 Excel 导出
 */
export function generateExcelExport(fields: FieldData[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  const headers = ['字段名称', '字段编码', '数据类型', '字段类型', '字段长度', '数值精度', '单位', '默认值', '是否必填', '字段描述', '字段分组']

  const rows = fields.map(field => [
    field.name,
    field.code,
    field.dataType,
    field.fieldType === 'HEADER' ? '消息头' : '消息体',
    field.length || '',
    field.precision || '',
    field.unit || '',
    field.defaultValue || '',
    field.required ? '是' : '否',
    field.description || '',
    field.groupName || ''
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 30 }, { wch: 12 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, '字段定义')

  return wb
}

/**
 * 下载模板文件
 */
export function downloadTemplate(format: 'csv' | 'xls' | 'xlsx', filename?: string): void {
  const name = filename || '数据标准模板'

  if (format === 'csv') {
    const content = generateCSVTemplate()
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${name}.csv`)
  } else {
    const wb = generateExcelTemplate()
    const wbout = XLSX.write(wb, { bookType: format, type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    downloadBlob(blob, `${name}.${format}`)
  }
}

/**
 * 导出字段文件
 */
export function exportFields(fields: FieldData[], format: 'csv' | 'xls' | 'xlsx', filename?: string): void {
  const name = filename || '数据标准字段'

  if (format === 'csv') {
    const content = generateCSVExport(fields)
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${name}.csv`)
  } else {
    const wb = generateExcelExport(fields)
    const wbout = XLSX.write(wb, { bookType: format, type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    downloadBlob(blob, `${name}.${format}`)
  }
}

/**
 * 下载 Blob 文件
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
