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
  NSelect,
  NIcon,
  NSpace,
  NDataTable,
  NPagination,
  NCard,
  SelectOption,
  SelectGroupOption
} from 'naive-ui'
import { SearchOutlined } from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTable } from './use-table'
import { useColumns } from './use-columns'
import { useSource } from '@/views/datasource/list/use-source'
import StatCard from '@/components/stat-card'

const VirtualTablesList = defineComponent({
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const { state: sourceState } = useSource(true)
    const { columns } = useColumns(
      (id: string, type: 'edit' | 'delete') => {
        if (type === 'edit') {
          router.push({ name: 'virtual-tables-editor', params: { id: id } })
        } else {
          onDelete(id)
        }
      }
    )
    const {
      state,
      onSearch,
      onDelete,
      onPageChange,
      onPageSizeChange
    } = useTable()

    const stats = computed(() => {
      const list = state.list || []
      const typeCounts: Record<string, number> = {}
      for (const item of list as any[]) {
        const type = item.pluginName || 'Other'
        typeCounts[type] = (typeCounts[type] || 0) + 1
      }
      return {
        total: state.itemCount || list.length,
        typeCounts
      }
    })

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onSearch()
      }
    }

    return () => {
      const renderSearchBar = () => (
        <NCard>
          <NSpace justify='space-between' itemStyle={{ flexGrow: 1 }}>
            <NButton
              type='info'
              onClick={() => router.push({ name: 'virtual-tables-create' })}
            >
              {t('virtual_tables.create')}
            </NButton>
            <NSpace justify='end'>
              <NSelect
                v-model:value={state.params.pluginName}
                clearable
                placeholder={t('virtual_tables.source_type_tips')}
                options={
                 sourceState.types as Array<SelectGroupOption | SelectOption>
                }
                style={{width: '180px'}}
              />
              <NInput
                v-model:value={state.params.datasourceName}
                clearable
                placeholder={t('virtual_tables.source_name_tips')}
                onKeyup={handleKeyup}
              />
              <NButton type='primary' onClick={onSearch}>
                <NIcon>
                  <SearchOutlined />
                </NIcon>
              </NButton>
            </NSpace>
          </NSpace>
        </NCard>
      )

      const renderStatCards = () => (
        <div class='flex gap-3'>
          <StatCard
            label={t('virtual_tables.virtual_tables')}
            value={stats.value.total}
            color='var(--color-info)'
            loading={false}
          />
        </div>
      )

      return (
        <NSpace vertical>
          {renderSearchBar()}
          {renderStatCards()}
          <NCard>
            <NSpace vertical>
              <NDataTable
                columns={columns.value}
                data={state.list}
                loading={state.loading}
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
  }
})

export default VirtualTablesList
