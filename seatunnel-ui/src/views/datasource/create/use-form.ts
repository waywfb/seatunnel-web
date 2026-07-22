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

import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useFormStructuresStore, StructureItem } from '@/store/datasource'
import {
  dynamicFormItems,
  getDataStandardEnabledList,
  getDataStandardFormat
} from '@/service/data-source'
import { useFormField } from '@/components/dynamic-form/use-form-field'
import { useFormRequest } from '@/components/dynamic-form/use-form-request'
import { useFormValidate } from '@/components/dynamic-form/use-form-validate'
import { useFormStructure } from '@/components/dynamic-form/use-form-structure'
import type { FormRules } from 'naive-ui'
import type { ResponseBasic } from '@/service/types'

const localesCache = new Map<string, any>()

export function useForm(type: string) {
  const { t } = useI18n()
  const router = useRouter()
  const formStructuresStore = useFormStructuresStore()

  const initialValues = {
    pluginName: type,
    datasourceName: '',
    description: ''
  }

  const state = reactive({
    detailForm: { ...initialValues },
    formName: '',
    formStructure: [] as StructureItem[],
    locales: {},
    rules: {
      name: {
        trigger: ['input'],
        validator() {
          if (!state.detailForm.datasourceName) {
            return new Error(t('datasource.datasource_name_tips'))
          }
        }
      }
    } as FormRules
  })

  const getFormItems = async (value: string) => {
    if (formStructuresStore.getItem(value)) {
      state.formStructure = formStructuresStore.getItem(
        value
      ) as StructureItem[]
      if (localesCache.has(value)) {
        state.locales = localesCache.get(value)
      }
      return
    }

    const result: any = await dynamicFormItems(value)

    try {
      const res = JSON.parse(result)
      res.forms = res.forms.map((form: any) => ({ ...form, span: 12 }))
      Object.assign(state.detailForm, useFormField(res.forms))
      Object.assign(
        state.rules,
        useFormValidate(res.forms, state.detailForm, t)
      )
      state.locales = res.locales
      localesCache.set(value, res.locales)
      state.formStructure = useFormStructure(
        res.apis ? useFormRequest(res.apis, res.forms) : res.forms
      ) as any

      await transformDataStandardField()
    } finally {
    }
  }

  const transformDataStandardField = async () => {
    const hasDataStandardField = (state.formStructure as Array<any>).some(
      (f: any) => f.field === 'data_standard_id'
    )
    if (!hasDataStandardField) return

    try {
      const standardListRes = await getDataStandardEnabledList()
      const standardList = Array.isArray(standardListRes)
        ? standardListRes
        : standardListRes?.data || []
      const standardOptions = standardList.map((item: any) => ({
        label: item.name || item.dataStandardName || '',
        value: String(item.id || item.dataStandardId || '')
      }))

      state.formStructure = (state.formStructure as Array<any>).map(
        (f: any) => {
          if (f.field === 'data_standard_id') {
            return {
              ...f,
              type: 'select',
              options: standardOptions,
              required: true,
              description: f.description || '数据标准',
              placeholder: '请选择数据标准'
            }
          }
          return f
        }
      )
    } catch (err) {
      console.error('Failed to load data standard list:', err)
    }
  }

  const fillFormatFieldsFromStandard = async (standardId: string) => {
    if (!standardId) return

    try {
      const formatRes = await getDataStandardFormat(standardId)
      const formatList = Array.isArray(formatRes)
        ? formatRes
        : formatRes?.data || []
      if (formatList.length > 0) {
        const format = formatList[0]
        if (format.formatType !== undefined && format.formatType !== null) {
          state.detailForm.file_format_type = format.formatType
        }
        if (format.encoding !== undefined && format.encoding !== null) {
          state.detailForm.encoding = format.encoding
        }
        if (
          format.recordSeparator !== undefined &&
          format.recordSeparator !== null
        ) {
          state.detailForm.record_separator = format.recordSeparator
        }
        if (
          format.fieldSeparator !== undefined &&
          format.fieldSeparator !== null
        ) {
          state.detailForm.field_separator = format.fieldSeparator
        }
        if (format.quoteChar !== undefined && format.quoteChar !== null) {
          state.detailForm.quote = format.quoteChar
        }
        if (format.escapeChar !== undefined && format.escapeChar !== null) {
          state.detailForm.escape = format.escapeChar
        }
        if (format.headerRows !== undefined && format.headerRows !== null) {
          state.detailForm.header_rows = String(format.headerRows)
        }
        if (format.fileType !== undefined && format.fileType !== null) {
          state.detailForm.file_type = format.fileType
        }
        if (
          format.fileTerminator !== undefined &&
          format.fileTerminator !== null
        ) {
          state.detailForm.file_terminator = format.fileTerminator
        }
      }
    } catch (err) {
      console.error('Failed to load format from data standard:', err)
    }
  }

  const changeType = (value: string) => {
    router.replace({ name: 'datasource-create', query: { type: value } })
    getFormItems(value)
  }

  const resetFieldsValue = () => {
    state.detailForm = { ...initialValues }
  }

  const setFieldsValue = (values: any) => {
    Object.assign(state.detailForm, values)
  }

  const getFieldsValue = () => state.detailForm

  watch(
    () => state.detailForm.data_standard_id,
    (newVal) => {
      if (newVal) {
        fillFormatFieldsFromStandard(newVal)
      }
    }
  )

  onMounted(() => {
    if (type) {
      getFormItems(type)
    }
  })

  return {
    state,
    changeType,
    resetFieldsValue,
    getFieldsValue,
    setFieldsValue,
    getFormItems,
    fillFormatFieldsFromStandard
  }
}
