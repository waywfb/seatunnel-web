import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import {
  discoverTags, importTags, refreshTags,
  getTagList, deleteTag, datasourceDetail
} from '@/service/data-source'

const PLC_TYPES = ['OPCUA', 'S7', 'Modbus', 'Plc4x']

function isLeafNode(node: any): boolean {
  return node.leaf === true
}

export default defineComponent({
  props: {
    datasourceId: { type: String, required: true },
    pluginName: { type: String, default: '' }
  },
  setup(props) {
    const { t } = useI18n()
    const message = useMessage()
    const loading = ref(false)

    const dsHost = ref('localhost')
    const dsPort = ref('')

    const loadDsDetail = async (id: string) => {
      try {
        const res = await datasourceDetail(id)
        const params = res?.datasourceConfig || res?.params || {}
        dsHost.value = params.host || 'localhost'
        dsPort.value = params.port || ''
      } catch (_) { }
    }

    watch(() => props.datasourceId, (val) => {
      if (val) loadDsDetail(val)
    }, { immediate: true })

    // Tree
    const treeRoot = ref<any[]>([])
    const checkedKeys = ref<Set<string>>(new Set())
    const treeLoading = ref(false)
    const nodeInfoMap = ref<Record<string, { displayName: string; tagAddress: string }>>({})
    const connectionId = ref('')

    // Tag List
    const tagList = ref<any[]>([])
    const searchQuery = ref('')
    const page = ref(1)
    const pageSize = 20

    const filteredTagList = computed(() => {
      const q = searchQuery.value.toLowerCase()
      if (!q) return tagList.value
      return tagList.value.filter((tag: any) =>
        (tag.tagName || '').toLowerCase().includes(q) ||
        (tag.tagAddress || '').toLowerCase().includes(q) ||
        (tag.nativeId || '').toLowerCase().includes(q)
      )
    })

    const totalPages = computed(() => Math.max(1, Math.ceil(filteredTagList.value.length / pageSize)))
    const pagedTagList = computed(() => {
      const start = (page.value - 1) * pageSize
      return filteredTagList.value.slice(start, start + pageSize)
    })

    const isPlcType = () => PLC_TYPES.includes(props.pluginName)

    // Discover OPC UA nodes
    const handleDiscover = async () => {
      if (!props.datasourceId) return
      treeLoading.value = true
      try {
        const port = dsPort.value || '49320'
        connectionId.value = `${props.pluginName.toLowerCase()}://${dsHost.value}:${port}`
        const result = await discoverTags({ connectionId: connectionId.value })
        treeRoot.value = buildTreeNodes(result?.nodes || [])
      } catch (err: any) {
        message.error(err.message || 'Discover failed')
      } finally {
        treeLoading.value = false
      }
    }

    const buildTreeNodes = (nodes: any[]): any[] => {
      return (nodes || []).map((node: any) => {
        const key = node.nativeId || node.address
        const leaf = isLeafNode(node)
        const label = node.displayName || node.nativeId
        nodeInfoMap.value[key] = {
          displayName: label,
          tagAddress: node.address || key
        }
        return {
          label,
          key,
          leaf,
          loaded: !leaf,
          expanded: false,
          loading: false,
          children: leaf ? [] : (
            node.children ? buildTreeNodes(node.children) : []
          )
        }
      })
    }

    const toggleTreeNode = async (node: any) => {
      if (node.leaf) return
      if (!node.expanded && !node.loaded) {
        if (!connectionId.value) return
        node.loading = true
        try {
          const result = await discoverTags({ connectionId: connectionId.value, parentNodeId: node.key, limit: 200 })
          node.children = buildTreeNodes(result?.nodes || [])
          node.loaded = true
        } catch (err: any) {
          message.error('Failed to load children: ' + (err.message || ''))
          node.children = []
          node.loaded = true
        } finally {
          node.loading = false
        }
      }
      node.expanded = !node.expanded
    }

    const toggleCheck = (key: string) => {
      const next = new Set(checkedKeys.value)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      checkedKeys.value = next
    }

    // Import
    const handleImportSelected = async () => {
      if (checkedKeys.value.size === 0) {
        message.warning('请先选择要导入的测点')
        return
      }
      loading.value = true
      try {
        const keys = Array.from(checkedKeys.value)
        await importTags(props.datasourceId, {
          tags: keys.map((key: string) => {
            const info = nodeInfoMap.value[key]
            return {
              nativeId: key,
              tagAddress: info?.tagAddress || key,
              tagName: info?.displayName || key,
              source: 'browse'
            }
          })
        })
        message.success('导入成功')
        loadTagList()
        checkedKeys.value = new Set()
      } catch (err: any) {
        message.error(err.message || '导入失败')
      } finally {
        loading.value = false
      }
    }

    const handleRefresh = async () => {
      if (!props.datasourceId) return
      syncRunning.value = true
      try {
        await refreshTags(props.datasourceId)
        message.success(t('datasource.refresh') + ' 已触发')
      } catch (err: any) {
        message.error(err.message || 'Refresh failed')
      } finally {
        syncRunning.value = false
      }
    }

    const loadTagList = async () => {
      if (!props.datasourceId) return
      try {
        const result = await getTagList(props.datasourceId)
        tagList.value = result || []
        page.value = 1
      } catch (_) { }
    }

    const handleDeleteTag = async (tagId: string) => {
      try {
        await deleteTag(tagId)
        message.success('已删除')
        loadTagList()
      } catch (err: any) {
        message.error(err.message || '删除失败')
      }
    }

    const syncRunning = ref(false)

    onMounted(() => {
      if (props.datasourceId && isPlcType()) loadTagList()
    })

    // ---- Tree renderer ----
    const renderTreeIcon = (node: any, expanded: boolean) => {
      if (node.leaf) return 'contract_edit'
      if (node.key?.includes('Objects') || treeRoot.value.length <= 3 && node === treeRoot.value.find((n: any) => n.key?.includes('Objects')))
        return 'dns'
      return expanded ? 'folder_open' : 'folder'
    }

    const treeIconColor = (node: any) => {
      if (node.leaf) return 'text-tide-outline'
      if (node.key?.includes('Objects') || node.key?.includes('KJCD') || node.key?.includes('DeviceSet'))
        return 'text-tide-status-warning'
      return 'text-tide-data-db'
    }

    const renderTreeNode = (node: any, depth = 0) => {
      const checked = checkedKeys.value.has(node.key)
      const hasChildren = !node.leaf && (node.children.length > 0 || !node.loaded)
      return (
        <li key={node.key}>
          <div
            class={[
              'flex items-center p-1 rounded-tide cursor-pointer transition-colors group',
              depth === 0 ? 'font-medium text-tide-on-surface' : 'text-tide-on-surface',
              node.expanded ? 'bg-tide-surface-container-low' : 'hover:bg-tide-surface-container'
            ].join(' ')}
            onClick={() => toggleTreeNode(node)}
          >
            {/* Expand/collapse */}
            {hasChildren ? (
              <span class="material-symbols-outlined text-[18px] text-tide-outline mr-1 transition-transform">
                {node.loading ? 'sync' : node.expanded ? 'expand_more' : 'chevron_right'}
              </span>
            ) : (
              <span class="w-[26px] inline-block"></span>
            )}
            {/* Type icon */}
            <span
              class={`material-symbols-outlined text-[18px] mr-2 ${treeIconColor(node)}`}
            >
              {renderTreeIcon(node, node.expanded)}
            </span>
            {/* Label */}
            <span class="flex-1 text-tide-body-sm">{node.label}</span>
            {/* Checkbox */}
            <span
              class={`w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
                checked
                  ? 'bg-tide-primary border-tide-primary text-tide-on-primary'
                  : 'border-tide-outline-variant hover:border-tide-primary bg-white'
              }`}
              onClick={(e: MouseEvent) => { e.stopPropagation(); toggleCheck(node.key) }}
            >
              {checked && (
                <span class="material-symbols-outlined text-[12px]">check</span>
              )}
            </span>
          </div>
          {/* Children */}
          {node.expanded && node.children && node.children.length > 0 && (
            <ul class="pl-6 mt-1 space-y-1 relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-tide-outline-variant/30">
              {node.children.map((child: any) => renderTreeNode(child, depth + 1))}
            </ul>
          )}
        </li>
      )
    }

    // ---- Data type badge color ----
    const typeBadge = (type?: string) => {
      const t = (type || '').toLowerCase()
      if (t.includes('int') || t.includes('uint') || t.includes('short') || t.includes('byte'))
        return { bg: 'bg-tide-data-db/10', text: 'text-tide-data-db', border: 'border-tide-data-db/20', label: t }
      if (t.includes('float') || t.includes('double'))
        return { bg: 'bg-tide-data-api/10', text: 'text-tide-data-api', border: 'border-tide-data-api/20', label: t }
      if (t.includes('bool'))
        return { bg: 'bg-tide-data-mq/10', text: 'text-tide-data-mq', border: 'border-tide-data-mq/20', label: t }
      if (t.includes('string') || t.includes('char'))
        return { bg: 'bg-tide-status-warning/10', text: 'text-tide-status-warning', border: 'border-tide-status-warning/20', label: t }
      return { bg: 'bg-tide-outline/10', text: 'text-tide-outline', border: 'border-tide-outline/20', label: type || 'Float' }
    }

    return () => {
      if (!isPlcType()) return null

      const selCount = checkedKeys.value.size

      return (
        <div class="flex flex-col gap-tide-gap-lg h-full p-tide-container-padding overflow-hidden">
          {/* Breadcrumbs & Header */}
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-tide-gap-md flex-shrink-0">
            <div>
              <nav class="flex text-tide-on-surface-variant font-tide-body-sm text-tide-body-sm mb-tide-gap-xs">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                  <li class="inline-flex items-center">
                    <a class="inline-flex items-center hover:text-tide-primary transition-colors cursor-pointer">
                      数据源
                    </a>
                  </li>
                  <li>
                    <div class="flex items-center">
                      <span class="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
                      <span class="text-tide-on-surface">{props.pluginName}</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h2 class="font-tide-headline-lg text-tide-headline-lg text-tide-on-surface">测点管理</h2>
            </div>
            <div class="flex items-center gap-tide-gap-md">
              <button
                class="bg-tide-surface-container-lowest text-tide-on-surface border border-tide-outline-variant px-tide-gap-md py-1.5 rounded-tide hover:bg-tide-surface-container-low hover:border-tide-primary transition-colors font-tide-label-md text-tide-label-md flex items-center gap-tide-gap-sm disabled:opacity-50"
                onClick={handleDiscover}
                disabled={treeLoading.value}
              >
                <span class="material-symbols-outlined text-[18px]">travel_explore</span>
                浏览节点
              </button>
              <button
                class="bg-tide-primary text-tide-on-primary px-tide-gap-md py-1.5 rounded-tide hover:bg-tide-primary-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-tide-gap-sm disabled:opacity-50 shadow-none"
                onClick={handleImportSelected}
                disabled={selCount === 0 || loading.value}
              >
                <span class="material-symbols-outlined text-[18px]">download</span>
                导入选中 ({selCount})
              </button>
              <button
                class="bg-tide-surface-container-lowest text-tide-on-surface border border-tide-outline-variant px-tide-gap-md py-1.5 rounded-tide hover:bg-tide-surface-container-low hover:border-tide-primary transition-colors font-tide-label-md text-tide-label-md flex items-center gap-tide-gap-sm disabled:opacity-50"
                onClick={handleRefresh}
                disabled={syncRunning.value}
              >
                <span class="material-symbols-outlined text-[18px]">sync</span>
                {t('datasource.refresh')}
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div class="flex flex-col lg:flex-row gap-tide-gap-lg flex-1 min-h-0 overflow-hidden">
            {/* Left: Device Tree */}
            <div class="lg:w-1/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col shadow-none hover:shadow-md transition-shadow hover:border-tide-primary-fixed-dim/50 overflow-hidden">
              <div class="p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex justify-between items-center group-hover/tree:bg-tide-surface-container-low transition-colors">
                <h3 class="font-tide-label-md text-tide-label-md text-tide-on-surface">设备层级</h3>
                <button class="text-tide-outline hover:text-tide-primary transition-colors">
                  <span class="material-symbols-outlined text-[18px]">filter_list</span>
                </button>
              </div>
              <div class="p-tide-gap-sm flex-1 overflow-y-auto">
                {treeLoading.value ? (
                  <div class="flex items-center justify-center py-8 text-tide-outline">
                    <span class="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
                    <span class="font-tide-body-sm">加载中...</span>
                  </div>
                ) : treeRoot.value.length > 0 ? (
                  <ul class="font-tide-body-sm text-tide-body-sm text-tide-on-surface space-y-1">
                    {treeRoot.value.map((node: any) => renderTreeNode(node, 0))}
                  </ul>
                ) : (
                  <div class="py-8 text-center text-sm text-tide-outline">
                    <span class="material-symbols-outlined text-[32px] block mx-auto mb-2">folder_off</span>
                    <span class="font-tide-body-sm">点击"浏览节点"展开设备树</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Tag List */}
            <div class="lg:w-3/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col shadow-none hover:shadow-md transition-shadow hover:border-tide-primary-fixed-dim/50 overflow-hidden">
              {/* Toolbar */}
              <div class="p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex justify-between items-center gap-tide-gap-md flex-wrap">
                <div class="relative max-w-sm flex-1 min-w-[200px]">
                  <span class="material-symbols-outlined absolute left-tide-gap-sm top-1/2 -translate-y-1/2 text-tide-outline text-[18px]">search</span>
                  <input
                    class="w-full pl-8 pr-3 py-1.5 bg-tide-surface-container-lowest border border-tide-outline-variant rounded-tide font-tide-body-sm text-tide-body-sm text-tide-on-surface focus:outline-none focus:border-tide-primary focus:ring-1 focus:ring-tide-primary/20 transition-all placeholder:text-tide-outline"
                    placeholder="按编码或名称搜索..."
                    value={searchQuery.value}
                    onInput={(e: any) => { searchQuery.value = e.target.value; page.value = 1 }}
                  />
                </div>
                <div class="flex items-center gap-tide-gap-sm">
                  <button class="bg-tide-surface-container-lowest text-tide-on-surface border border-tide-outline-variant px-tide-gap-md py-1 rounded-tide hover:bg-tide-surface-container-low transition-colors font-tide-body-sm text-tide-body-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">filter_alt</span>
                    筛选
                  </button>
                  <button class="bg-tide-surface-container-lowest text-tide-on-surface border border-tide-outline-variant px-tide-gap-sm py-1 rounded-tide hover:bg-tide-surface-container-low transition-colors">
                    <span class="material-symbols-outlined text-[18px]">view_column</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div class="flex-1 overflow-auto bg-tide-surface-container-lowest">
                <table class="w-full text-left border-collapse">
                  <thead class="sticky top-0 bg-tide-surface-bright border-b border-tide-outline-variant font-tide-label-caps text-tide-label-caps text-tide-on-surface uppercase tracking-wider z-10">
                    <tr>
                      <th class="p-tide-gap-sm pl-tide-gap-md font-bold">
                        <div class="flex items-center gap-1 cursor-pointer hover:text-tide-primary">
                          点位编号
                          <span class="material-symbols-outlined text-[14px]">arrow_upward</span>
                        </div>
                      </th>
                      <th class="p-tide-gap-sm font-bold">名称</th>
                      <th class="p-tide-gap-sm font-bold">数据类型</th>
                      <th class="p-tide-gap-sm font-bold">地址</th>
                      <th class="p-tide-gap-sm font-bold">状态</th>
                      <th class="p-tide-gap-sm pr-tide-gap-md font-bold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody class="font-tide-body-sm text-tide-body-sm text-tide-on-surface divide-y divide-tide-outline-variant/30">
                    {pagedTagList.value.length === 0 ? (
                      <tr>
                        <td colspan="6" class="p-8 text-center text-tide-outline font-tide-body-sm">
                          <span class="material-symbols-outlined text-[32px] block mx-auto mb-2">database_off</span>
                          暂无测点数据
                        </td>
                      </tr>
                    ) : (
                      pagedTagList.value.map((row: any) => {
                        const badge = typeBadge(row.dataType)
                        return (
                          <tr class="hover:bg-tide-surface-container-low transition-colors group/row">
                            <td class="p-tide-gap-sm pl-tide-gap-md font-tide-mono-data text-tide-mono-data text-tide-on-surface-variant">
                              {row.nativeId || '-'}
                            </td>
                            <td class="p-tide-gap-sm font-medium">{row.tagName || '-'}</td>
                            <td class="p-tide-gap-sm">
                              <span class={`inline-flex items-center px-2 py-0.5 rounded-tide text-[11px] font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td class="p-tide-gap-sm text-tide-on-surface-variant font-tide-mono-data text-tide-mono-data">
                              {row.tagAddress || '-'}
                            </td>
                            <td class="p-tide-gap-sm">
                              <div class="flex items-center gap-2">
                                <span class="relative flex h-2 w-2">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tide-status-running opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-2 w-2 bg-tide-status-running"></span>
                                </span>
                                <span class="text-tide-status-running font-medium">在线</span>
                              </div>
                            </td>
                            <td class="p-tide-gap-sm pr-tide-gap-md text-right">
                              <div class="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button
                                  class="p-1 rounded-tide text-tide-outline hover:text-tide-primary hover:bg-tide-surface-container transition-colors flex items-center justify-center w-8 h-8"
                                  title={t('datasource.delete')}
                                  onClick={() => handleDeleteTag(row.id)}
                                >
                                  <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredTagList.value.length > 0 && (
                <div class="p-tide-gap-sm px-tide-gap-md border-t border-tide-outline-variant bg-tide-surface flex justify-between items-center text-tide-on-surface-variant font-tide-body-sm text-tide-body-sm">
                  <div>
                    显示 {(page.value - 1) * pageSize + 1} 至 {Math.min(page.value * pageSize, filteredTagList.value.length)} 条，共 {filteredTagList.value.length} 个测点
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      class="p-1 rounded-tide text-tide-outline hover:bg-tide-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={page.value <= 1}
                      onClick={() => { if (page.value > 1) page.value-- }}
                    >
                      <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages.value }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages.value || Math.abs(p - page.value) <= 1)
                      .map((p, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span class="text-tide-outline">...</span>
                          )}
                          <button
                            class={`px-2 py-0.5 rounded-tide font-medium transition-colors ${
                              p === page.value
                                ? 'bg-tide-surface-container-low text-tide-on-surface'
                                : 'text-tide-outline hover:bg-tide-surface-container hover:text-tide-on-surface'
                            }`}
                            onClick={() => { page.value = p }}
                          >
                            {p}
                          </button>
                        </>
                      ))}
                    <button
                      class="p-1 rounded-tide text-tide-outline hover:bg-tide-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={page.value >= totalPages.value}
                      onClick={() => { if (page.value < totalPages.value) page.value++ }}
                    >
                      <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
  }
})
