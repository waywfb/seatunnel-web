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

import { defineComponent, onMounted, computed, ref, h, watch } from 'vue'
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
  NTag,
  NEmpty,
  NModal,
  NText,
  NScrollbar
} from 'naive-ui'
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

export default defineComponent({
  name: 'DataStandardDetail',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()

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
    const selectedGroup = ref<string | null>(null)
    const showAddGroupModal = ref(false)
    const newGroupName = ref('')
    const groups = ref<string[]>([])

    // Inspector state
    const selectedIndex = ref<number | null>(null)
    const searchQuery = ref('')
    const selectedField = computed(() => {
      if (selectedIndex.value === null) return null
      return filteredFields.value[selectedIndex.value] || null
    })

    const isCreatePage = computed(() => route.name === 'data-standard-create')

    const groupTreeData = computed(() => {
      const allGroups = new Set<string>(groups.value)
      fields.value.forEach((f: any) => {
        if (f.groupName) allGroups.add(f.groupName)
      })
      return Array.from(allGroups).map(g => ({
        key: g,
        label: g + ' (' + fields.value.filter((f: any) => f.groupName === g).length + ')'
      }))
    })

    const filteredFields = computed(() => {
      let result = fields.value
      // Filter by group
      if (selectedGroup.value) {
        result = result.filter((f: any) => f.groupName === selectedGroup.value)
      }
      // Filter by search
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter((f: any) =>
          (f.name || '').toLowerCase().includes(q) ||
          (f.code || '').toLowerCase().includes(q) ||
          (f.description || '').toLowerCase().includes(q)
        )
      }
      return result
    })

    const handleAddGroup = () => {
      if (!newGroupName.value.trim()) return
      const name = newGroupName.value.trim()
      if (!groups.value.includes(name)) {
        groups.value.push(name)
      }
      newGroupName.value = ''
      showAddGroupModal.value = false
    }

    const handleDeleteGroup = (groupKey: string) => {
      fields.value.forEach((f: any) => {
        if (f.groupName === groupKey) f.groupName = ''
      })
      groups.value = groups.value.filter(g => g !== groupKey)
      if (selectedGroup.value === groupKey) selectedGroup.value = null
    }

    const handleAddFieldToGroup = () => {
      if (!selectedGroup.value) {
        return
      }
      addField()
      const lastField = fields.value[fields.value.length - 1]
      if (lastField) {
        lastField.groupName = selectedGroup.value
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
      {
        title: t('data_standard.format_record_sep'),
        key: 'recordSeparator',
        width: 120,
        render: (row: any) => h(NInput, {
          value: row.recordSeparator,
          size: 'small',
          'onUpdate:value': (val: string) => { row.recordSeparator = val }
        })
      },
      {
        title: t('data_standard.format_field_sep'),
        key: 'fieldSeparator',
        width: 120,
        render: (row: any) => h(NInput, {
          value: row.fieldSeparator,
          size: 'small',
          'onUpdate:value': (val: string) => { row.fieldSeparator = val }
        })
      },
      {
        title: t('data_standard.format_encoding'),
        key: 'encoding',
        width: 100,
        render: (row: any) => h(NInput, {
          value: row.encoding,
          size: 'small',
          'onUpdate:value': (val: string) => { row.encoding = val }
        })
      },
      {
        title: t('data_standard.format_header_rows'),
        key: 'headerRows',
        width: 100,
        render: (row: any) => h(NInput, {
          value: row.headerRows,
          size: 'small',
          'onUpdate:value': (val: string) => { row.headerRows = val }
        })
      },
      {
        title: t('data_standard.format_quote'),
        key: 'quoteChar',
        width: 80,
        render: (row: any) => h(NInput, {
          value: row.quoteChar,
          size: 'small',
          'onUpdate:value': (val: string) => { row.quoteChar = val }
        })
      },
      {
        title: t('data_standard.format_escape'),
        key: 'escapeChar',
        width: 80,
        render: (row: any) => h(NInput, {
          value: row.escapeChar,
          size: 'small',
          'onUpdate:value': (val: string) => { row.escapeChar = val }
        })
      },
      {
        title: t('data_standard.format_file_terminator'),
        key: 'fileTerminator',
        width: 100,
        render: (row: any) => h(NInput, {
          value: row.fileTerminator,
          size: 'small',
          'onUpdate:value': (val: string) => { row.fileTerminator = val }
        })
      },
      {
        title: t('data_standard.field_desc'),
        key: 'description',
        width: 150,
        render: (row: any) => h(NInput, {
          value: row.description,
          size: 'small',
          'onUpdate:value': (val: string) => { row.description = val }
        })
      },
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
      {
        title: t('data_standard.mapping_source_name'),
        key: 'sourceName',
        width: 150,
        render: (row: any) => h(NInput, {
          value: row.sourceName,
          size: 'small',
          'onUpdate:value': (val: string) => { row.sourceName = val }
        })
      },
      {
        title: t('data_standard.mapping_source_index'),
        key: 'sourceIndex',
        width: 120,
        render: (row: any) => h(NInput, {
          value: row.sourceIndex,
          size: 'small',
          'onUpdate:value': (val: string) => { row.sourceIndex = val }
        })
      },
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
      {
        title: t('data_standard.mapping_sample'),
        key: 'sampleValue',
        width: 150,
        render: (row: any) => h(NInput, {
          value: row.sampleValue,
          size: 'small',
          'onUpdate:value': (val: string) => { row.sampleValue = val }
        })
      },
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
      return h(NTag, { type: map[status] as any, size: 'small', round: true, bordered: false },
        { default: () => labelMap[status] || status })
    }

    const dataTypeTag = (dataType: string) => {
      const map: Record<string, string> = {
        '字符': 'info',
        '数值': 'success',
        '日期': 'warning'
      }
      return h(NTag, { type: (map[dataType] || 'default') as any, size: 'tiny', round: true, bordered: false },
        { default: () => dataType })
    }

    const fieldTypeTag = (fieldType: string) => {
      const map: Record<string, string> = {
        HEADER: 'warning',
        BODY: 'info'
      }
      return h(NTag, { type: (map[fieldType] || 'default') as any, size: 'tiny', round: true, bordered: false },
        { default: () => fieldType === 'HEADER' ? t('data_standard.field_type_header') : t('data_standard.field_type_body') })
    }

    onMounted(() => {
      if (isEdit.value) {
        loadDetail()
      }
    })

    // Watch for fields to auto-select first group
    watch(() => fields.value, (newFields) => {
      if (newFields.length > 0 && !selectedGroup.value && groupTreeData.value.length > 0) {
        selectedGroup.value = groupTreeData.value[0].key
      }
    }, { immediate: true })

    return () => (
      <NSpace vertical size='large'>
        {/* Standard Form */}
        <NCard bordered={false}>
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
                    rows={2}
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
          <NCard bordered={false}>
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
            <NTabs v-model:value={activeTab.value} type='line'>
              <NTabPane name='fields' tab={t('data_standard.tab_fields')}>
                <div style={{ display: 'flex', gap: '16px', minHeight: '500px' }}>
                  {/* Left: Field List */}
                  <div style={{ flex: '1', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Toolbar */}
                    <NSpace justify='space-between' align='center'>
                      <NSpace>
                        <NInput
                          v-model:value={searchQuery.value}
                          placeholder='搜索字段...'
                          size='small'
                          clearable
                          style={{ width: '200px' }}
                        />
                        <NSelect
                          v-model:value={selectedGroup.value}
                          options={groupTreeData.value.map(g => ({ label: g.label, value: g.key }))}
                          size='small'
                          style={{ width: '180px' }}
                          placeholder='选择分组'
                          clearable
                        />
                      </NSpace>
                      {isCurrentVersionDraft.value && (
                        <NSpace>
                          <NButton size='small' onClick={() => { showAddGroupModal.value = true }}>
                            新建分组
                          </NButton>
                          <NButton type='primary' size='small' onClick={handleAddFieldToGroup}>
                            {t('data_standard.add_field')}
                          </NButton>
                          <NButton type='primary' size='small' onClick={saveFields}>
                            {t('data_standard.save_fields')}
                          </NButton>
                        </NSpace>
                      )}
                    </NSpace>

                    {/* Field Cards */}
                    <NScrollbar style={{ maxHeight: '450px' }}>
                      <NSpace vertical size={8}>
                        {filteredFields.value.map((field: any, index: number) => (
                          <div
                            key={field.id || index}
                            onClick={() => handleSelectField(index)}
                            style={{
                              padding: '12px 16px',
                              border: selectedIndex.value === index ? '2px solid #2080f0' : '1px solid #e0e0e6',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: selectedIndex.value === index ? '#f0f8ff' : '#fff',
                              transition: 'all 0.2s'
                            }}
                          >
                            <NSpace justify='space-between' align='center'>
                              <NSpace align='center' size={8}>
                                <NText strong style={{ fontSize: '14px' }}>{field.name}</NText>
                                {fieldTypeTag(field.fieldType)}
                                {dataTypeTag(field.dataType)}
                                {field.required && (
                                  <NTag type='error' size='tiny' round bordered={false}>
                                    必填
                                  </NTag>
                                )}
                              </NSpace>
                              <NText depth={3} style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                {field.code}
                              </NText>
                            </NSpace>
                            {field.description && (
                              <NText depth={2} style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                {field.description}
                              </NText>
                            )}
                          </div>
                        ))}
                        {filteredFields.value.length === 0 && (
                          <NEmpty description='暂无字段' style={{ padding: '40px' }} />
                        )}
                      </NSpace>
                    </NScrollbar>
                  </div>

                  {/* Right: Inspector Panel */}
                  {selectedField.value && (
                    <div style={{ width: '320px', flexShrink: 0, borderLeft: '1px solid #e0e0e6', paddingLeft: '16px' }}>
                      <NSpace vertical size={16}>
                        <NText strong style={{ fontSize: '16px' }}>
                          {t('data_standard.inspector_title')}
                        </NText>

                        {/* Basic Info */}
                        <NCard size='small' title={t('data_standard.inspector_basic')} bordered={false} style={{ backgroundColor: '#fafafa' }}>
                          <NForm labelPlacement='top' size='small'>
                            <NFormItem label={t('data_standard.field_name')}>
                              <NInput
                                value={(selectedField.value as any).name}
                                onUpdate:value={(val: string) => handleUpdateField('name', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_code')}>
                              <NInput
                                value={(selectedField.value as any).code}
                                onUpdate:value={(val: string) => handleUpdateField('code', val)}
                                disabled={!isCurrentVersionDraft.value}
                                style={{ fontFamily: 'monospace' }}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_data_type')}>
                              <NSelect
                                value={(selectedField.value as any).dataType}
                                options={DATA_TYPE_OPTIONS}
                                onUpdate:value={(val: string) => handleUpdateField('dataType', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_type')}>
                              <NSelect
                                value={(selectedField.value as any).fieldType}
                                options={[
                                  { label: t('data_standard.field_type_header'), value: 'HEADER' },
                                  { label: t('data_standard.field_type_body'), value: 'BODY' }
                                ]}
                                onUpdate:value={(val: string) => handleUpdateField('fieldType', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                          </NForm>
                        </NCard>

                        {/* Constraints */}
                        <NCard size='small' title={t('data_standard.inspector_constraints')} bordered={false} style={{ backgroundColor: '#fafafa' }}>
                          <NForm labelPlacement='top' size='small'>
                            <NFormItem label={t('data_standard.field_length')}>
                              <NInput
                                value={(selectedField.value as any).length}
                                onUpdate:value={(val: string) => handleUpdateField('length', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_precision')}>
                              <NInput
                                value={(selectedField.value as any).precision}
                                onUpdate:value={(val: string) => handleUpdateField('precision', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_default')}>
                              <NInput
                                value={(selectedField.value as any).defaultValue}
                                onUpdate:value={(val: string) => handleUpdateField('defaultValue', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_required')}>
                              <NSwitch
                                value={(selectedField.value as any).required}
                                onUpdate:value={(val: boolean) => handleUpdateField('required', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                          </NForm>
                        </NCard>

                        {/* Metadata */}
                        <NCard size='small' title={t('data_standard.inspector_metadata')} bordered={false} style={{ backgroundColor: '#fafafa' }}>
                          <NForm labelPlacement='top' size='small'>
                            <NFormItem label={t('data_standard.field_unit')}>
                              <NInput
                                value={(selectedField.value as any).unit}
                                onUpdate:value={(val: string) => handleUpdateField('unit', val)}
                                disabled={!isCurrentVersionDraft.value}
                              />
                            </NFormItem>
                            <NFormItem label={t('data_standard.field_desc')}>
                              <NInput
                                value={(selectedField.value as any).description}
                                onUpdate:value={(val: string) => handleUpdateField('description', val)}
                                disabled={!isCurrentVersionDraft.value}
                                type='textarea'
                                rows={2}
                              />
                            </NFormItem>
                          </NForm>
                        </NCard>

                        {/* Delete button */}
                        {isCurrentVersionDraft.value && (
                          <NPopconfirm onPositiveClick={() => {
                            if (selectedIndex.value !== null) {
                              removeField(selectedIndex.value)
                              selectedIndex.value = null
                            }
                          }}>
                            {{ trigger: () => <NButton type='error' block>{t('data_standard.delete')}</NButton>,
                              default: () => '确认删除此字段？' }}
                          </NPopconfirm>
                        )}
                      </NSpace>
                    </div>
                  )}
                </div>

                {/* Add Group Modal */}
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
                    onKeyup={(e: KeyboardEvent) => { if (e.key === 'Enter') handleAddGroup() }}
                  />
                </NModal>
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
