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
  NButton,
  NInput,
  NIcon,
  NSpace,
  NDataTable,
  NPagination,
  NCard,
  NSelect,
  NTabs,
  NTabPane,
  useMessage
} from 'naive-ui'
import { SearchOutlined } from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTable } from './use-table'
import { useColumns } from './use-columns'
import { TYPE_OPTIONS } from '../types'

const STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 }
]

const ALL_TAB = { label: '全部', value: null }

const DataStandardList = defineComponent({
  name: 'DataStandardList',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const message = useMessage()

    const {
      state,
      onSearch,
      onDelete,
      onEnable,
      onDisable,
      onCopy,
      onPageChange,
      onPageSizeChange
    } = useTable()

    const { columns } = useColumns(
      async (id: number, type: 'edit' | 'delete' | 'enable' | 'disable' | 'copy') => {
        switch (type) {
          case 'edit':
            router.push({ name: 'data-standard-edit', params: { id } })
            break
          case 'delete':
            await onDelete(id)
            break
          case 'enable':
            await onEnable(id)
            break
          case 'disable':
            await onDisable(id)
            break
          case 'copy':
            await onCopy(id)
            break
        }
      }
    )

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onSearch()
      }
    }

    const handleTypeChange = (val: string | null) => {
      state.params.type = val
      state.page = 1
      onSearch()
    }

    const tabOptions = [
      ALL_TAB,
      ...TYPE_OPTIONS
    ]

    return () => (
      <NSpace vertical>
        <NCard>
          <NSpace vertical size={16}>
            <NTabs
              type='line'
              value={state.params.type}
              onUpdate:value={handleTypeChange}
            >
              {tabOptions.map(opt => (
                <NTabPane name={opt.value} tab={opt.label} />
              ))}
            </NTabs>
            <NSpace justify='space-between'>
              <NButton
                type='info'
                onClick={() => router.push({ name: 'data-standard-create' })}
              >
                {t('data_standard.create')}
              </NButton>
              <NSpace justify='end'>
                <NInput
                  v-model:value={state.params.name}
                  clearable
                  placeholder={t('data_standard.search_name')}
                  onKeyup={handleKeyup}
                  style={{ width: '200px' }}
                />
                <NSelect
                  v-model:value={state.params.status}
                  clearable
                  placeholder={t('data_standard.search_status')}
                  options={STATUS_OPTIONS}
                  style={{ width: '120px' }}
                />
                <NButton type='primary' onClick={onSearch}>
                  <NIcon>
                    <SearchOutlined />
                  </NIcon>
                </NButton>
              </NSpace>
            </NSpace>
          </NSpace>
        </NCard>
        <NCard>
          <NSpace vertical>
            <NDataTable
              columns={columns.value}
              data={state.list}
              loading={state.loading}
              row-key={(row: any) => row.id}
            />
            <NSpace justify='center'>
              <NPagination
                v-model:page={state.page}
                v-model:page-size={state.pageSize}
                item-count={state.itemCount}
                show-size-picker
                page-sizes={[10, 30, 50]}
                show-quick-jumper
                on-update:page={onPageChange}
                on-update:page-size={onPageSizeChange}
              />
            </NSpace>
          </NSpace>
        </NCard>
      </NSpace>
    )
  }
})

export default DataStandardList
