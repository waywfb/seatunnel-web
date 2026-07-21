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

import { defineComponent } from 'vue'
import {
  NSpace,
  NDataTable,
  NGrid,
  NGridItem,
  NButton
} from 'naive-ui'
import { useNodeModel } from './use-model'
import { useI18n } from 'vue-i18n'
import styles from './node-mode-model.module.scss'

const NodeModeModal = defineComponent({
  name: 'NodeModeModal',
  props: {
    type: {
      type: String,
      default: 'source'
    },
    transformType: {
      type: String,
      default: ''
    },
    predecessorsNodeId: {
      type: String,
      default: ''
    },
    currentNodeId: {
      type: String,
      default: ''
    },
    schemaError: {
      type: Object,
      default: {}
    },
    refForm: {
      type: Object,
      default: null
    },
    standardTableFields: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { expose }) {
    const { t } = useI18n()
    const { state, onInit, onSwitchTable, onUpdatedCheckedRowKeys, onToggleViewMode } =
      useNodeModel(props.type, props.transformType, props.predecessorsNodeId, props.schemaError, props.currentNodeId, props.refForm)

    const getStandardFields = () => {
      const fromProps = (props.standardTableFields as any[]) || []
      if (fromProps.length > 0) return fromProps
      if (props.refForm?.value?.getStandardTableFields) {
        return props.refForm.value.getStandardTableFields() || []
      }
      return []
    }

    const mergeStandardIntoTableData = (inputData: any[], stdFields: any[]) => {
      if (!stdFields.length) return inputData
      if (!inputData.length) {
        return stdFields.map((f: any) => ({
          name: f.name || f.code || '',
          type: f.dataType || '',
          nullable: !f.required,
          primaryKey: false,
          comment: f.description || '',
          defaultValue: '',
          groupName: f.groupName || ''
        }))
      }
      const stdMap = new Map<string, any>()
      stdFields.forEach((f: any) => {
        const key = (f.code || f.name || '').toLowerCase()
        if (key) stdMap.set(key, f)
      })
      if (stdMap.size === 0) return inputData
      return inputData.map((row: any) => {
        const matchKey = (row.name || '').toLowerCase()
        const std = stdMap.get(matchKey)
        if (!std) return row
        return {
          ...row,
          type: row.type || std.dataType || '',
          nullable: row.nullable !== undefined ? row.nullable : !std.required,
          comment: row.comment || std.description || '',
          groupName: std.groupName || ''
        }
      })
    }

    expose({
      getOutputSchema: () => ({
        allTableData: state.allTableData,
        outputTableData: state.outputTableData,
        inputTableData: state.inputTableData
      }),
      getSelectFields: () => ({
        tableFields: state.selectedKeys,
        all: state.selectedKeys.length === state.inputTableData.length
      }),
      setSelectFields: (selectedKeys: string[]) =>
        (state.selectedKeys = selectedKeys),
      initData: (info: any) => {
        onInit(info)
      }
    })

    return () => {
      const isSplitMode = state.viewMode === 'split'
      const standardFields = getStandardFields()
      const hasStandardFields = standardFields.length > 0
      const displayInputData = hasStandardFields
        ? mergeStandardIntoTableData(state.inputTableData, standardFields)
        : state.inputTableData

      const groupNameCol = { title: '分组', key: 'groupName', width: 100, ellipsis: { tooltip: true } }
      const inputCols = hasStandardFields
        ? [...state.inputColumns, groupNameCol] as any[]
        : state.inputColumns

      const mergedCols = hasStandardFields
        ? [...state.mergedColumns, groupNameCol] as any[]
        : state.mergedColumns

      return (
        <div class={styles['model-content']}>
          {isSplitMode ? (
            <NGrid xGap={6}>
              <NGridItem span={props.type === 'sink' ? 24 : 12}>
                <NSpace vertical>
                  <h3>
                    {t('project.synchronization_definition.input_table_structure')}
                  </h3>
                  <NDataTable
                    size='small'
                    row-class-name={styles['adjust-th-height']}
                    columns={inputCols}
                    data={displayInputData}
                    onUpdateCheckedRowKeys={onUpdatedCheckedRowKeys}
                    rowKey={(row) => row.name}
                    checkedRowKeys={state.selectedKeys}
                    scrollX={state.inputTableWidth}
                  />
                </NSpace>
              </NGridItem>
              {props.type !== 'sink' && (
                <NGridItem span={12}>
                  <NSpace vertical>
                    <h3>
                      {t('project.synchronization_definition.output_table_structure')}
                    </h3>
                    <NDataTable
                      size='small'
                      row-class-name={styles['adjust-th-height']}
                      columns={state.outputColumns}
                      data={state.outputTableData}
                      scrollX={state.outputTableWidth}
                    />
                  </NSpace>
                </NGridItem>
              )}
            </NGrid>
          ) : (
            <NSpace vertical>
              <div class={styles['merged-header']}>
                <h3>
                  {t('project.synchronization_definition.input_table_structure')}
                </h3>
                <NButton text size='tiny' onClick={onToggleViewMode}>
                  {isSplitMode
                    ? t('project.synchronization_definition.view_mode_merged')
                    : t('project.synchronization_definition.view_mode_split')}
                </NButton>
              </div>
              <NDataTable
                size='small'
                row-class-name={styles['adjust-th-height']}
                columns={mergedCols}
                data={displayInputData}
                onUpdateCheckedRowKeys={(keys) => {
                  if (props.type === 'source' || props.type === 'sink') {
                    onUpdatedCheckedRowKeys(keys)
                  }
                }}
                rowKey={(row) => row.name}
                checkedRowKeys={props.type === 'source' || props.type === 'sink' ? state.selectedKeys : undefined}
                scrollX={state.mergedTableWidth}
              />
            </NSpace>
          )}
        </div>
      )
    }
  }
})

export default NodeModeModal
