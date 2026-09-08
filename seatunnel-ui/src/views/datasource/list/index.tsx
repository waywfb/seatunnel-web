import { defineComponent, onMounted, ref, toRefs, watch, computed } from 'vue'
import {
  NDataTable,
  NPagination,
  NSpace,
  NCard,
  NInput,
  NEmpty,
  NButton,
  NPopover,
  NModal
} from 'naive-ui'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useColumns } from './use-columns'
import { useTable } from './use-table'
import { datasourceList } from '@/service/data-source'
import DatasourceWizardModal from '../wizard/datasource-wizard-modal'
import ConnectionDrawer from './ConnectionDrawer'
import {
  Plus,
  Settings,
  Upload,
  Globe,
  Folder,
  Database,
  ChevronRight,
  Pencil,
  Trash2,
  Plug,
  Eye,
  LayoutGrid,
  List,
  Search
} from 'lucide-vue-next'
import type { Ref } from 'vue'
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'

const CATEGORIES = [
  {
    key: 'industrial',
    label: '工业设备',
    color: '#D97B29',
    bg: '#FDF0E2',
    icon: Settings,
    dotClass: 'bg-amber-500',
    pluginNames: ['OPCUA', 'S7', 'Modbus']
  },
  {
    key: 'db',
    label: '数据库',
    color: '#2E6BE0',
    bg: '#E9F0FE',
    icon: Database,
    dotClass: 'bg-blue-500',
    pluginNames: [
      'JDBC-Mysql',
      'JDBC-Postgres',
      'JDBC-Oracle',
      'JDBC-SQLServer',
      'JDBC-ClickHouse',
      'JDBC-TiDB',
      'JDBC-Db2',
      'JDBC-Hive',
      'JDBC-StarRocks',
      'JDBC-Redshift',
      'Hive',
      'StarRocks',
      'MySQL-CDC',
      'SqlServer-CDC',
      'Postgres-CDC'
    ]
  },
  {
    key: 'mq',
    label: '消息队列',
    color: '#7B4FE0',
    bg: '#F1ECFD',
    icon: Upload,
    dotClass: 'bg-purple-500',
    pluginNames: ['Kafka']
  },
  {
    key: 'api',
    label: '接口服务',
    color: '#1DA7B4',
    bg: '#E4F6F7',
    icon: Globe,
    dotClass: 'bg-emerald-500',
    pluginNames: ['Http', 'ElasticSearch']
  },
  {
    key: 'file',
    label: '文件',
    color: '#4C9A5B',
    bg: '#EAF6EC',
    icon: Folder,
    dotClass: 'bg-green-500',
    pluginNames: ['S3', 'FTP', 'SFTP']
  }
]

const PLUGIN_DISPLAY: Record<string, string> = {
  OPCUA: 'OPC UA',
  S7: 'Siemens S7',
  Modbus: 'Modbus',
  'JDBC-Mysql': 'MySQL',
  'JDBC-Postgres': 'PostgreSQL',
  'JDBC-Oracle': 'Oracle',
  'JDBC-SQLServer': 'SQL Server',
  'JDBC-ClickHouse': 'ClickHouse',
  'JDBC-TiDB': 'TiDB',
  'JDBC-Db2': 'Db2',
  'JDBC-Hive': 'Hive',
  'JDBC-StarRocks': 'StarRocks',
  'JDBC-Redshift': 'Redshift',
  Hive: 'Hive',
  StarRocks: 'StarRocks',
  'MySQL-CDC': 'MySQL CDC',
  'SqlServer-CDC': 'SQL Server CDC',
  'Postgres-CDC': 'PostgreSQL CDC',
  Kafka: 'Kafka',
  ElasticSearch: 'Elasticsearch',
  S3: 'Amazon S3',
  Http: 'HTTP',
  FakeSource: 'FakeSource',
  Console: 'Console',
  FTP: 'FTP',
  SFTP: 'SFTP'
}

const PLUGIN_BG: Record<string, string> = {
  OPCUA: 'bg-amber-50 text-amber-600',
  S7: 'bg-amber-50 text-amber-600',
  Modbus: 'bg-amber-50 text-amber-600',
  'JDBC-Mysql': 'bg-blue-50 text-blue-600',
  'JDBC-Postgres': 'bg-blue-50 text-blue-600',
  'JDBC-Oracle': 'bg-blue-50 text-blue-600',
  'JDBC-SQLServer': 'bg-blue-50 text-blue-600',
  'JDBC-ClickHouse': 'bg-blue-50 text-blue-600',
  'JDBC-TiDB': 'bg-blue-50 text-blue-600',
  'JDBC-Db2': 'bg-blue-50 text-blue-600',
  'JDBC-Hive': 'bg-blue-50 text-blue-600',
  'JDBC-StarRocks': 'bg-blue-50 text-blue-600',
  'JDBC-Redshift': 'bg-blue-50 text-blue-600',
  Hive: 'bg-blue-50 text-blue-600',
  StarRocks: 'bg-blue-50 text-blue-600',
  'MySQL-CDC': 'bg-blue-50 text-blue-600',
  'SqlServer-CDC': 'bg-blue-50 text-blue-600',
  'Postgres-CDC': 'bg-blue-50 text-blue-600',
  Kafka: 'bg-purple-50 text-purple-600',
  ElasticSearch: 'bg-emerald-50 text-emerald-600',
  S3: 'bg-green-50 text-green-600',
  Http: 'bg-emerald-50 text-emerald-600',
  FTP: 'bg-green-50 text-green-600',
  SFTP: 'bg-green-50 text-green-600'
}

const DatasourceList = defineComponent({
  setup: function () {
    const { t } = useI18n()
    const wizardOpen = ref(false)
    const wizardEditId = ref<number | string | null>(null)
    const wizardInitialType = ref('')
    const wizardAutoTest = ref(false)
    const showDrawer = ref(false)
    const drawerPlugin = ref<{
      pluginName: string
      displayName: string
      color: string
    }>({
      pluginName: '',
      displayName: '',
      color: '#6B7280'
    })
    const columns: Ref<TableColumns> = ref([])
    const route = useRoute()
    const { data, changePage, changePageSize, deleteRecord, updateList } =
      useTable()

    const currentTab = ref<'cards' | 'table'>('cards')
    const categoryTab = ref('all')
    const searchQuery = ref('')
    const tableSearch = ref('')
    const allDatasources = ref<any[]>([])
    const viewingTableParams = ref<any | null>(null)

    const loadAllDatasources = async () => {
      try {
        const res = await datasourceList({
          pageNo: 1,
          pageSize: 999,
          searchVal: '',
          pluginName: ''
        })
        allDatasources.value = res?.data || []
      } catch {}
    }

    const categoryStats = computed(() => {
      const list =
        allDatasources.value.length > 0 ? allDatasources.value : data.list || []
      const pluginGroups: Record<string, number> = {}
      for (const item of list as any[]) {
        const pn = item.pluginName || 'Other'
        pluginGroups[pn] = (pluginGroups[pn] || 0) + 1
      }

      return CATEGORIES.map((cat) => {
        const items = cat.pluginNames.map((pn) => ({
          pluginName: pn,
          displayName: PLUGIN_DISPLAY[pn] || pn,
          count: pluginGroups[pn] || 0
        }))
        const totalConnections = items.reduce((sum, i) => sum + i.count, 0)
        return { ...cat, items, totalConnections }
      })
    })

    const filteredByCategory = computed(() => {
      if (categoryTab.value === 'all') return categoryStats.value
      return categoryStats.value.filter((c) => c.key === categoryTab.value)
    })

    const searched = computed(() => {
      const q = searchQuery.value.toLowerCase()
      if (!q) return filteredByCategory.value
      return filteredByCategory.value
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (i) =>
              i.displayName.toLowerCase().includes(q) ||
              i.pluginName.toLowerCase().includes(q)
          )
        }))
        .filter((cat) => cat.items.length > 0)
    })

    const tableFiltered = computed(() => {
      const allPluginNames =
        categoryTab.value === 'all'
          ? null
          : CATEGORIES.find((c) => c.key === categoryTab.value)?.pluginNames ||
            []
      return allDatasources.value.filter((item: any) => {
        if (allPluginNames && !allPluginNames.includes(item.pluginName))
          return false
        const q = tableSearch.value.toLowerCase()
        if (
          q &&
          !item.displayName?.toLowerCase().includes(q) &&
          !item.pluginName?.toLowerCase().includes(q) &&
          !item.datasourceName?.toLowerCase().includes(q)
        )
          return false
        return true
      })
    })

    const tableItemCount = computed(() => tableFiltered.value.length)

    const tablePage = ref(1)
    const tablePageSize = ref(10)

    const tableList = computed(() => {
      const start = (tablePage.value - 1) * tablePageSize.value
      return tableFiltered.value.slice(start, start + tablePageSize.value)
    })

    const onCreate = () => {
      wizardEditId.value = null
      wizardInitialType.value = ''
      wizardAutoTest.value = false
      wizardOpen.value = true
    }

    const openEditWizard = (id: number | string) => {
      wizardEditId.value = id
      wizardInitialType.value = ''
      wizardAutoTest.value = false
      wizardOpen.value = true
    }

    const onCreateDatasource = (pluginName?: string) => {
      wizardEditId.value = null
      wizardInitialType.value = pluginName || ''
      wizardAutoTest.value = false
      wizardOpen.value = true
    }

    const onTestDatasource = (id: number | string) => {
      wizardEditId.value = id
      wizardInitialType.value = ''
      wizardAutoTest.value = true
      wizardOpen.value = true
    }

    const closeWizard = () => {
      wizardOpen.value = false
    }

    const onDrawerShowChange = (v: boolean) => {
      showDrawer.value = v
    }

    const handleCardClick = (
      pluginName: string,
      displayName: string,
      color: string
    ) => {
      drawerPlugin.value = { pluginName, displayName, color }
      showDrawer.value = true
    }

    const handleTabChange = (val: string) => {
      categoryTab.value = val
      tablePage.value = 1
    }

    const switchView = (val: 'cards' | 'table') => {
      currentTab.value = val
    }

    const handleTableSearch = (val: string) => {
      tableSearch.value = val
      tablePage.value = 1
    }

    const handleTablePageChange = (page: number) => {
      tablePage.value = page
    }

    const handleTablePageSizeChange = (pageSize: number) => {
      tablePage.value = 1
      tablePageSize.value = pageSize
    }

    const onTableEdit = (row: any) => {
      openEditWizard(row.id)
    }

    const onTableDelete = (row: any) => {
      deleteRecord(row.id)
    }

    const onTableTest = (row: any) => {
      onTestDatasource(row.id)
    }

    const openTableParams = (row: any) => {
      viewingTableParams.value = row
    }

    const closeTableParams = () => {
      viewingTableParams.value = null
    }

    const tabOptions = computed(() => {
      const allTab = {
        name: 'all',
        label: '全部',
        count: allDatasources.value.length
      }
      const catTabs = categoryStats.value.map((cat) => ({
        name: cat.key,
        label: cat.label,
        count: cat.totalConnections
      }))
      return [allTab, ...catTabs]
    })

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

    const { getColumns } = useColumns((id: string, type: 'edit' | 'delete') => {
      if (type === 'edit') {
        openEditWizard(id)
      } else if (type === 'delete') {
        deleteRecord(id)
      }
    })

    return {
      t,
      wizardOpen,
      wizardEditId,
      wizardInitialType,
      wizardAutoTest,
      showDrawer,
      drawerPlugin,
      columns,
      ...toRefs(data),
      currentTab,
      categoryTab,
      searchQuery,
      tableSearch,
      allDatasources,
      categoryStats,
      filteredByCategory,
      searched,
      changePage,
      changePageSize,
      onCreate,
      openEditWizard,
      onCreateDatasource,
      closeWizard,
      handleCardClick,
      onDrawerShowChange,
      tabOptions,
      handleTabChange,
      switchView,
      tablePage,
      tablePageSize,
      tableItemCount,
      tableList,
      handleTablePageChange,
      handleTablePageSizeChange,
      handleTableSearch,
      tableFiltered,
      onTableEdit,
      onTableDelete,
      onTableTest,
      onTestDatasource,
      viewingTableParams,
      openTableParams,
      closeTableParams
    }
  },
  render() {
    const {
      t,
      showDrawer,
      drawerPlugin,
      onDrawerShowChange,
      currentTab,
      categoryTab,
      searchQuery,
      tableSearch,
      searched,
      onCreate,
      onCreateDatasource,
      handleCardClick,
      openEditWizard,
      tabOptions,
      handleTabChange,
      switchView,
      tablePage,
      tablePageSize,
      tableItemCount,
      tableList,
      handleTablePageChange,
      handleTablePageSizeChange,
      handleTableSearch,
      allDatasources,
      categoryStats,
      onTableEdit,
      onTableDelete,
      onTableTest,
      viewingTableParams,
      openTableParams,
      closeTableParams,
      onTestDatasource,
      wizardOpen,
      wizardEditId,
      wizardInitialType,
      wizardAutoTest,
      closeWizard,
      loadAllDatasources,
      changePage
    } = this

    return (
      <div class='flex flex-col h-full'>
        {/* Page header */}
        <div class='flex items-center justify-between mb-4'>
          <div>
            <h2 class='text-xl font-bold text-slate-800'>
              {t('menu.datasource')}
            </h2>
            <p class='text-sm text-slate-500 mt-0.5'>管理数据源连接与配置</p>
          </div>
          <div class='flex items-center gap-3'>
            {/* View toggle */}
            <div class='bg-slate-100 p-1 rounded-lg flex items-center text-xs font-medium text-slate-600'>
              <button
                class={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  currentTab === 'cards'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : ''
                }`}
                onClick={() => switchView('cards')}
              >
                <LayoutGrid size={14} /> 卡片视图
              </button>
              <button
                class={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  currentTab === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : ''
                }`}
                onClick={() => switchView('table')}
              >
                <List size={14} /> 列表明细 ({allDatasources.length})
              </button>
            </div>
            <button
              class='bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-sm'
              onClick={onCreate}
            >
              <Plus size={16} /> 新建数据源
            </button>
          </div>
        </div>

        {/* Main content */}
        <main class='flex-1 overflow-y-auto bg-slate-50/70 rounded-xl p-6'>
          {/* Cards view */}
          {currentTab === 'cards' ? (
            <div class='space-y-8 max-w-7xl mx-auto'>
              {/* Category filter bar */}
              <div class='flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm'>
                <div class='flex items-center gap-2'>
                  <button
                    class={`px-4 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-2 ${
                      categoryTab === 'all'
                        ? 'bg-indigo-50 text-indigo-600 font-semibold border-indigo-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-transparent'
                    }`}
                    onClick={() => handleTabChange('all')}
                  >
                    <span>全部</span>
                    <span
                      class={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        categoryTab === 'all'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {allDatasources.length}
                    </span>
                  </button>
                  {categoryStats.map((cat) => (
                    <button
                      key={cat.key}
                      class={`px-4 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-2 ${
                        categoryTab === cat.key
                          ? 'bg-indigo-50 text-indigo-600 font-semibold border-indigo-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-transparent'
                      }`}
                      onClick={() => handleTabChange(cat.key)}
                    >
                      <span>{cat.label}</span>
                      <span
                        class={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          categoryTab === cat.key
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.totalConnections}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div class='relative w-64'>
                  <Search
                    size={14}
                    class='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                  />
                  <input
                    value={searchQuery}
                    onInput={(e: InputEvent) => {
                      searchQuery.value = (e.target as HTMLInputElement).value
                    }}
                    type='text'
                    placeholder='搜索协议/数据源名称...'
                    class='w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all'
                  />
                </div>
              </div>

              {/* Category sections */}
              {searched.map((cat) => (
                <div key={cat.key} class='space-y-3'>
                  <div class='flex items-center justify-between border-b border-slate-200 pb-2'>
                    <div class='flex items-center gap-2'>
                      <span
                        class={`w-2 h-2 rounded-full ${cat.dotClass}`}
                      />
                      <h2 class='text-sm font-bold text-slate-800'>
                        {cat.label}
                      </h2>
                    </div>
                    <span class='text-xs text-slate-400'>
                      {cat.items.length} 个支持类型
                    </span>
                  </div>

                  {/* Card grid */}
                  <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    {cat.items.map((item) => (
                      <div
                        key={item.pluginName}
                        class='group bg-white p-4 rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between'
                        onClick={() =>
                          handleCardClick(
                            item.pluginName,
                            item.displayName,
                            cat.color
                          )
                        }
                      >
                        <div class='flex items-center gap-4'>
                          <div
                            class={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${PLUGIN_BG[item.pluginName] || 'bg-slate-100 text-slate-600'}`}
                          >
                            <cat.icon size={20} />
                          </div>
                          <div class='flex-1 min-w-0'>
                            <div class='flex items-center justify-between'>
                              <h3 class='font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors'>
                                {item.displayName}
                              </h3>
                            </div>
                            <p class='text-xs text-slate-400 mt-0.5 truncate'>
                              {item.count > 0
                                ? `${item.count} 个已连接源`
                                : '暂无连接'}
                            </p>
                          </div>
                          <div class='text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all'>
                            <ChevronRight size={14} />
                          </div>
                        </div>

                        {/* Connection pills */}
                        {item.count > 0 ? (
                          <div class='mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap'>
                            <span class='text-[10px] text-slate-400 font-medium'>
                              已建:
                            </span>
                            <span class='px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono truncate max-w-[100px]'>
                              {item.count} 个
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {searched.length === 0 && (
                <div class='flex items-center justify-center py-16 text-slate-400'>
                  <span class='text-sm'>暂无匹配的数据源</span>
                </div>
              )}
            </div>
          ) : (
            /* Table view */
            <div class='bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden max-w-7xl mx-auto'>
              {/* Table toolbar */}
              <div class='p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50'>
                <div class='flex items-center gap-3'>
                  <h3 class='font-bold text-sm text-slate-800'>
                    数据源实例列表
                  </h3>
                  <span class='text-xs bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full font-medium'>
                    共 {tableItemCount} 条
                  </span>
                </div>
                <div class='relative w-64'>
                  <Search
                    size={14}
                    class='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                  />
                  <input
                    value={tableSearch}
                    onInput={(e: InputEvent) => {
                      handleTableSearch(
                        (e.target as HTMLInputElement).value
                      )
                    }}
                    type='text'
                    placeholder='搜索实例名称或类型...'
                    class='w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500'
                  />
                </div>
              </div>

              {/* Table */}
              <div class='overflow-x-auto'>
                <table class='w-full text-left border-collapse text-xs'>
                  <thead>
                    <tr class='bg-slate-100/70 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider'>
                      <th class='py-3 px-4 w-12 text-center'>#</th>
                      <th class='py-3 px-4'>源名称</th>
                      <th class='py-3 px-4'>源类型</th>
                      <th class='py-3 px-4'>配置参数</th>
                      <th class='py-3 px-4'>描述</th>
                      <th class='py-3 px-4'>创建人</th>
                      <th class='py-3 px-4'>修改人</th>
                      <th class='py-3 px-4'>更新时间</th>
                      <th class='py-3 px-4 text-center'>操作</th>
                    </tr>
                  </thead>
                  <tbody class='divide-y divide-slate-200/60 text-slate-700'>
                    {tableList.map((row: any, index: number) => (
                      <tr
                        key={row.id}
                        class='hover:bg-slate-50/80 transition-colors'
                      >
                        <td class='py-3.5 px-4 text-center text-slate-400 font-mono'>
                          {(tablePage - 1) * tablePageSize + index + 1}
                        </td>
                        <td class='py-3.5 px-4 font-bold text-slate-800'>
                          {row.datasourceName}
                        </td>
                        <td class='py-3.5 px-4'>
                          <span
                            class={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${PLUGIN_BG[row.pluginName] || 'bg-slate-100 text-slate-700'} font-medium`}
                          >
                            {PLUGIN_DISPLAY[row.pluginName] || row.pluginName}
                          </span>
                        </td>
                        <td class='py-3.5 px-4'>
                          <button
                            onClick={() => openTableParams(row)}
                            class='text-indigo-600 hover:text-indigo-700 font-medium underline cursor-pointer flex items-center gap-1'
                          >
                            <Eye size={10} /> 点击查看
                          </button>
                        </td>
                        <td class='py-3.5 px-4 text-slate-500 max-w-xs truncate'>
                          {row.description || '-'}
                        </td>
                        <td class='py-3.5 px-4 text-slate-500'>
                          {row.createUserName || '-'}
                        </td>
                        <td class='py-3.5 px-4 text-slate-500'>
                          {row.updateUserName || '-'}
                        </td>
                        <td class='py-3.5 px-4 text-slate-400 font-mono text-[11px]'>
                          {row.updateTime || '-'}
                        </td>
                        <td class='py-3.5 px-4 text-center'>
                          <div class='flex items-center justify-center gap-2'>
                            <button
                              title='测试连接'
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors flex items-center justify-center'
                              onClick={() => onTableTest(row)}
                            >
                              <Plug size={12} />
                            </button>
                            <button
                              title='编辑数据源'
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 transition-colors flex items-center justify-center'
                              onClick={() => onTableEdit(row)}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              title='删除'
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors flex items-center justify-center'
                              onClick={() => onTableDelete(row)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tableList.length === 0 && (
                      <tr>
                        <td
                          colspan={9}
                          class='py-12 text-center text-slate-400'
                        >
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div class='p-4 border-t border-slate-200/80 flex justify-center'>
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
              </div>
            </div>
          )}
        </main>

        <DatasourceWizardModal
          show={wizardOpen}
          editId={wizardEditId}
          initialType={wizardInitialType}
          autoTest={wizardAutoTest}
          onUpdate:show={(v: boolean) => (v ? undefined : closeWizard())}
          onSaved={() => {
            closeWizard()
            loadAllDatasources()
            changePage(1)
          }}
        />
        <ConnectionDrawer
          show={showDrawer}
          onUpdate:show={onDrawerShowChange}
          pluginName={drawerPlugin.pluginName}
          displayName={drawerPlugin.displayName}
          color={drawerPlugin.color}
          onEditDatasource={openEditWizard}
          onTestDatasource={onTestDatasource}
          onCreateDatasource={onCreateDatasource}
        />

        {/* View params modal (表格式查看配置明细，对标参考页) */}
        <NModal
          show={!!viewingTableParams}
          onUpdate:show={(v: boolean) => (v ? void 0 : closeTableParams())}
          preset='card'
          title='数据源参数明细'
          style={{ width: '520px' }}
        >
          <div class='space-y-2 text-xs'>
            <p>
              <strong class='text-slate-500'>名称:</strong>{' '}
              {viewingTableParams?.datasourceName}
            </p>
            <p>
              <strong class='text-slate-500'>类型:</strong>{' '}
              {viewingTableParams?.pluginName}
            </p>
            <p>
              <strong class='text-slate-500'>描述:</strong>{' '}
              {viewingTableParams?.description || '-'}
            </p>
            <p>
              <strong class='text-slate-500'>配置明细:</strong>
            </p>
            <pre class='bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-72 overflow-y-auto'>
              {JSON.stringify(viewingTableParams?.datasourceConfig, null, 2)}
            </pre>
          </div>
          {{
            footer: () => (
              <div class='flex items-center justify-between pt-2'>
                <NButton
                  type='primary'
                  onClick={() => {
                    if (viewingTableParams) onTableEdit(viewingTableParams)
                    closeTableParams()
                  }}
                >
                  编辑此数据源
                </NButton>
                <NButton onClick={closeTableParams}>关闭</NButton>
              </div>
            )
          }}
        </NModal>
      </div>
    )
  }
})

export default DatasourceList
