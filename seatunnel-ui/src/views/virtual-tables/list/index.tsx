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

import { defineComponent, computed, ref } from 'vue'
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
import { Plus } from 'lucide-vue-next'
import { SearchOutlined } from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import STabs from '@/components/tabs'
import { useTable } from './use-table'
import { useColumns } from './use-columns'
import { useSource } from '@/views/datasource/list/use-source'

// 源类型分类配置
const CATEGORIES = [
  { key: 'db', label: '数据库', color: '#2E6BE0', icon: 'database',
    pluginNames: ['JDBC-Mysql', 'JDBC-Postgres', 'JDBC-Oracle', 'JDBC-SQLServer', 'JDBC-ClickHouse', 'JDBC-TiDB', 'JDBC-Db2', 'JDBC-Hive', 'JDBC-StarRocks', 'JDBC-Redshift', 'MySQL-CDC', 'SqlServer-CDC', 'Postgres-CDC'] },
  { key: 'mq', label: '消息队列', color: '#7B4FE0', icon: 'move_up',
    pluginNames: ['Kafka'] },
  { key: 'api', label: '接口服务', color: '#1DA7B4', icon: 'api',
    pluginNames: ['Http', 'ElasticSearch'] },
  { key: 'file', label: '文件', color: '#4C9A5B', icon: 'folder',
    pluginNames: ['S3', 'FTP', 'SFTP'] },
]

const PLUGIN_CATEGORY: Record<string, string> = {}
for (const cat of CATEGORIES) {
  for (const pn of cat.pluginNames) {
    PLUGIN_CATEGORY[pn] = cat.key
  }
}

const VirtualTablesList = defineComponent({
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const { state: sourceState } = useSource(true)
    const categoryTab = ref('all')
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

    // 分类统计
    const categoryStats = computed(() => {
      const list = state.list || []
      return CATEGORIES.map(cat => {
        const items = cat.pluginNames.map(pn => ({
          pluginName: pn,
          count: stats.value.typeCounts[pn] || 0
        }))
        const total = items.reduce((sum, i) => sum + i.count, 0)
        return { ...cat, items, total }
      }).filter(cat => cat.total > 0)
    })

    // 当前分类数据
    const filteredList = computed(() => {
      if (categoryTab.value === 'all') return state.list
      const cat = CATEGORIES.find(c => c.key === categoryTab.value)
      if (!cat) return state.list
      return (state.list || []).filter((item: any) => cat.pluginNames.includes(item.pluginName))
    })

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onSearch()
      }
    }

    const handleCategoryTab = (key: string) => {
      categoryTab.value = key
    }

    // Tab配置
    const tabOptions = computed(() => {
      const allTab = { name: 'all', label: '全部', count: stats.value.total }
      const catTabs = categoryStats.value.map(cat => ({
        name: cat.key,
        label: cat.label,
        count: cat.total
      }))
      return [allTab, ...catTabs]
    })

    return () => {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          {/* Page title with action button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                {t('menu.virtual_tables')}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                管理业务模型与结构映射
              </p>
            </div>
            <button
              onClick={() => router.push({ name: 'virtual-tables-create' })}
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
              {t('virtual_tables.create')}
            </button>
          </div>

          {/* Category tabs */}
          <div style={{ marginBottom: '4px' }}>
            <STabs
              value={categoryTab.value}
              onUpdate:value={handleCategoryTab}
              tabs={tabOptions.value}
            />
          </div>

          {/* Table with search toolbar */}
          <NCard>
            <NSpace justify='end' style={{ marginBottom: '16px' }}>
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
            <NDataTable
              columns={columns.value}
              data={filteredList.value}
              loading={state.loading}
            />
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
  }
})

export default VirtualTablesList
