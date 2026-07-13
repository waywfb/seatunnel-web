import { defineComponent, onMounted, ref, toRefs, watch, computed } from 'vue'
import {
  NDataTable,
  NPagination,
  NSpace,
  NCard,
  NInput
} from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useColumns } from './use-columns'
import { useTable } from './use-table'
import { datasourceList } from '@/service/data-source'
import SourceModal from '../components/source-modal'
import STabs from '@/components/tabs'
import { Plus, Settings, Upload, Globe, Folder, Database } from 'lucide-vue-next'
import type { Ref } from 'vue'
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'

const CATEGORIES = [
  { key: 'industrial', label: '工业设备', color: '#D97B29', bg: '#FDF0E2', icon: Settings,
    pluginNames: ['OPCUA', 'S7', 'Modbus'] },
  { key: 'db', label: '数据库', color: '#2E6BE0', bg: '#E9F0FE', icon: Database,
    pluginNames: ['JDBC-Mysql', 'JDBC-Postgres', 'JDBC-Oracle', 'JDBC-SQLServer', 'JDBC-ClickHouse', 'JDBC-TiDB', 'JDBC-Db2', 'JDBC-Hive', 'JDBC-StarRocks', 'JDBC-Redshift', 'Hive', 'StarRocks', 'MySQL-CDC', 'SqlServer-CDC', 'Postgres-CDC'] },
  { key: 'mq', label: '消息队列', color: '#7B4FE0', bg: '#F1ECFD', icon: Upload,
    pluginNames: ['Kafka'] },
  { key: 'api', label: '接口服务', color: '#1DA7B4', bg: '#E4F6F7', icon: Globe,
    pluginNames: ['Http', 'ElasticSearch'] },
  { key: 'file', label: '文件', color: '#4C9A5B', bg: '#EAF6EC', icon: Folder,
    pluginNames: ['S3', 'FTP', 'SFTP'] },
]

const PLUGIN_DISPLAY: Record<string, string> = {
  'OPCUA': 'OPC UA', 'S7': 'Siemens S7', 'Modbus': 'Modbus',
  'JDBC-Mysql': 'MySQL', 'JDBC-Postgres': 'PostgreSQL', 'JDBC-Oracle': 'Oracle',
  'JDBC-SQLServer': 'SQL Server', 'JDBC-ClickHouse': 'ClickHouse', 'JDBC-TiDB': 'TiDB',
  'JDBC-Db2': 'Db2', 'JDBC-Hive': 'Hive', 'JDBC-StarRocks': 'StarRocks',
  'JDBC-Redshift': 'Redshift', 'Hive': 'Hive', 'StarRocks': 'StarRocks',
  'MySQL-CDC': 'MySQL CDC', 'SqlServer-CDC': 'SQL Server CDC', 'Postgres-CDC': 'PostgreSQL CDC',
  'Kafka': 'Kafka', 'ElasticSearch': 'Elasticsearch', 'S3': 'Amazon S3', 'Http': 'HTTP',
  'FakeSource': 'FakeSource', 'Console': 'Console', 'FTP': 'FTP', 'SFTP': 'SFTP',
}

const PLUGIN_CATEGORY: Record<string, string> = {}
for (const cat of CATEGORIES) {
  for (const pn of cat.pluginNames) {
    PLUGIN_CATEGORY[pn] = cat.key
  }
}

const CATEGORY_DESC: Record<string, string> = {
  industrial: '工业物联网采集类协议',
  db: '关系型数据库',
  mq: '中间件消息总线',
  api: '接口服务',
  file: '文件存储',
}

const DatasourceList = defineComponent({
  setup: function() {
    const { t } = useI18n()
    const showSourceModal = ref(false)
    const columns: Ref<TableColumns> = ref([])
    const router = useRouter()
    const route = useRoute()
    const { data, changePage, changePageSize, deleteRecord, updateList } = useTable()

    const categoryTab = ref('all')
    const searchQuery = ref('')
    const allDatasources = ref<any[]>([])

    const loadAllDatasources = async () => {
      try {
        const res = await datasourceList({ pageNo: 1, pageSize: 999, searchVal: '', pluginName: '' })
        allDatasources.value = res?.data || []
      } catch {}
    }

    const categoryStats = computed(() => {
      const list = allDatasources.value.length > 0 ? allDatasources.value : (data.list || [])
      const pluginGroups: Record<string, number> = {}
      for (const item of list as any[]) {
        const pn = item.pluginName || 'Other'
        pluginGroups[pn] = (pluginGroups[pn] || 0) + 1
      }

      return CATEGORIES.map(cat => {
        const items = cat.pluginNames
          .map(pn => ({
            pluginName: pn,
            displayName: PLUGIN_DISPLAY[pn] || pn,
            count: pluginGroups[pn] || 0,
          }))
        const uniqueTypes = items.length
        const totalConnections = items.reduce((sum, i) => sum + i.count, 0)
        return { ...cat, items, uniqueTypes, totalConnections }
      })
    })

    const filteredByCategory = computed(() => {
      if (categoryTab.value === 'all') return categoryStats.value
      return categoryStats.value.filter(c => c.key === categoryTab.value)
    })

    const searched = computed(() => {
      const q = searchQuery.value.toLowerCase()
      if (!q) return filteredByCategory.value
      return filteredByCategory.value.map(cat => ({
        ...cat,
        items: cat.items.filter(i => i.displayName.toLowerCase().includes(q) || i.pluginName.toLowerCase().includes(q)),
      })).filter(cat => cat.items.length > 0)
    })

    const handleSearch = () => {
      tablePage.value = 1
    }

    const handleTableSearch = (val: string) => {
      searchQuery.value = val
      tablePage.value = 1
    }

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') handleSearch()
    }

    const { getColumns } = useColumns((id: string, type: 'edit' | 'delete') => {
      if (type === 'edit') {
        router.push({ name: 'datasource-edit', params: { id } })
      } else if (type === 'delete') {
        deleteRecord(id)
      }
    })

    const onCreate = () => { showSourceModal.value = true }
    const closeSourceModal = () => { showSourceModal.value = false }
    const handleSelectSourceType = (value: string) => {
      router.push({ name: 'datasource-create', query: { type: value } })
      closeSourceModal()
    }
    const handleCardClick = (pluginName: string) => {
      router.push({ name: 'datasource-create', query: { type: pluginName } })
    }

    // Tab配置
    const tabOptions = computed(() => {
      const allTab = { name: 'all', label: '全部', count: allDatasources.value.length }
      const catTabs = categoryStats.value.map(cat => ({
        name: cat.key,
        label: cat.label,
        count: cat.uniqueTypes
      }))
      return [allTab, ...catTabs]
    })

    const tablePage = ref(1)
    const tablePageSize = ref(10)

    const tableFiltered = computed(() => {
      const allPluginNames = categoryTab.value === 'all'
        ? null
        : CATEGORIES.find(c => c.key === categoryTab.value)?.pluginNames || []
      return allDatasources.value.filter((item: any) => {
        if (allPluginNames && !allPluginNames.includes(item.pluginName)) return false
        const q = searchQuery.value.toLowerCase()
        if (q && !item.displayName?.toLowerCase().includes(q) && !item.pluginName?.toLowerCase().includes(q) && !item.datasourceName?.toLowerCase().includes(q)) return false
        return true
      })
    })

    const tableItemCount = computed(() => tableFiltered.value.length)
    const tableList = computed(() => {
      const start = (tablePage.value - 1) * tablePageSize.value
      return tableFiltered.value.slice(start, start + tablePageSize.value)
    })

    const handleTablePageChange = (page: number) => { tablePage.value = page }
    const handleTablePageSizeChange = (pageSize: number) => { tablePage.value = 1; tablePageSize.value = pageSize }

    const handleTabChange = (val: string) => { categoryTab.value = val; tablePage.value = 1 }

    const initSearch = () => {
      const { searchVal } = route.query
      if (searchVal) data.searchVal = searchVal as string
    }

    onMounted(() => {
      initSearch()
      if (!route.query.tab || route.query.tab === 'datasource') {
        changePage(1)
        columns.value = getColumns()
        loadAllDatasources()
      }
    })

    watch(useI18n().locale, () => {
      columns.value = getColumns()
    })

    return {
      t, showSourceModal, columns, ...toRefs(data),
      categoryTab, searchQuery, categoryStats, filteredByCategory, searched,
      changePage, changePageSize, onCreate, handleSearch, handleKeyup,
      handleSelectSourceType, handleCardClick, closeSourceModal, tabOptions,
      handleTabChange,
      tablePage, tablePageSize, tableItemCount, tableList,
      handleTablePageChange, handleTablePageSizeChange, handleTableSearch,
    }
  },
  render() {
    const {
      t, showSourceModal, columns, list, page, pageSize, itemCount,
      onCreate, handleSelectSourceType, handleCardClick, closeSourceModal,
      categoryTab, searchQuery, searched, changePage, changePageSize, tabOptions,
      handleTabChange,
      tablePage, tablePageSize, tableItemCount, tableList,
      handleTablePageChange, handleTablePageSizeChange, handleTableSearch,
    } = this

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          {/* Page title with action button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                {t('menu.datasource')}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                管理数据源连接与配置
              </p>
            </div>
            <button
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
              onClick={onCreate}
            >
              <Plus size={18} />
              新建数据源
            </button>
          </div>

        {/* Category tabs */}
        <div style={{ marginBottom: '4px' }}>
          <STabs
            value={categoryTab}
            onUpdate:value={handleTabChange}
            tabs={tabOptions}
          />
        </div>

        {/* Category cards */}
        <div class="space-y-tide-gap-lg">
          {searched.map(cat => (
            <div
              key={cat.key}
              class="bg-tide-surface-container-lowest border border-tide-outline-variant rounded-tide-xl p-tide-gap-lg relative overflow-hidden group hover:border-tide-primary/30 transition-colors"
            >
              <div
                class="absolute top-0 right-0 w-40 h-40 rounded-bl-full -mr-20 -mt-20 transition-transform group-hover:scale-110"
                style={{ backgroundColor: cat.color + '12' }}
              />
              <div class="relative z-10">
                {/* Section header */}
                <div class="flex items-center gap-2 mb-tide-gap-md">
                  <span class="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span class="font-tide-label-md text-tide-label-md text-tide-on-surface-variant">{cat.label}</span>
                  <span class="ml-auto font-tide-mono-data text-tide-mono-data px-2 py-0.5 rounded" style={{ backgroundColor: cat.color + '15', color: cat.color }}>
                    {cat.totalConnections} 个连接
                  </span>
                </div>

                {/* Card grid */}
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-tide-gap-md">
                  {cat.items.length > 0 ? cat.items.map(item => (
                    <div
                      key={item.pluginName}
                      class="bg-tide-surface-container-lowest border border-tide-outline-variant rounded-tide-xl p-tide-gap-md cursor-pointer hover:-translate-y-0.5 hover:border-tide-primary hover:shadow-tide-card transition-all duration-fast flex items-center gap-tide-gap-sm"
                      onClick={() => handleCardClick(item.pluginName)}
                    >
                      <div
                        class="w-10 h-10 rounded-tide-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <cat.icon size={20} />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-tide-label-md text-tide-label-md text-tide-on-surface truncate">{item.displayName}</div>
                        <div class="font-tide-body-sm text-tide-body-sm text-tide-on-surface-variant">
                          {item.count > 0 ? `${item.count} 个连接` : '暂无连接'}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div class="col-span-full py-8 text-center font-tide-body-sm text-tide-body-sm text-tide-on-surface-variant">
                      暂无匹配的数据源
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {searched.length === 0 && (
            <div class="flex items-center justify-center py-16 text-tide-on-surface-variant">
              <span class="font-tide-body-sm text-tide-body-sm">暂无匹配的数据源</span>
            </div>
          )}
        </div>

        {/* Data table with search */}
        <NCard>
          <NSpace justify='end' style={{ marginBottom: '16px' }}>
            <NInput
              value={searchQuery}
              onUpdate:value={handleTableSearch}
              clearable
              placeholder="搜索数据源名称"
              style={{ width: '200px' }}
            />
          </NSpace>
          <NDataTable
            row-class-name='data-source-items'
            columns={columns}
            data={tableList}
          />
          <NSpace justify='center' style={{ marginTop: '16px' }}>
            <NPagination
              page={tablePage}
              page-size={tablePageSize}
              item-count={tableItemCount}
              show-quick-jumper
              show-size-picker
              page-sizes={[10, 30, 50]}
              on-update:page={handleTablePageChange}
              on-update:page-size={handleTablePageSizeChange}
            />
          </NSpace>
        </NCard>

        <SourceModal
          show={showSourceModal}
          onChange={handleSelectSourceType}
          onCancel={closeSourceModal}
        />
      </div>
    )
  }
})
export default DatasourceList
