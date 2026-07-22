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

import { defineComponent, computed } from 'vue'
import {
  NButton,
  NInput,
  NIcon,
  NSpace,
  NDataTable,
  NPagination,
  NCard,
  NSelect,
  NEmpty,
  useMessage
} from 'naive-ui'
import STabs from '@/components/tabs'
import { Plus } from 'lucide-vue-next'
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

const ALL_TAB = { label: '全部', value: '__all__' }

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
      onPageSizeChange,
      getList,
      getAllData
    } = useTable()

    // 获取各类型统计数量
    const getTypeCount = (type: string | null) => {
      if (type === null || type === '__all__') return state.allData.length
      return state.typeCounts[type] || 0
    }

    const { columns } = useColumns(
      async (
        id: number,
        type: 'edit' | 'delete' | 'enable' | 'disable' | 'copy'
      ) => {
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

    const handleTypeChange = (val: string) => {
      state.params.type = val === '__all__' ? null : val
      state.page = 1
      onSearch()
    }

    const tabOptions = [ALL_TAB, ...TYPE_OPTIONS]

    const tabs = computed(() =>
      tabOptions.map((opt) => ({
        name: String(opt.value),
        label: opt.label,
        count: getTypeCount(opt.value)
      }))
    )

    const tabValue = computed(() =>
      state.params.type == null ? '__all__' : String(state.params.type)
    )

    return () => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%'
        }}
      >
        {/* Page title with action button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0
              }}
            >
              {t('data_standard.data_standard')}
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '4px 0 0 0'
              }}
            >
              管理国家、行业、企业等标准规范
            </p>
          </div>
          <button
            onClick={() => router.push({ name: 'data-standard-create' })}
            style={{
              backgroundColor: '#10b981',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            {t('data_standard.create')}
          </button>
        </div>

        {/* Tab + Search 融合栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <STabs
            value={tabValue.value}
            onUpdate:value={handleTypeChange}
            tabs={tabs.value}
            style={{ flex: '1 1 auto', minWidth: 0 }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <NInput
              v-model:value={state.params.name}
              clearable
              placeholder={t('data_standard.search_name')}
              onKeyup={handleKeyup}
              style={{ width: '180px' }}
            />
            <NSelect
              v-model:value={state.params.status}
              clearable
              placeholder={t('data_standard.search_status')}
              options={STATUS_OPTIONS}
              style={{ width: '110px' }}
            />
            <NButton type='primary' onClick={onSearch}>
              <NIcon>
                <SearchOutlined />
              </NIcon>
            </NButton>
            <NButton
              onClick={() => {
                state.params.name = null
                state.params.status = null
                state.page = 1
                getList()
                getAllData()
              }}
            >
              重置
            </NButton>
          </div>
        </div>

        {/* Table */}
        <NCard style={{ marginTop: '8px' }}>
          {state.list.length === 0 && !state.loading ? (
            <div style={{ padding: '60px 0' }}>
              <NEmpty description='暂无数据' />
            </div>
          ) : (
            <NDataTable
              columns={columns.value}
              data={state.list}
              loading={state.loading}
              row-key={(row: any) => row.id}
            />
          )}
          <NSpace justify='center' style={{ marginTop: '16px' }}>
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
        </NCard>
      </div>
    )
  }
})

export default DataStandardList
