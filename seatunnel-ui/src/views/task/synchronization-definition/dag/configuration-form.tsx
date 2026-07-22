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

import { defineComponent, nextTick, PropType, ref, watchEffect } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NRadioGroup,
  NRadio,
  NCheckboxGroup,
  NCheckbox,
  NSpin,
  NTransfer,
  NDataTable,
  NTag
} from 'naive-ui'
import { DynamicFormItem } from '@/components/dynamic-form/dynamic-form-item'
import { KINDS } from './config'
import {
  useConfigurationForm,
  getSceneModeOptions
} from './use-configuration-form'
import SmartParseModal from './smart-parse-modal'
import { useI18n } from 'vue-i18n'
import type { NodeType, TableOption, State } from './types'
import { debounce } from 'lodash'
import { NButton, NModal, NButtonGroup } from 'naive-ui'

const ConfigurationForm = defineComponent({
  name: 'ConfigurationForm',
  props: {
    // eslint-disable-next-line vue/require-default-prop
    nodeType: {
      type: String as PropType<string>
    },
    // eslint-disable-next-line vue/require-default-prop
    nodeId: {
      type: String as PropType<string>
    },
    // eslint-disable-next-line vue/require-default-prop
    transformType: {
      type: String as PropType<string>
    },
    // eslint-disable-next-line vue/require-default-prop
    datasourceName: {
      type: String as PropType<string>,
      default: ''
    },
    // eslint-disable-next-line vue/require-default-prop
    predecessorDatasourceName: {
      type: String as PropType<string>,
      default: ''
    },
    // eslint-disable-next-line vue/require-default-prop
    predecessorTableName: {
      type: String as PropType<string>,
      default: ''
    }
  },
  emits: ['tableNameChange', 'smartParseConfirm'],
  setup(props, { expose, emit }) {
    const {
      state,
      dagStore,
      getDatasourceOptions,
      getDatabaseOptions,
      getTableOptions,
      updateFormValues,
      smartParseState,
      onSmartParseOpen,
      onSmartParseStrategyChange,
      onSmartParseConfirm,
      onSmartParseCancel
    } = useConfigurationForm(
      props.nodeType as NodeType,
      props.transformType as string,
      props.datasourceName as string,
      props.predecessorDatasourceName as string,
      props.predecessorTableName as string
    )
    const { t } = useI18n()
    const formRef = ref()
    const transfer = ref()

    const onTableChange = (tableName: any) => {
      state.model.tableName = tableName
      if (props.nodeType === 'sink' && state.model.database) {
        getTableOptions(state.model.database, '')
      }
      emit('tableNameChange', state.model)
    }

    const handleSmartParseConfirm = () => {
      onSmartParseConfirm()
      emit('smartParseConfirm')
    }

    const prevQueryTableName = ref('')
    const onTableSearch = debounce(async (tableName: any) => {
      // If it is a sink node and there is input content.
      if (props.nodeType === 'sink' && tableName) {
        try {
          // rely on database
          if (state.model.database && prevQueryTableName.value !== tableName) {
            await getTableOptions(state.model.database, tableName)
            prevQueryTableName.value = tableName

            // If there are no results after searching, add user input as a custom value to the options
            const existingOption = state.tableOptions.find(
              (option: TableOption) => option.value === tableName
            )

            if (!existingOption) {
              const newOption: TableOption = {
                label: tableName,
                value: tableName
              }
              state.tableOptions = [...state.tableOptions, newOption]
            }
          }
        } catch (err) {
          // If the interface call fails, also use user input as a custom value
          const existingOption = state.tableOptions.find(
            (option: TableOption) => option.value === tableName
          )

          if (!existingOption) {
            const newOption: TableOption = {
              label: tableName,
              value: tableName
            }
            state.tableOptions = [...state.tableOptions, newOption]
          }
        }
      } else {
        // The source node maintains its original logic
        if (state.model.database && prevQueryTableName.value !== tableName) {
          getTableOptions(state.model.database, tableName)
          prevQueryTableName.value = tableName
        }
      }
    }, 1000)

    const onDatabaseChange = (v: any) => {
      nextTick(() => {
        if (state.model.database) {
          const size =
            state.model.sceneMode === 'MULTIPLE_TABLE' ? 9999999 : 100
          getTableOptions(state.model.database as any, '', size)
        }
      })
    }

    // watchEffect(() => {
    //   // Track the src input of the transfer and refresh the table name list when the input value change
    //   let query = transfer?.value?.srcPattern
    //   onTableSearch(query)
    // })

    expose({
      validate: async () => {
        try {
          await formRef.value.validate()
          return true
        } catch (err) {
          return false
        }
      },
      getValues: () => state.model,
      setValues: updateFormValues,
      getStandardTableFields: () => state.standardTableFields
    })

    return () => (
      <NSpin show={state.loading}>
        <div class='bg-white rounded-lg border border-[var(--color-border)] p-6'>
          <div class='mb-6'>
            <h3 class='text-base font-semibold text-[var(--color-foreground)] mb-1'>
              {props.nodeType === 'sink'
                ? '写入节点配置'
                : props.nodeType === 'source'
                ? '读取节点配置'
                : '转换节点配置'}
            </h3>
            <p class='text-sm text-[var(--color-muted-foreground)]'>
              配置数据
              {props.nodeType === 'sink'
                ? '写入'
                : props.nodeType === 'source'
                ? '读取'
                : '转换'}
              的目标和参数
            </p>
          </div>

          <NForm
            ref={formRef}
            model={state.model}
            rules={state.rules}
            labelPlacement='top'
          >
            <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <NFormItem
                label={t('project.synchronization_definition.node_name')}
                path='name'
                class='mb-0'
              >
                <NInput
                  clearable
                  v-model={[state.model.name, 'value']}
                  placeholder={t(
                    'project.synchronization_definition.node_name_placeholder'
                  )}
                />
              </NFormItem>

              {props.nodeType === 'source' && (
                <NFormItem
                  label={t('project.synchronization_definition.scene_mode')}
                  path='sceneMode'
                  class='mb-0'
                >
                  <NSelect
                    filterable
                    options={getSceneModeOptions(
                      dagStore.getDagInfo.jobType,
                      t,
                      state.allowedSceneModes
                    )}
                    v-model={[state.model.sceneMode, 'value']}
                    onUpdateValue={(v) => {
                      if (v !== state.model.sceneMode) {
                        getDatasourceOptions(v)
                        state.model.datasourceInstanceId = null
                        state.model.database = null
                        state.model.tableName = null
                        state.formStructure = []
                        state.databaseOptions = []
                        state.tableOptions = []
                        state.useDatabaseAndTable = true
                      }
                    }}
                  />
                </NFormItem>
              )}

              {props.nodeType !== 'transform' && (
                <NFormItem
                  label={t('project.synchronization_definition.source_name')}
                  path='datasourceInstanceId'
                  class='mb-0'
                >
                  <NSelect
                    filterable
                    loading={state.datasourceLoading}
                    options={state.datasourceOptions}
                    v-model={[state.model.datasourceInstanceId, 'value']}
                    onUpdateValue={(v, option) => {
                      if (v !== state.model.datasourceInstanceId) {
                        getDatabaseOptions(v, option)
                        state.model.database = null
                        state.model.tableName = null
                        state.tableOptions = []
                      }
                    }}
                  />
                </NFormItem>
              )}

              {props.nodeType !== 'transform' && state.useDatabaseAndTable && (
                <NFormItem
                  label={t('project.synchronization_definition.database')}
                  path='database'
                  class='mb-0'
                >
                  <NSelect
                    filterable
                    loading={state.databaseLoading}
                    multiple={state.model.sceneMode === 'SPLIT_TABLE'}
                    options={state.databaseOptions}
                    v-model={[state.model.database, 'value']}
                    onUpdateValue={(v) => {
                      if (v !== state.model.database) {
                        onDatabaseChange(v)
                        state.model.tableName = null
                      }
                    }}
                  />
                </NFormItem>
              )}
            </div>

            {state.useDatabaseAndTable &&
              dagStore.getDagInfo.jobType === 'DATA_INTEGRATION' &&
              (props.nodeType === 'sink' || props.nodeType === 'source') && (
                <NFormItem
                  label={t('project.synchronization_definition.table_name')}
                  path='tableName'
                  class='mt-4'
                >
                  <NSelect
                    filterable
                    loading={state.tableLoading}
                    options={state.tableOptions}
                    v-model={[state.model.tableName, 'value']}
                    onUpdateValue={onTableChange}
                    onSearch={onTableSearch}
                    remote
                    virtualScroll
                    clearable
                    tag={props.nodeType === 'sink'}
                    showArrow={true}
                    allowInput={props.nodeType === 'sink'}
                    placeholder={t(
                      'project.synchronization_definition.target_name_tips'
                    )}
                  />
                </NFormItem>
              )}

            {state.useDatabaseAndTable &&
              state.model.sceneMode === 'MULTIPLE_TABLE' && (
                <NFormItem
                  label={t('project.synchronization_definition.table_name')}
                  path='tableName'
                  class='mt-4'
                >
                  <NTransfer
                    style={{ width: '100%' }}
                    ref={transfer}
                    filterable
                    sourceTitle={t(
                      'project.synchronization_definition.table_sync'
                    )}
                    targetTitle={t(
                      'project.synchronization_definition.selected_table'
                    )}
                    options={state.tableOptions}
                    v-model={[state.model.tableName, 'value']}
                    onUpdateValue={onTableChange}
                    virtualScroll
                  />
                </NFormItem>
              )}

            {props.transformType === 'FilterRowKind' && (
              <div class='mt-4'>
                <NFormItem
                  label={t('project.synchronization_definition.kind')}
                  path='kind'
                  showFeedback={false}
                  showRequireMark
                >
                  <NRadioGroup
                    v-model={[state.model.kind, 'value']}
                    name='model.kind'
                  >
                    <NSpace>
                      <NRadio value={0}>
                        {t('project.synchronization_definition.include_kind')}
                      </NRadio>
                      <NRadio value={1}>
                        {t('project.synchronization_definition.exclude_kind')}
                      </NRadio>
                    </NSpace>
                  </NRadioGroup>
                </NFormItem>
                <NFormItem showLabel={false} path='kinds'>
                  <NCheckboxGroup v-model={[state.model.kinds, 'value']}>
                    <NSpace>
                      {KINDS.map((kind) => (
                        <NCheckbox value={kind.value} label={kind.label} />
                      ))}
                    </NSpace>
                  </NCheckboxGroup>
                </NFormItem>
              </div>
            )}

            {props.transformType === 'Sql' && (
              <NFormItem
                label={t(
                  'project.synchronization_definition.sql_content_label'
                )}
                path='query'
                class='mt-4'
              >
                <NInput
                  v-model={[state.model.query, 'value']}
                  type='textarea'
                  clearable
                  placeholder={t(
                    'project.synchronization_definition.sql_content_label_placeholder'
                  )}
                />
              </NFormItem>
            )}

            {state.formStructure.length > 0 && (
              <div class='mt-4 pt-4 border-t border-[var(--color-border)]'>
                <DynamicFormItem
                  model={state.model}
                  formStructure={state.formStructure}
                  name={state.formName}
                  locales={state.formLocales}
                  advancedLabel={
                    props.nodeType === 'source' || props.nodeType === 'sink'
                      ? '高级设置'
                      : ''
                  }
                />
              </div>
            )}

            {props.transformType === 'JsonPath' && (
              <div class='flex justify-center mt-6'>
                <NButton type='primary' onClick={onSmartParseOpen}>
                  {t('project.synchronization_definition.smart_parse_button')}
                </NButton>
              </div>
            )}
          </NForm>

          <NModal
            show={smartParseState.showModal}
            title={t('project.synchronization_definition.smart_parse_title')}
            preset='card'
            style={{ width: '720px' }}
            onUpdateShow={(val: boolean) => {
              if (!val) onSmartParseCancel()
            }}
          >
            <SmartParseModal
              fields={smartParseState.fields}
              hasMessage={smartParseState.hasMessage}
              loading={smartParseState.loading}
              onUpdateStrategy={onSmartParseStrategyChange}
            />
            <div class='flex justify-end gap-3 mt-4'>
              <NButton onClick={onSmartParseCancel}>
                {t('project.synchronization_definition.cancel')}
              </NButton>
              <NButton type='primary' onClick={handleSmartParseConfirm}>
                {t('project.synchronization_definition.confirm')}
              </NButton>
            </div>
          </NModal>
        </div>
      </NSpin>
    )
  }
})

export default ConfigurationForm
