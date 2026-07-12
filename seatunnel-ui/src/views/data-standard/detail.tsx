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

import { defineComponent, onMounted, computed, ref, h } from 'vue'
import {
  NButton,
  NInput,
  NSelect,
  NSpace,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NTabs,
  NTabPane,
  NDataTable,
  NSwitch,
  NPopconfirm,
  NInputNumber,
  NTag,
  NH3,
  useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useDetail } from './use-detail'
import {
  TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  DATA_TYPE_OPTIONS,
  FORMAT_TYPE_OPTIONS,
  FILE_TYPE_OPTIONS,
  MAPPING_TYPE_OPTIONS
} from './types'

export default defineComponent({
  name: 'DataStandardDetail',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const message = useMessage()

    const {
      id,
      isEdit,
      form,
      versions,
      currentVersionId,
      currentVersion,
      fields,
      formats,
      mappings,
      loading,
      saving,
      isCurrentVersionDraft,
      loadDetail,
      handleSelectVersion,
      saveStandard,
      handleCreateVersion,
      handlePublishVersion,
      handleArchiveVersion,
      handleDeleteVersion,
      saveFields,
      saveFormats,
      saveMappings,
      addField,
      removeField,
      addFormat,
      removeFormat,
      addMapping,
      removeMapping
    } = useDetail()

    const activeTab = ref('fields')
    const showVersionModal = ref(false)
    const newVersionDesc = ref('')

    const isCreatePage = computed(() => route.name === 'data-standard-create')

    // Field columns
    const fieldColumns = computed(() => [
      { title: t('data_standard.field_group'), key: 'groupName', width: 120 },
      { title: t('data_standard.field_name'), key: 'name', width: 150 },
      { title: t('data_standard.field_code'), key: 'code', width: 150 },
      {
        title: t('data_standard.field_data_type'),
        key: 'dataType',
        width: 120,
        render: (row: any) => h(NSelect, {
          value: row.dataType,
          options: DATA_TYPE_OPTIONS,
          size: 'small',
          'onUpdate:value': (val: string) => { row.dataType = val }
        })
      },
      { title: t('data_standard.field_length'), key: 'length', width: 100 },
      { title: t('data_standard.field_precision'), key: 'precision', width: 100 },
      { title: t('data_standard.field_unit'), key: 'unit', width: 80 },
      { title: t('data_standard.field_default'), key: 'defaultValue', width: 100 },
      {
        title: t('data_standard.field_required'),
        key: 'required',
        width: 80,
        render: (row: any) => h(NSwitch, {
          value: row.required,
          'onUpdate:value': (val: boolean) => { row.required = val }
        })
      },
      { title: t('data_standard.field_desc'), key: 'description', width: 150 },
      {
        title: t('data_standard.operation'),
        key: 'operation',
        width: 80,
        render: (_: any, index: number) => h(NButton, {
          type: 'error',
          size: 'small',
          onClick: () => removeField(index)
        }, { default: () => t('data_standard.delete') })
      }
    ])

    // Format columns
    const formatColumns = computed(() => [
      {
        title: t('data_standard.format_type'),
        key: 'formatType',
        width: 120,
        render: (row: any) => h(NSelect, {
          value: row.formatType,
          options: FORMAT_TYPE_OPTIONS,
          size: 'small',
          'onUpdate:value': (val: string) => { row.formatType = val }
        })
      },
      {
        title: t('data_standard.format_file_type'),
        key: 'fileType',
        width: 120,
        render: (row: any) => h(NSelect, {
          value: row.fileType,
          options: FILE_TYPE_OPTIONS,
          size: 'small',
          'onUpdate:value': (val: string) => { row.fileType = val }
        })
      },
      { title: t('data_standard.format_record_sep'), key: 'recordSeparator', width: 120 },
      { title: t('data_standard.format_field_sep'), key: 'fieldSeparator', width: 120 },
      { title: t('data_standard.format_encoding'), key: 'encoding', width: 100 },
      { title: t('data_standard.format_header_rows'), key: 'headerRows', width: 100 },
      { title: t('data_standard.format_quote'), key: 'quoteChar', width: 80 },
      { title: t('data_standard.format_escape'), key: 'escapeChar', width: 80 },
      { title: t('data_standard.field_desc'), key: 'description', width: 150 },
      {
        title: t('data_standard.operation'),
        key: 'operation',
        width: 80,
        render: (_: any, index: number) => h(NButton, {
          type: 'error',
          size: 'small',
          onClick: () => removeFormat(index)
        }, { default: () => t('data_standard.delete') })
      }
    ])

    // Mapping columns
    const mappingColumns = computed(() => [
      {
        title: t('data_standard.mapping_field'),
        key: 'fieldId',
        width: 150,
        render: (row: any) => h(NSelect, {
          value: row.fieldId,
          options: fields.value.map((f: any) => ({ label: f.name || f.code, value: f.id })),
          size: 'small',
          clearable: true,
          'onUpdate:value': (val: number | null) => { row.fieldId = val }
        })
      },
      { title: t('data_standard.mapping_source_name'), key: 'sourceName', width: 150 },
      { title: t('data_standard.mapping_source_index'), key: 'sourceIndex', width: 120 },
      {
        title: t('data_standard.mapping_type'),
        key: 'mappingType',
        width: 120,
        render: (row: any) => h(NSelect, {
          value: row.mappingType,
          options: MAPPING_TYPE_OPTIONS,
          size: 'small',
          'onUpdate:value': (val: string) => { row.mappingType = val }
        })
      },
      { title: t('data_standard.mapping_sample'), key: 'sampleValue', width: 150 },
      {
        title: t('data_standard.operation'),
        key: 'operation',
        width: 80,
        render: (_: any, index: number) => h(NButton, {
          type: 'error',
          size: 'small',
          onClick: () => removeMapping(index)
        }, { default: () => t('data_standard.delete') })
      }
    ])

    const handleSave = async () => {
      await saveStandard()
      if (!isEdit.value) return
      router.push({ name: 'data-standard-list' })
    }

    const doCreateVersion = async () => {
      await handleCreateVersion(newVersionDesc.value || undefined)
      showVersionModal.value = false
      newVersionDesc.value = ''
    }

    const versionStatusTag = (status: string) => {
      const map: Record<string, string> = {
        DRAFT: 'warning',
        RELEASED: 'success',
        ARCHIVED: 'info'
      }
      const labelMap: Record<string, string> = {
        DRAFT: '草稿',
        RELEASED: '已发布',
        ARCHIVED: '已归档'
      }
      return h(NTag, { type: map[status] as any, size: 'small' }, { default: () => labelMap[status] || status })
    }

    onMounted(() => {
      if (isEdit.value) {
        loadDetail()
      }
    })

    return () => (
      <NSpace vertical>
        {/* Standard Form */}
        <NCard title={isCreatePage.value ? t('data_standard.create') : t('data_standard.edit')}>
          <NForm label-placement='left' label-width={100}>
            <NGrid cols={2} xGap={24}>
              <NGridItem>
                <NFormItem label={t('data_standard.name')} required>
                  <NInput v-model:value={form.name} placeholder={t('data_standard.name_placeholder')} />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label={t('data_standard.code')} required>
                  <NInput
                    v-model:value={form.code}
                    placeholder={t('data_standard.code_placeholder')}
                    disabled={isEdit.value}
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem>
                <NFormItem label={t('data_standard.type')}>
                  <NSelect
                    v-model:value={form.type}
                    options={TYPE_OPTIONS}
                    clearable
                    placeholder={t('data_standard.type_placeholder')}
                  />
                </NFormItem>
              </NGridItem>
              <NGridItem span={2}>
                <NFormItem label={t('data_standard.source')}>
                  <NInput v-model:value={form.source} placeholder={t('data_standard.source_placeholder')} />
                </NFormItem>
              </NGridItem>
              <NGridItem span={2}>
                <NFormItem label={t('data_standard.description')}>
                  <NInput
                    v-model:value={form.description}
                    type='textarea'
                    rows={3}
                    placeholder={t('data_standard.description_placeholder')}
                  />
                </NFormItem>
              </NGridItem>
            </NGrid>
          </NForm>
          <NSpace justify='end'>
            <NButton onClick={() => router.push({ name: 'data-standard-list' })}>
              {t('data_standard.cancel')}
            </NButton>
            <NButton type='primary' loading={saving.value} onClick={handleSave}>
              {t('data_standard.save')}
            </NButton>
          </NSpace>
        </NCard>

        {/* Version & Detail Tabs (only when editing) */}
        {isEdit.value && (
          <NCard>
            {/* Version selector */}
            <NSpace justify='space-between' align='center' style={{ marginBottom: '16px' }}>
              <NSpace align='center'>
                <span style={{ fontWeight: 600 }}>{t('data_standard.versions')}</span>
                <NSelect
                  value={currentVersionId.value}
                  options={versions.value.map((v: any) => ({
                    label: v.version + (v.isCurrent ? ' (当前)' : ''),
                    value: v.id
                  }))}
                  style={{ width: '250px' }}
                  onUpdate:value={handleSelectVersion}
                />
                {currentVersion.value && versionStatusTag(currentVersion.value.status)}
              </NSpace>
              <NSpace>
                <NButton type='info' size='small' onClick={() => { showVersionModal.value = true }}>
                  {t('data_standard.create_version')}
                </NButton>
                {isCurrentVersionDraft.value && currentVersionId.value && (
                  <>
                    <NPopconfirm onPositiveClick={() => handlePublishVersion(currentVersionId.value!)}>
                      {{ trigger: () => <NButton type='success' size='small'>{t('data_standard.publish')}</NButton>,
                        default: () => t('data_standard.publish_confirm') }}
                    </NPopconfirm>
                    <NPopconfirm onPositiveClick={() => handleDeleteVersion(currentVersionId.value!)}>
                      {{ trigger: () => <NButton type='error' size='small'>{t('data_standard.delete_version')}</NButton>,
                        default: () => t('data_standard.delete_confirm') }}
                    </NPopconfirm>
                  </>
                )}
                {currentVersion.value?.status === 'RELEASED' && currentVersionId.value && (
                  <NPopconfirm onPositiveClick={() => handleArchiveVersion(currentVersionId.value!)}>
                    {{ trigger: () => <NButton size='small'>{t('data_standard.archive')}</NButton>,
                      default: () => t('data_standard.archive_confirm') }}
                  </NPopconfirm>
                )}
              </NSpace>
            </NSpace>

            {/* Tabs: Fields / Formats / Mappings */}
            <NTabs v-model:value={activeTab.value}>
              <NTabPane name='fields' tab={t('data_standard.tab_fields')}>
                <NSpace vertical>
                  {isCurrentVersionDraft.value && (
                    <NSpace justify='end'>
                      <NButton size='small' onClick={addField}>{t('data_standard.add_field')}</NButton>
                      <NButton type='primary' size='small' onClick={saveFields}>{t('data_standard.save_fields')}</NButton>
                    </NSpace>
                  )}
                  <NDataTable
                    columns={fieldColumns.value}
                    data={fields.value}
                    loading={loading.value}
                    bordered
                    size='small'
                  />
                </NSpace>
              </NTabPane>
              <NTabPane name='formats' tab={t('data_standard.tab_formats')}>
                <NSpace vertical>
                  {isCurrentVersionDraft.value && (
                    <NSpace justify='end'>
                      <NButton size='small' onClick={addFormat}>{t('data_standard.add_format')}</NButton>
                      <NButton type='primary' size='small' onClick={saveFormats}>{t('data_standard.save_formats')}</NButton>
                    </NSpace>
                  )}
                  <NDataTable
                    columns={formatColumns.value}
                    data={formats.value}
                    loading={loading.value}
                    bordered
                    size='small'
                  />
                </NSpace>
              </NTabPane>
              <NTabPane name='mappings' tab={t('data_standard.tab_mappings')}>
                <NSpace vertical>
                  {isCurrentVersionDraft.value && (
                    <NSpace justify='end'>
                      <NButton size='small' onClick={addMapping}>{t('data_standard.add_mapping')}</NButton>
                      <NButton type='primary' size='small' onClick={saveMappings}>{t('data_standard.save_mappings')}</NButton>
                    </NSpace>
                  )}
                  <NDataTable
                    columns={mappingColumns.value}
                    data={mappings.value}
                    loading={loading.value}
                    bordered
                    size='small'
                  />
                </NSpace>
              </NTabPane>
            </NTabs>
          </NCard>
        )}
      </NSpace>
    )
  }
})
