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

import { defineComponent, onMounted, computed, ref, watch, h } from 'vue'
import './detail.css'
import {
  NButton,
  NInput,
  NSelect,
  NForm,
  NFormItem,
  NDataTable,
  NSwitch,
  NPopconfirm,
  NTag,
  NEmpty,
  NModal,
  NText,
  NScrollbar,
  NDropdown,
  NDivider,
  NGrid,
  NGridItem,
  useMessage
} from 'naive-ui'
import STabs from '@/components/tabs'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useDetail } from './use-detail'
import {
  TYPE_OPTIONS,
  DATA_TYPE_OPTIONS,
  FORMAT_TYPE_OPTIONS,
  FILE_TYPE_OPTIONS,
  MAPPING_TYPE_OPTIONS
} from './types'
import type { FieldForm } from './types'
import { parseFile, downloadTemplate, exportFields } from '@/utils/file-parser'
import type { FieldData } from '@/utils/file-parser'

/** Color map for standard types */
const TYPE_COLOR_MAP: Record<string, string> = {
  GB: '#64748b',
  HB: '#64748b',
  DB: '#64748b',
  T: '#64748b',
  Q: '#64748b',
  FG: '#64748b',
  CUSTOM: '#64748b'
}

/** Color map for field types */
const FIELD_TYPE_COLOR: Record<string, string> = {
  HEADER: '#64748b',
  BODY: '#64748b'
}

const DATA_TYPE_BADGE: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  字符: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  STRING: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  BINARY: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  数值: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  INT: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  BIGINT: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  FLOAT: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  DOUBLE: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  DECIMAL: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  日期: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  DATE: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  TIMESTAMP: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  BOOLEAN: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' }
}
const DEFAULT_DATA_TYPE_BADGE = {
  bg: '#f8fafc',
  color: '#475569',
  border: '#e2e8f0'
}

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

    // --- Local state ---
    const activeView = ref('designer')
    const selectedGroup = ref<string | null>(null)
    const searchQuery = ref('')
    const selectedIndex = ref<number | null>(null)
    const inspectorCollapsed = ref(false)
    const basicInfoCollapsed = ref(true)
    const showImportModal = ref(false)
    const importJsonText = ref('')
    const importDragging = ref(false)
    const importFile = ref<File | null>(null)
    const importFileName = ref('')
    const showExportModal = ref(false)
    const exportFormat = ref<'csv' | 'xls' | 'xlsx'>('xlsx')
    const showVersionModal = ref(false)
    const newVersionDesc = ref('')
    const showAddGroupModal = ref(false)
    const newGroupName = ref('')

    // --- Computed ---
    const isCreatePage = computed(() => route.name === 'data-standard-create')

    const groupList = computed(() => {
      const allGroups = new Set<string>(form.groups)
      fields.value.forEach((f: any) => {
        if (f.groupName) allGroups.add(f.groupName)
      })
      return Array.from(allGroups).map((g) => ({
        key: g,
        count: fields.value.filter((f: any) => f.groupName === g).length
      }))
    })

    const filteredFields = computed(() => {
      let result = fields.value
      if (selectedGroup.value) {
        result = result.filter((f: any) => f.groupName === selectedGroup.value)
      }
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(
          (f: any) =>
            (f.name || '').toLowerCase().includes(q) ||
            (f.code || '').toLowerCase().includes(q) ||
            (f.description || '').toLowerCase().includes(q)
        )
      }
      return result
    })

    const selectedField = computed(() => {
      if (selectedIndex.value === null) return null
      return filteredFields.value[selectedIndex.value] || null
    })

    const totalFields = computed(() => fields.value.length)
    const requiredFields = computed(
      () => fields.value.filter((f: any) => f.required).length
    )
    const bodyFields = computed(
      () => fields.value.filter((f: any) => f.fieldType === 'BODY').length
    )
    const sidebarEditing = ref(false)

    const versionStatusMap: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '草稿', color: '#f59e0b' },
      PUBLISHED: { label: '已发布', color: '#10b981' },
      ARCHIVED: { label: '已归档', color: '#6b7280' }
    }

    const typeName = computed(() => {
      const opt = TYPE_OPTIONS.find((o) => o.value === form.type)
      return opt ? opt.label : form.type || '-'
    })

    // --- Handlers ---
    const handleAddGroup = () => {
      if (!newGroupName.value.trim()) return
      const name = newGroupName.value.trim()
      if (!form.groups.includes(name)) {
        form.groups.push(name)
      }
      newGroupName.value = ''
      showAddGroupModal.value = false
    }

    const handleDeleteGroup = (groupKey: string) => {
      fields.value.forEach((f: any) => {
        if (f.groupName === groupKey) f.groupName = ''
      })
      form.groups = form.groups.filter((g) => g !== groupKey)
      if (selectedGroup.value === groupKey) selectedGroup.value = null
    }

    const handleAddFieldToGroup = () => {
      addField()
      const lastField = fields.value[fields.value.length - 1]
      if (lastField) {
        lastField.groupName =
          selectedGroup.value || (groupList.value[0]?.key ?? '')
        selectedIndex.value = filteredFields.value.length - 1
      }
    }

    const handleSelectField = (index: number) => {
      selectedIndex.value = index
    }

    const handleUpdateField = (key: string, value: any) => {
      if (selectedField.value) {
        ;(selectedField.value as any)[key] = value
      }
    }

    const handleFileSelect = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input.files && input.files[0]) {
        importFile.value = input.files[0]
        importFileName.value = input.files[0].name
      }
    }

    const handleFileDrop = (e: DragEvent) => {
      e.preventDefault()
      importDragging.value = false
      const file = e.dataTransfer?.files?.[0]
      if (file) {
        importFile.value = file
        importFileName.value = file.name
      }
    }

    const clearImportFile = () => {
      importFile.value = null
      importFileName.value = ''
      importJsonText.value = ''
    }

    const handleImportFile = async () => {
      try {
        if (!importFile.value) {
          message.error('请选择文件')
          return
        }
        const targetGroup = selectedGroup.value || groupList.value[0]?.key || ''
        const parsedFields = await parseFile(importFile.value)
        parsedFields.forEach((field) => {
          fields.value.push({
            ...field,
            groupName: field.groupName || targetGroup,
            sortOrder: fields.value.length
          })
        })
        showImportModal.value = false
        clearImportFile()
        message.success(`成功导入 ${parsedFields.length} 个字段`)
      } catch (e: any) {
        message.error(e.message || '文件解析失败')
      }
    }

    const handleImportJson = async () => {
      try {
        if (!importJsonText.value.trim()) {
          message.error('请输入 JSON 内容')
          return
        }
        const targetGroup = selectedGroup.value || groupList.value[0]?.key || ''
        const data = JSON.parse(importJsonText.value)
        const arr = Array.isArray(data) ? data : [data]
        let count = 0
        arr.forEach((item: any) => {
          if (item.name || item.code) {
            fields.value.push({
              name: item.name || '',
              code: item.code || '',
              dataType: item.dataType || item.data_type || '字符',
              fieldType: item.fieldType || item.field_type || 'BODY',
              length: item.length || null,
              precision: item.precision || null,
              unit: item.unit || '',
              defaultValue: item.defaultValue || item.default_value || '',
              required: item.required || false,
              description: item.description || '',
              groupName: item.groupName || item.group_name || targetGroup,
              sortOrder: fields.value.length
            })
            count++
          }
        })
        showImportModal.value = false
        clearImportFile()
        message.success(`成功导入 ${count} 个字段`)
      } catch (e) {
        message.error('JSON 解析失败，请检查格式')
      }
    }

    const handleExport = () => {
      try {
        const name = form.name || '数据标准字段'
        exportFields(
          fields.value.map((f) => ({
            ...f,
            fieldType: f.fieldType || 'BODY'
          })),
          exportFormat.value,
          name
        )
        showExportModal.value = false
        message.success('导出成功')
      } catch (e: any) {
        message.error(e.message || '导出失败')
      }
    }

    const handleDownloadTemplate = (format: 'csv' | 'xls' | 'xlsx') => {
      try {
        downloadTemplate(format, '数据标准模板')
        message.success('模板下载成功')
      } catch (e: any) {
        message.error(e.message || '模板下载失败')
      }
    }

    const handleSave = async () => {
      await saveStandard()
      if (isEdit.value && currentVersionId.value) {
        const promises = []
        if (fields.value.length > 0) promises.push(saveFields())
        if (formats.value.length > 0) promises.push(saveFormats())
        if (mappings.value.length > 0) promises.push(saveMappings())
        await Promise.allSettled(promises)
      }
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
      return h(
        NTag,
        {
          type: map[status] as any,
          size: 'small',
          round: true,
          bordered: false
        },
        { default: () => labelMap[status] || status }
      )
    }

    // --- Format columns ---
    const formatColumns = computed(() => [
      {
        title: t('data_standard.format_type'),
        key: 'formatType',
        width: 120,
        render: (row: any) =>
          h(NSelect, {
            value: row.formatType,
            options: FORMAT_TYPE_OPTIONS,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.formatType = val
            }
          })
      },
      {
        title: t('data_standard.format_file_type'),
        key: 'fileType',
        width: 120,
        render: (row: any) =>
          h(NSelect, {
            value: row.fileType,
            options: FILE_TYPE_OPTIONS,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.fileType = val
            }
          })
      },
      {
        title: t('data_standard.format_record_sep'),
        key: 'recordSeparator',
        width: 120,
        render: (row: any) =>
          h(NInput, {
            value: row.recordSeparator,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.recordSeparator = val
            }
          })
      },
      {
        title: t('data_standard.format_field_sep'),
        key: 'fieldSeparator',
        width: 120,
        render: (row: any) =>
          h(NInput, {
            value: row.fieldSeparator,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.fieldSeparator = val
            }
          })
      },
      {
        title: t('data_standard.format_encoding'),
        key: 'encoding',
        width: 100,
        render: (row: any) =>
          h(NInput, {
            value: row.encoding,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.encoding = val
            }
          })
      },
      {
        title: t('data_standard.format_header_rows'),
        key: 'headerRows',
        width: 100,
        render: (row: any) =>
          h(NInput, {
            value: row.headerRows,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.headerRows = val
            }
          })
      },
      {
        title: t('data_standard.format_quote'),
        key: 'quoteChar',
        width: 80,
        render: (row: any) =>
          h(NInput, {
            value: row.quoteChar,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.quoteChar = val
            }
          })
      },
      {
        title: t('data_standard.format_escape'),
        key: 'escapeChar',
        width: 80,
        render: (row: any) =>
          h(NInput, {
            value: row.escapeChar,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.escapeChar = val
            }
          })
      },
      {
        title: t('data_standard.format_file_terminator'),
        key: 'fileTerminator',
        width: 100,
        render: (row: any) =>
          h(NInput, {
            value: row.fileTerminator,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.fileTerminator = val
            }
          })
      },
      {
        title: t('data_standard.field_desc'),
        key: 'description',
        width: 150,
        render: (row: any) =>
          h(NInput, {
            value: row.description,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.description = val
            }
          })
      },
      {
        title: t('data_standard.operation'),
        key: 'operation',
        width: 80,
        render: (_: any, index: number) =>
          h(
            NButton,
            {
              type: 'error',
              size: 'small',
              onClick: () => removeFormat(index)
            },
            { default: () => t('data_standard.delete') }
          )
      }
    ])

    // --- Mapping columns ---
    const mappingColumns = computed(() => [
      {
        title: t('data_standard.mapping_field'),
        key: 'fieldId',
        width: 150,
        render: (row: any) =>
          h(NSelect, {
            value: row.fieldId,
            options: fields.value.map((f: any) => ({
              label: f.name || f.code,
              value: f.id
            })),
            size: 'small',
            clearable: true,
            'onUpdate:value': (val: number | null) => {
              row.fieldId = val
            }
          })
      },
      {
        title: t('data_standard.mapping_source_name'),
        key: 'sourceName',
        width: 150,
        render: (row: any) =>
          h(NInput, {
            value: row.sourceName,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.sourceName = val
            }
          })
      },
      {
        title: t('data_standard.mapping_source_index'),
        key: 'sourceIndex',
        width: 120,
        render: (row: any) =>
          h(NInput, {
            value: row.sourceIndex,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.sourceIndex = val
            }
          })
      },
      {
        title: t('data_standard.mapping_type'),
        key: 'mappingType',
        width: 120,
        render: (row: any) =>
          h(NSelect, {
            value: row.mappingType,
            options: MAPPING_TYPE_OPTIONS,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.mappingType = val
            }
          })
      },
      {
        title: t('data_standard.mapping_sample'),
        key: 'sampleValue',
        width: 150,
        render: (row: any) =>
          h(NInput, {
            value: row.sampleValue,
            size: 'small',
            'onUpdate:value': (val: string) => {
              row.sampleValue = val
            }
          })
      },
      {
        title: t('data_standard.operation'),
        key: 'operation',
        width: 80,
        render: (_: any, index: number) =>
          h(
            NButton,
            {
              type: 'error',
              size: 'small',
              onClick: () => removeMapping(index)
            },
            { default: () => t('data_standard.delete') }
          )
      }
    ])

    // --- Lifecycle ---
    onMounted(() => {
      if (isEdit.value) {
        loadDetail()
      }
    })

    watch(
      () => fields.value,
      (newFields) => {
        if (
          newFields.length > 0 &&
          !selectedGroup.value &&
          groupList.value.length > 0
        ) {
          selectedGroup.value = groupList.value[0].key
        }
      },
      { immediate: true }
    )

    return () => (
      <div class='ds-studio'>
        {/* Header Bar - spans full width */}
        <header class='ds-header'>
          <div class='ds-header-left'>
            {form.name && (
              <span
                style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
              >
                {form.name}
              </span>
            )}
            {form.type && (
              <NTag
                size='tiny'
                round
                bordered={false}
                style={{
                  backgroundColor: TYPE_COLOR_MAP[form.type] + '22',
                  color: TYPE_COLOR_MAP[form.type]
                }}
              >
                {typeName.value}
              </NTag>
            )}
          </div>
          <div className='ds-header-actions'>
            {isCurrentVersionDraft.value && (
              <NButton size='tiny' loading={saving.value} onClick={handleSave}>
                {t('data_standard.save')}
              </NButton>
            )}
            <NButton
              text
              size='tiny'
              onClick={() => router.push({ name: 'data-standard-list' })}
            >
              {t('data_standard.cancel')}
            </NButton>
          </div>
        </header>

        <div class='ds-body'>
          {/* ===== Left Sidebar ===== */}
          <aside class='ds-sidebar'>
            {/* 可滚动内容区域 */}
            <div class='ds-sidebar-content'>
              {/* 标准基础属性 */}
              <div
                class='ds-sidebar-section-title'
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => {
                  basicInfoCollapsed.value = !basicInfoCollapsed.value
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span
                    style={{
                      fontSize: '8px',
                      transition: 'transform 0.2s',
                      transform: basicInfoCollapsed.value
                        ? 'rotate(-90deg)'
                        : 'rotate(0deg)',
                      display: 'inline-block'
                    }}
                  >
                    ▼
                  </span>
                  <span>标准基础属性</span>
                </span>
                {isCurrentVersionDraft.value && (
                  <NButton
                    text
                    size='tiny'
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      sidebarEditing.value = !sidebarEditing.value
                    }}
                    style={{
                      color: sidebarEditing.value ? '#f59e0b' : '#10b981'
                    }}
                  >
                    {sidebarEditing.value ? '完成' : '编辑'}
                  </NButton>
                )}
              </div>
              {!basicInfoCollapsed.value && (
                <div class='ds-sidebar-basic'>
                  {sidebarEditing.value ? (
                    <>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准名称</span>
                        <NInput
                          v-model:value={form.name}
                          size='tiny'
                          placeholder='请输入标准名称'
                        />
                      </div>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准类型</span>
                        <NSelect
                          v-model:value={form.type}
                          size='tiny'
                          options={TYPE_OPTIONS}
                        />
                      </div>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准代码</span>
                        <NInput
                          v-model:value={form.code}
                          size='tiny'
                          placeholder='请输入标准代码'
                        />
                      </div>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准描述</span>
                        <NInput
                          v-model:value={form.description}
                          type='textarea'
                          size='tiny'
                          rows={2}
                          placeholder='请输入标准描述'
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准名称</span>
                        <span class='ds-basic-value'>{form.name || '-'}</span>
                      </div>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准类型</span>
                        <NTag
                          size='tiny'
                          round
                          bordered={false}
                          style={{
                            backgroundColor:
                              TYPE_COLOR_MAP[form.type || 'CUSTOM'] + '22',
                            color: TYPE_COLOR_MAP[form.type || 'CUSTOM']
                          }}
                        >
                          {typeName.value}
                        </NTag>
                      </div>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准代码</span>
                        <span class='ds-basic-value'>{form.code || '-'}</span>
                      </div>
                      <div class='ds-basic-item'>
                        <span class='ds-basic-label'>标准描述</span>
                        <span class='ds-basic-value'>
                          {form.description || '-'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <NDivider style={{ margin: '8px 0', borderColor: '#e2e8f0' }} />

              {/* 可滚动内容区域 */}
              <NScrollbar style={{ flex: 1 }}>
                {/* 标准版本 */}
                <div class='ds-sidebar-section-title'>
                  <span>标准版本</span>
                </div>
                <div class='ds-sidebar-version'>
                  {versions.value.map((v: any) => {
                    const status = versionStatusMap[v.status] || {
                      label: v.status,
                      color: '#6b7280'
                    }
                    const isActive = currentVersionId.value === v.id
                    return (
                      <div
                        key={v.id}
                        class={`ds-version-item ${
                          isActive ? 'ds-version-item--active' : ''
                        }`}
                        onClick={() => handleSelectVersion(v.id)}
                      >
                        <div class='ds-version-main'>
                          <span class='ds-version-name'>{v.version}</span>
                          {isActive && (
                            <span class='ds-version-current'>当前</span>
                          )}
                        </div>
                        <NTag
                          size='tiny'
                          bordered={false}
                          style={{
                            backgroundColor: status.color + '22',
                            color: status.color
                          }}
                        >
                          {status.label}
                        </NTag>
                      </div>
                    )
                  })}
                  {versions.value.length === 0 && (
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }}
                    >
                      暂无版本
                    </div>
                  )}
                </div>

                <NDivider style={{ margin: '8px 0', borderColor: '#e2e8f0' }} />

                {/* 元数据结构分组 */}
                <div class='ds-sidebar-section-title'>
                  <span>元数据结构分组</span>
                  {isCurrentVersionDraft.value && (
                    <NButton
                      text
                      size='tiny'
                      onClick={() => {
                        showAddGroupModal.value = true
                      }}
                      style={{ color: '#10b981' }}
                    >
                      + 新建
                    </NButton>
                  )}
                </div>
                <div class='ds-group-list'>
                  {groupList.value.map((g) => (
                    <div
                      key={g.key}
                      class={`ds-group-item ${
                        selectedGroup.value === g.key
                          ? 'ds-group-item--active'
                          : ''
                      }`}
                      onClick={() => {
                        selectedGroup.value = g.key
                        selectedIndex.value = null
                      }}
                    >
                      <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        stroke-width='2'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                        class='ds-group-icon'
                      >
                        <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'></path>
                      </svg>
                      <span class='ds-group-name'>{g.key}</span>
                      <span class='ds-group-count'>{g.count}</span>
                      {isCurrentVersionDraft.value && (
                        <span
                          class='ds-group-del'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGroup(g.key)
                          }}
                        >
                          ×
                        </span>
                      )}
                    </div>
                  ))}
                  {groupList.value.length === 0 && (
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }}
                    >
                      暂无分组
                    </div>
                  )}
                </div>
              </NScrollbar>
            </div>

            {/* Global Stats */}
            <div class='ds-sidebar-stats'>
              <div class='ds-stat-row'>
                <span>总字段数</span>
                <span class='ds-stat-val'>{totalFields.value}</span>
              </div>
              <div class='ds-stat-row'>
                <span>必填字段</span>
                <span class='ds-stat-val'>{requiredFields.value}</span>
              </div>
              <div class='ds-stat-row'>
                <span>消息体字段</span>
                <span class='ds-stat-val'>{bodyFields.value}</span>
              </div>
            </div>
          </aside>

          {/* ===== Main Area ===== */}
          <div class='ds-main'>
            {/* View Tabs */}
            <div class='ds-view-tabs'>
              <STabs
                value={activeView.value}
                onUpdate:value={(val: string) => (activeView.value = val)}
                tabs={[
                  { name: 'designer', label: '设计器视图' },
                  { name: 'formats', label: '格式对照' },
                  { name: 'mappings', label: '字段映射' }
                ]}
              />

              {/* Version selector (right side of tabs) */}
              {isEdit.value && (
                <div class='ds-version-bar'>
                  {isCurrentVersionDraft.value && currentVersionId.value && (
                    <NPopconfirm
                      onPositiveClick={() =>
                        handlePublishVersion(currentVersionId.value!)
                      }
                    >
                      {{
                        trigger: () => (
                          <NButton
                            size='tiny'
                            style={{
                              backgroundColor: '#10b981',
                              borderColor: '#10b981',
                              color: '#fff'
                            }}
                          >
                            {t('data_standard.publish')}
                          </NButton>
                        ),
                        default: () => t('data_standard.publish_confirm')
                      }}
                    </NPopconfirm>
                  )}
                  <NDropdown
                    options={(() => {
                      const items = [{ key: 'create', label: '新建版本' }]
                      if (isCurrentVersionDraft.value) {
                        items.push({ key: 'delete', label: '删除版本' })
                      }
                      if (currentVersion.value?.status === 'RELEASED') {
                        items.push({ key: 'archive', label: '归档' })
                      }
                      return items
                    })()}
                    onSelect={(key: string) => {
                      if (key === 'create') {
                        showVersionModal.value = true
                      }
                      if (
                        key === 'delete' &&
                        currentVersionId.value &&
                        window.confirm('确认删除此版本？')
                      ) {
                        handleDeleteVersion(currentVersionId.value)
                      }
                      if (
                        key === 'archive' &&
                        currentVersionId.value &&
                        window.confirm('确认归档此版本？')
                      ) {
                        handleArchiveVersion(currentVersionId.value)
                      }
                    }}
                  >
                    <NButton size='tiny' style={{ borderColor: '#e2e8f0' }}>
                      版本管理 ˅
                    </NButton>
                  </NDropdown>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div class='ds-content'>
              {/* Designer View */}
              {activeView.value === 'designer' && (
                <>
                  {/* Center: Field Cards */}
                  <div class='ds-center'>
                    {/* Toolbar */}
                    <div class='ds-toolbar'>
                      <div class='ds-toolbar-left'>
                        <NInput
                          v-model:value={searchQuery.value}
                          placeholder='搜索字段名称、编码...'
                          size='tiny'
                          clearable
                          style={{ width: '200px' }}
                        />
                      </div>
                      <div class='ds-toolbar-right'>
                        <NDropdown
                          options={[
                            { key: 'import', label: '导入' },
                            { key: 'export', label: '导出' }
                          ]}
                          onSelect={(key: string) => {
                            if (key === 'import') {
                              showImportModal.value = true
                              clearImportFile()
                            }
                            if (key === 'export') showExportModal.value = true
                          }}
                        >
                          <NButton size='tiny'>数据工具 ˅</NButton>
                        </NDropdown>
                        {isCurrentVersionDraft.value && (
                          <NButton size='tiny' onClick={handleAddFieldToGroup}>
                            新增配置项
                          </NButton>
                        )}
                      </div>
                    </div>

                    {/* Field Cards */}
                    <NScrollbar style={{ flex: 1 }}>
                      <div class='ds-field-list'>
                        {filteredFields.value.map(
                          (field: any, index: number) => (
                            <div
                              key={field.id || index}
                              class={`ds-field-card ${
                                selectedIndex.value === index
                                  ? 'ds-field-card--active'
                                  : ''
                              }`}
                              onClick={() => handleSelectField(index)}
                            >
                              {/* Drag handle */}
                              <div class='ds-field-drag'>
                                <svg
                                  width='12'
                                  height='12'
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='currentColor'
                                  stroke-width='2'
                                >
                                  <circle
                                    cx='9'
                                    cy='6'
                                    r='1.5'
                                    fill='currentColor'
                                  />
                                  <circle
                                    cx='15'
                                    cy='6'
                                    r='1.5'
                                    fill='currentColor'
                                  />
                                  <circle
                                    cx='9'
                                    cy='12'
                                    r='1.5'
                                    fill='currentColor'
                                  />
                                  <circle
                                    cx='15'
                                    cy='12'
                                    r='1.5'
                                    fill='currentColor'
                                  />
                                  <circle
                                    cx='9'
                                    cy='18'
                                    r='1.5'
                                    fill='currentColor'
                                  />
                                  <circle
                                    cx='15'
                                    cy='18'
                                    r='1.5'
                                    fill='currentColor'
                                  />
                                </svg>
                              </div>

                              {/* Field info */}
                              <div class='ds-field-info'>
                                <div class='ds-field-top'>
                                  <NText strong style={{ fontSize: '13px' }}>
                                    {field.name}
                                  </NText>
                                  <div class='ds-field-badges'>
                                    <NTag
                                      size='tiny'
                                      round
                                      bordered={false}
                                      style={{
                                        backgroundColor:
                                          (FIELD_TYPE_COLOR[field.fieldType] ||
                                            '#64748b') + '1a',
                                        color:
                                          FIELD_TYPE_COLOR[field.fieldType] ||
                                          '#64748b'
                                      }}
                                    >
                                      {field.fieldType === 'HEADER'
                                        ? t('data_standard.field_type_header')
                                        : t('data_standard.field_type_body')}
                                    </NTag>
                                    {field.required && (
                                      <NTag
                                        size='tiny'
                                        round
                                        bordered
                                        style={{
                                          backgroundColor: '#f8fafc',
                                          color: '#64748b',
                                          borderColor: '#e2e8f0'
                                        }}
                                      >
                                        {t('data_standard.field_required')}
                                      </NTag>
                                    )}
                                  </div>
                                </div>
                                <div class='ds-field-bottom'>
                                  <code class='ds-field-code'>
                                    {field.code}
                                  </code>
                                  {field.description && (
                                    <NText
                                      depth={3}
                                      style={{
                                        fontSize: '11px',
                                        marginLeft: '6px',
                                        color: '#94a3b8'
                                      }}
                                    >
                                      {field.description}
                                    </NText>
                                  )}
                                </div>
                              </div>

                              {/* Right cluster: data type badge + delete */}
                              <div class='ds-field-right'>
                                <NTag
                                  size='tiny'
                                  bordered
                                  style={{
                                    backgroundColor: (
                                      DATA_TYPE_BADGE[field.dataType] ||
                                      DEFAULT_DATA_TYPE_BADGE
                                    ).bg,
                                    color: (
                                      DATA_TYPE_BADGE[field.dataType] ||
                                      DEFAULT_DATA_TYPE_BADGE
                                    ).color,
                                    borderColor: (
                                      DATA_TYPE_BADGE[field.dataType] ||
                                      DEFAULT_DATA_TYPE_BADGE
                                    ).border
                                  }}
                                >
                                  {field.dataType || 'UNKNOWN'}
                                </NTag>
                                {isCurrentVersionDraft.value && (
                                  <div
                                    class='ds-field-actions'
                                    onClick={(e: Event) => e.stopPropagation()}
                                  >
                                    <NPopconfirm
                                      onPositiveClick={() => {
                                        removeField(index)
                                        if (selectedIndex.value === index)
                                          selectedIndex.value = null
                                        else if (
                                          selectedIndex.value !== null &&
                                          selectedIndex.value > index
                                        )
                                          selectedIndex.value--
                                      }}
                                    >
                                      {{
                                        trigger: () => (
                                          <NButton
                                            text
                                            type='error'
                                            size='tiny'
                                            style={{ padding: '2px' }}
                                          >
                                            <svg
                                              width='12'
                                              height='12'
                                              viewBox='0 0 24 24'
                                              fill='none'
                                              stroke='currentColor'
                                              stroke-width='2'
                                              stroke-linecap='round'
                                              stroke-linejoin='round'
                                            >
                                              <polyline points='3 6 5 6 21 6'></polyline>
                                              <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>
                                            </svg>
                                          </NButton>
                                        ),
                                        default: () => '确认删除此字段？'
                                      }}
                                    </NPopconfirm>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                        {filteredFields.value.length === 0 && (
                          <NEmpty
                            description='暂无字段'
                            style={{ padding: '60px 0' }}
                          />
                        )}
                      </div>
                    </NScrollbar>
                  </div>

                  {/* Right: Inspector */}
                  <div
                    class={`ds-inspector ${
                      !selectedField.value ? 'ds-inspector--collapsed' : ''
                    }`}
                  >
                    {selectedField.value ? (
                      <>
                        {/* Inspector Header */}
                        <div class='ds-inspector-header'>
                          <NTag
                            size='tiny'
                            round
                            bordered={false}
                            style={{
                              backgroundColor:
                                (FIELD_TYPE_COLOR[
                                  (selectedField.value as any).fieldType
                                ] || '#64748b') + '22',
                              color:
                                FIELD_TYPE_COLOR[
                                  (selectedField.value as any).fieldType
                                ] || '#64748b'
                            }}
                          >
                            {(selectedField.value as any).fieldType === 'HEADER'
                              ? '消息头'
                              : '消息体'}
                          </NTag>
                          <span class='ds-inspector-title'>
                            {(selectedField.value as any).name}
                          </span>
                        </div>

                        <NScrollbar style={{ flex: 1 }}>
                          <div class='ds-inspector-body'>
                            {/* Basic section */}
                            <div class='ds-inspector-section'>
                              <div class='ds-inspector-section-title'>
                                {t('data_standard.inspector_basic')}
                              </div>
                              <NForm labelPlacement='top' size='small'>
                                <NFormItem
                                  label={t('data_standard.field_name')}
                                >
                                  <NInput
                                    value={(selectedField.value as any).name}
                                    onUpdate:value={(val: string) =>
                                      handleUpdateField('name', val)
                                    }
                                    disabled={!isCurrentVersionDraft.value}
                                  />
                                </NFormItem>
                                <NFormItem
                                  label={t('data_standard.field_code')}
                                >
                                  <NInput
                                    value={(selectedField.value as any).code}
                                    onUpdate:value={(val: string) =>
                                      handleUpdateField('code', val)
                                    }
                                    disabled={!isCurrentVersionDraft.value}
                                    style={{
                                      fontFamily: 'var(--ds-font-mono)'
                                    }}
                                  />
                                </NFormItem>
                                <NFormItem
                                  label={t('data_standard.field_data_type')}
                                >
                                  <NSelect
                                    value={
                                      (selectedField.value as any).dataType
                                    }
                                    options={DATA_TYPE_OPTIONS}
                                    onUpdate:value={(val: string) =>
                                      handleUpdateField('dataType', val)
                                    }
                                    disabled={!isCurrentVersionDraft.value}
                                  />
                                </NFormItem>
                                <NFormItem
                                  label={t('data_standard.field_type')}
                                >
                                  <NSelect
                                    value={
                                      (selectedField.value as any).fieldType
                                    }
                                    options={[
                                      {
                                        label: t(
                                          'data_standard.field_type_header'
                                        ),
                                        value: 'HEADER'
                                      },
                                      {
                                        label: t(
                                          'data_standard.field_type_body'
                                        ),
                                        value: 'BODY'
                                      }
                                    ]}
                                    onUpdate:value={(val: string) =>
                                      handleUpdateField('fieldType', val)
                                    }
                                    disabled={!isCurrentVersionDraft.value}
                                  />
                                </NFormItem>
                              </NForm>
                            </div>

                            <NDivider style={{ margin: '8px 0' }} />

                            {/* Advanced section */}
                            <div class='ds-inspector-section'>
                              <div class='ds-inspector-section-title'>
                                高级属性
                              </div>
                              <NForm labelPlacement='top' size='small'>
                                <NGrid cols={2} xGap={6}>
                                  <NGridItem>
                                    <NFormItem
                                      label={t('data_standard.field_length')}
                                    >
                                      <NInput
                                        value={
                                          (selectedField.value as any).length
                                        }
                                        onUpdate:value={(val: string) =>
                                          handleUpdateField('length', val)
                                        }
                                        disabled={!isCurrentVersionDraft.value}
                                      />
                                    </NFormItem>
                                  </NGridItem>
                                  <NGridItem>
                                    <NFormItem
                                      label={t('data_standard.field_precision')}
                                    >
                                      <NInput
                                        value={
                                          (selectedField.value as any).precision
                                        }
                                        onUpdate:value={(val: string) =>
                                          handleUpdateField('precision', val)
                                        }
                                        disabled={!isCurrentVersionDraft.value}
                                      />
                                    </NFormItem>
                                  </NGridItem>
                                  <NGridItem>
                                    <NFormItem
                                      label={t('data_standard.field_unit')}
                                    >
                                      <NInput
                                        value={
                                          (selectedField.value as any).unit
                                        }
                                        onUpdate:value={(val: string) =>
                                          handleUpdateField('unit', val)
                                        }
                                        disabled={!isCurrentVersionDraft.value}
                                      />
                                    </NFormItem>
                                  </NGridItem>
                                  <NGridItem>
                                    <NFormItem
                                      label={t('data_standard.field_default')}
                                    >
                                      <NInput
                                        value={
                                          (selectedField.value as any)
                                            .defaultValue
                                        }
                                        onUpdate:value={(val: string) =>
                                          handleUpdateField('defaultValue', val)
                                        }
                                        disabled={!isCurrentVersionDraft.value}
                                      />
                                    </NFormItem>
                                  </NGridItem>
                                </NGrid>
                                <NFormItem
                                  label={t('data_standard.field_required')}
                                >
                                  <NSwitch
                                    value={
                                      (selectedField.value as any).required
                                    }
                                    onUpdate:value={(val: boolean) =>
                                      handleUpdateField('required', val)
                                    }
                                    disabled={!isCurrentVersionDraft.value}
                                  />
                                  <NText
                                    depth={3}
                                    style={{
                                      fontSize: '11px',
                                      marginLeft: '8px'
                                    }}
                                  >
                                    标记此字段为必填项
                                  </NText>
                                </NFormItem>
                                <NFormItem
                                  label={t('data_standard.field_desc')}
                                >
                                  <NInput
                                    value={
                                      (selectedField.value as any).description
                                    }
                                    onUpdate:value={(val: string) =>
                                      handleUpdateField('description', val)
                                    }
                                    disabled={!isCurrentVersionDraft.value}
                                    type='textarea'
                                    rows={2}
                                    placeholder='字段说明...'
                                  />
                                </NFormItem>
                              </NForm>
                            </div>

                            <NDivider style={{ margin: '8px 0' }} />

                            {/* Delete */}
                            {isCurrentVersionDraft.value && (
                              <NPopconfirm
                                onPositiveClick={() => {
                                  if (selectedIndex.value !== null) {
                                    removeField(selectedIndex.value)
                                    selectedIndex.value = null
                                  }
                                }}
                              >
                                {{
                                  trigger: () => (
                                    <NButton
                                      type='error'
                                      block
                                      size='small'
                                      style={{ marginTop: '8px' }}
                                    >
                                      {t('data_standard.delete')}
                                    </NButton>
                                  ),
                                  default: () => '确认删除此字段？'
                                }}
                              </NPopconfirm>
                            )}
                          </div>
                        </NScrollbar>
                      </>
                    ) : (
                      <div class='ds-inspector-empty'>
                        <svg
                          width='32'
                          height='32'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          stroke-width='1.5'
                          stroke-linecap='round'
                          stroke-linejoin='round'
                          style={{ color: '#cbd5e1', marginBottom: '8px' }}
                        >
                          <rect
                            x='3'
                            y='3'
                            width='18'
                            height='18'
                            rx='2'
                            ry='2'
                          ></rect>
                          <line x1='9' y1='9' x2='15' y2='9'></line>
                          <line x1='9' y1='13' x2='15' y2='13'></line>
                          <line x1='9' y1='17' x2='12' y2='17'></line>
                        </svg>
                        <div class='ds-inspector-empty-text'>
                          选择字段查看属性
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Formats View */}
              {activeView.value === 'formats' && (
                <div class='ds-tab-content'>
                  {isCurrentVersionDraft.value && (
                    <div class='ds-tab-toolbar'>
                      <NButton size='tiny' onClick={addFormat}>
                        {t('data_standard.add_format')}
                      </NButton>
                    </div>
                  )}
                  <NDataTable
                    columns={formatColumns.value}
                    data={formats.value}
                    loading={loading.value}
                    bordered
                    size='small'
                    style={{ flex: 1 }}
                  />
                </div>
              )}

              {/* Mappings View */}
              {activeView.value === 'mappings' && (
                <div class='ds-tab-content'>
                  {isCurrentVersionDraft.value && (
                    <div class='ds-tab-toolbar'>
                      <NButton size='tiny' onClick={addMapping}>
                        {t('data_standard.add_mapping')}
                      </NButton>
                    </div>
                  )}
                  <NDataTable
                    columns={mappingColumns.value}
                    data={mappings.value}
                    loading={loading.value}
                    bordered
                    size='small'
                    style={{ flex: 1 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== Import Modal ===== */}
        <NModal
          v-model:show={showImportModal.value}
          preset='card'
          title='导入字段'
          style={{ width: '560px' }}
        >
          <div style={{ marginBottom: '12px' }}>
            <NButton
              size='small'
              quaternary
              type='primary'
              onClick={() => handleDownloadTemplate('xlsx')}
            >
              下载模板 (XLSX)
            </NButton>
            <NButton
              size='small'
              quaternary
              type='primary'
              onClick={() => handleDownloadTemplate('csv')}
              style={{ marginLeft: '8px' }}
            >
              下载模板 (CSV)
            </NButton>
          </div>
          <div
            class={`ds-import-drop ${
              importDragging.value ? 'ds-import-drop--active' : ''
            }`}
            onDragover={(e: DragEvent) => {
              e.preventDefault()
              importDragging.value = true
            }}
            onDragleave={() => {
              importDragging.value = false
            }}
            onDrop={handleFileDrop}
          >
            {importFileName.value ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%'
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='1.5'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    style={{ color: '#10b981' }}
                  >
                    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
                    <polyline points='14 2 14 8 20 8'></polyline>
                    <polyline points='9 15 12 18 15 15'></polyline>
                  </svg>
                  <span
                    style={{
                      fontSize: '13px',
                      color: '#1e293b',
                      fontWeight: 500
                    }}
                  >
                    {importFileName.value}
                  </span>
                </div>
                <NButton size='tiny' quaternary onClick={clearImportFile}>
                  清除
                </NButton>
              </div>
            ) : (
              <>
                <svg
                  width='28'
                  height='28'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  stroke-width='1.5'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  style={{ color: '#94a3b8', marginBottom: '6px' }}
                >
                  <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
                  <polyline points='14 2 14 8 20 8'></polyline>
                  <line x1='12' y1='18' x2='12' y2='12'></line>
                  <polyline points='9 15 12 12 15 15'></polyline>
                </svg>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  拖拽 CSV / XLS / XLSX 文件到此处
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '4px'
                  }}
                >
                  或
                  <label
                    style={{
                      color: '#3b82f6',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    点击选择文件
                    <input
                      type='file'
                      accept='.csv,.xls,.xlsx'
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
          <NDivider style={{ margin: '14px 0' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              或粘贴 JSON 内容
            </span>
          </NDivider>
          <NInput
            v-model:value={importJsonText.value}
            type='textarea'
            rows={6}
            placeholder='[{"name": "字段名", "code": "field_code", "dataType": "字符", "fieldType": "BODY"}]'
            style={{ fontFamily: 'var(--ds-font-mono)' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '16px'
            }}
          >
            <NButton
              onClick={() => {
                showImportModal.value = false
                clearImportFile()
              }}
            >
              {t('data_standard.cancel')}
            </NButton>
            <NButton
              type='primary'
              onClick={importFile.value ? handleImportFile : handleImportJson}
              disabled={!importFile.value && !importJsonText.value.trim()}
            >
              确认导入
            </NButton>
          </div>
        </NModal>

        {/* ===== Export Modal ===== */}
        <NModal
          v-model:show={showExportModal.value}
          preset='card'
          title='导出字段'
          style={{ width: '400px' }}
        >
          <div
            style={{ marginBottom: '8px', fontSize: '13px', color: '#475569' }}
          >
            选择导出格式
          </div>
          <NSelect
            v-model:value={exportFormat.value}
            options={[
              { label: 'Excel 工作簿 (.xlsx)', value: 'xlsx' },
              { label: 'Excel 97-2003 (.xls)', value: 'xls' },
              { label: 'CSV 文件 (.csv)', value: 'csv' }
            ]}
            style={{ marginBottom: '16px' }}
          />
          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
          >
            <NButton
              onClick={() => {
                showExportModal.value = false
              }}
            >
              {t('data_standard.cancel')}
            </NButton>
            <NButton type='primary' onClick={handleExport}>
              导出
            </NButton>
          </div>
        </NModal>

        {/* ===== Add Group Modal ===== */}
        <NModal
          v-model:show={showAddGroupModal.value}
          preset='dialog'
          title='新建分组'
          positiveText='确定'
          negativeText='取消'
          onPositiveClick={handleAddGroup}
        >
          <NInput
            v-model:value={newGroupName.value}
            placeholder='请输入分组名称'
            onKeyup={(e: KeyboardEvent) => {
              if (e.key === 'Enter') handleAddGroup()
            }}
          />
        </NModal>

        {/* ===== Create Version Modal ===== */}
        <NModal
          v-model:show={showVersionModal.value}
          preset='dialog'
          title={t('data_standard.create_version')}
          positiveText='确定'
          negativeText='取消'
          onPositiveClick={doCreateVersion}
        >
          <NInput
            v-model:value={newVersionDesc.value}
            placeholder='版本描述（可选）'
          />
        </NModal>
      </div>
    )
  }
})
