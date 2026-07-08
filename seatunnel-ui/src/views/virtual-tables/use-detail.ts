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
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getVirtualTableDetail,
  createVirtualTable,
  updateVirtualTable,
  getFieldType,
  getDatasourceSchema,
  getKafkaMessage,
  deriveFromMessage,
  getHttpResponse
} from '@/service/virtual-table'
import { omit } from 'lodash'
import { useRouter } from 'vue-router'
import type { IDetailTableRecord, VirtualTableDetail } from './types'

export const useDetail = (id: string) => {
  const state = reactive({
    current: 1,
    loading: false,
    saving: false,
    stepOne: {
      pluginName: null,
      datasourceName: null,
      tableName: '',
      datasourceId: ''
    },
    stepTwo: {
      list: [] as IDetailTableRecord[],
      loading: false,
      config: []
    },
    fieldTypes: [] as string[],
    goNexting: false,
    previewModal: {
      show: false,
      loading: false,
      value: '',
      offset: 0,
      deriving: false,
      mode: 'kafka' as 'kafka' | 'paste'
    }
  })
  const { t } = useI18n()
  let tempDatabaseProperties: any
  const router = useRouter()
  const defaultRecord = {
    fieldName: '',
    fieldType: '',
    nullable: 0,
    primaryKey: 0,
    isEdit: true
  }
  const stepOneFormRef = ref()
  const stepTwoFormRef = ref()

  const queryById = async () => {
    if (state.loading) return {}
    state.loading = true
    const res = await getVirtualTableDetail(id)
    state.stepOne.pluginName = res.pluginName
    state.stepOne.datasourceName = res.datasourceName
    state.stepOne.datasourceId = res.datasourceId
    state.stepOne.tableName = res.tableName
    state.stepTwo.list = res.fields.map((item: { [key: string]: any }) => ({
      ...item,
      nullable: Number(item.nullable),
      primaryKey: Number(item.primaryKey)
    }))
    tempDatabaseProperties = res.datasourceProperties
    state.loading = false
  }

  const queryFieldsType = async () => {
    const res = await getFieldType()
    console.log(res, 'type')
    state.fieldTypes = res
    defaultRecord.fieldType = state.fieldTypes[0]
  }

  const formatParams = (): VirtualTableDetail => {
    const databaseProperties = {} as { [key: string]: string }
    state.stepTwo.config.forEach((item: { key: string; value: string }) => {
      databaseProperties[item.key] = item.value
    })
    return {
      datasourceId: state.stepOne.datasourceId,
      datasourceName: state.stepOne.datasourceName || '',
      pluginName: state.stepOne.pluginName || '',
      tableName: state.stepOne.tableName,
      tableFields: state.stepTwo.list.map((item) => ({
        ...omit(item, ['key', 'isEdit']),
        nullable: Boolean(item.nullable),
        primaryKey: Boolean(item.nullable)
      })),
      databaseProperties,
      databaseName: 'default'
    }
  }

  const createOrUpdate = async () => {
    const values = formatParams()
    if (state.saving) return false
    state.saving = true

    try {
      id
        ? await updateVirtualTable(values, id)
        : await createVirtualTable(values)

      state.saving = false
      router.push({
        name: 'virtual-tables-list',
        query: { tab: 'virtual-tables' }
      })
      return true
    } catch (err) {
      state.saving = false
      return false
    }
  }

  const onAddRecord = () => {
    state.stepTwo.list.unshift({
      ...defaultRecord,
      key: Date.now() + Math.random() * 1000
    })
    console.log(state, 'ta')
  }

  const onChangeStep = async (step: -1 | 1) => {
    if (state.current === 1 && step === 1) {
      state.goNexting = true
      try {
        await stepOneFormRef.value.validate()
        await stepTwoFormRef.value.getFormItems(
          state.stepOne.pluginName,
          state.stepOne.datasourceName
        )
        if (tempDatabaseProperties)
          stepTwoFormRef.value.setValues(tempDatabaseProperties)
      } finally {
        state.goNexting = false
      }
    }
    if (state.current === 2 && step === 1) {
      state.goNexting = true
      try {
        const values = await stepTwoFormRef.value.getValues()
        state.stepTwo.config = values
        const flag = state.stepTwo.list.some((item) => item.isEdit)
        if (flag) {
          window.$message.error(t('virtual_tables.save_data_tips'))
          return
        }
        if (state.stepTwo.list.length === 0) {
          window.$message.error(t('virtual_tables.table_data_required_tips'))
          return
        }
      } finally {
        state.goNexting = false
      }
    }
    state.current += step
  }

  onMounted(() => {
    console.log('vir')
    if (id) {
      queryById()
    }
    queryFieldsType()
  })

  const onDeriveSchema = async () => {
    const { datasourceId, tableName, pluginName } = state.stepOne
    if (!datasourceId || !tableName) {
      window.$message.warning(t('virtual_tables.derive_schema_required_tips'))
      return
    }

    if (pluginName === 'Http') {
      // 先尝试自动拉取 HTTP 响应数据推导，失败则回退到粘贴模式
      state.previewModal.loading = true
      try {
        const responseBody = await getHttpResponse(datasourceId)
        if (responseBody) {
          const res = await deriveFromMessage(responseBody)
          const fields: IDetailTableRecord[] = (res || []).map(
            (item: { name: string; type: string }) => ({
              fieldName: item.name,
              fieldType: item.type,
              nullable: 0,
              primaryKey: 0,
              isEdit: false,
              key: Date.now() + Math.random() * 1000
            })
          )
          if (fields.length > 0) {
            state.stepTwo.list = fields
            window.$message.success(
              t('virtual_tables.derive_schema_success')
            )
            return
          }
        }
      } catch {
        // 自动拉取失败，回退到粘贴模式
      } finally {
        state.previewModal.loading = false
      }
      state.previewModal.mode = 'paste'
      state.previewModal.show = true
      state.previewModal.value = ''
      return
    }

    // Kafka 等流式数据源：消息预览流程
    state.previewModal.mode = 'kafka'
    state.previewModal.loading = true
    state.previewModal.show = true
    state.previewModal.offset = 0
    try {
      const res = await getKafkaMessage(datasourceId, tableName, 0)
      state.previewModal.value = res?.value || ''
      state.previewModal.offset = res?.offset ?? 0
    } catch {
      state.previewModal.value = ''
      window.$message.error(t('virtual_tables.derive_schema_error'))
    } finally {
      state.previewModal.loading = false
    }
  }

  const onPasteDerive = async () => {
    const value = state.previewModal.value
    if (!value) {
      window.$message.warning(t('virtual_tables.derive_schema_paste_tips'))
      return
    }
    state.previewModal.deriving = true
    try {
      const res = await deriveFromMessage(value)
      const fields: IDetailTableRecord[] = (res || []).map(
        (item: { name: string; type: string }) => ({
          fieldName: item.name,
          fieldType: item.type,
          nullable: 0,
          primaryKey: 0,
          isEdit: false,
          key: Date.now() + Math.random() * 1000
        })
      )
      if (fields.length === 0) {
        window.$message.warning(t('virtual_tables.derive_schema_empty_tips'))
        return
      }
      state.stepTwo.list = fields
      state.previewModal.show = false
      window.$message.success(t('virtual_tables.derive_schema_success'))
    } catch {
      window.$message.error(t('virtual_tables.derive_schema_error'))
    } finally {
      state.previewModal.deriving = false
    }
  }

  const onPreviewUse = async () => {
    const value = state.previewModal.value
    if (!value) {
      window.$message.warning(t('virtual_tables.derive_schema_empty_tips'))
      return
    }
    state.previewModal.deriving = true
    try {
      const res = await deriveFromMessage(value)
      const fields: IDetailTableRecord[] = (res || []).map(
        (item: { name: string; type: string }) => ({
          fieldName: item.name,
          fieldType: item.type,
          nullable: 0,
          primaryKey: 0,
          isEdit: false,
          key: Date.now() + Math.random() * 1000
        })
      )
      if (fields.length === 0) {
        window.$message.warning(t('virtual_tables.derive_schema_empty_tips'))
        return
      }
      state.stepTwo.list = fields
      state.previewModal.show = false
      window.$message.success(t('virtual_tables.derive_schema_success'))
      const { pluginName, tableName } = state.stepOne
      if (pluginName && tableName) {
        localStorage.setItem(`seatunnel_preview_msg_${pluginName}_${tableName}`, value)
      }
    } catch {
      window.$message.error(t('virtual_tables.derive_schema_error'))
    } finally {
      state.previewModal.deriving = false
    }
  }

  const onPreviewFetchNext = async () => {
    const { datasourceId, tableName } = state.stepOne
    state.previewModal.loading = true
    try {
      const nextOffset = state.previewModal.offset + 1
      const res = await getKafkaMessage(datasourceId, tableName, nextOffset)
      if (!res || !res.value) {
        window.$message.info(t('virtual_tables.derive_schema_no_more'))
        state.previewModal.offset = nextOffset
        state.previewModal.value = ''
        return
      }
      state.previewModal.value = res.value
      state.previewModal.offset = res.offset ?? nextOffset
    } catch {
      window.$message.error(t('virtual_tables.derive_schema_error'))
    } finally {
      state.previewModal.loading = false
    }
  }

  const onCacheMessage = () => {
    const { pluginName, tableName } = state.stepOne
    const value = state.previewModal.value
    if (value && pluginName && tableName) {
      localStorage.setItem(`seatunnel_preview_msg_${pluginName}_${tableName}`, value)
    }
  }

  const onPreviewClose = () => {
    state.previewModal.show = false
    state.previewModal.value = ''
    state.previewModal.offset = 0
  }

  return {
    state,
    stepOneFormRef,
    stepTwoFormRef,
    createOrUpdate,
    onAddRecord,
    onChangeStep,
    onDeriveSchema,
    onPasteDerive,
    onPreviewUse,
    onPreviewFetchNext,
    onPreviewClose,
    onCacheMessage
  }
}
