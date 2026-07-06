import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { datasourceDetail, refreshTags } from '@/service/data-source'
import { useBrowseStore } from './use-browse-store'
import { useTagImport } from './use-tag-import'
import { useTagTable } from './use-tag-table'
import { FolderList } from './FolderList'
import { BrowseTable } from './BrowseTable'
import { TagTable } from './TagTable'

const PLC_TYPES = ['OPCUA', 'S7', 'Modbus', 'Plc4x']

export default defineComponent({
  props: {
    datasourceId: { type: String, required: true },
    pluginName: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useI18n()
    const message = useMessage()

    const dsHost = ref('localhost')
    const dsPort = ref('49320')

    const loadDsDetail = async (id: string) => {
      try {
        const res = await datasourceDetail(id)
        const params = res?.datasourceConfig || res?.params || {}
        dsHost.value = params.host || 'localhost'
        dsPort.value = params.port || '49320'
      } catch {}
    }

    watch(() => props.datasourceId, val => { if (val) loadDsDetail(val) }, { immediate: true })

    const dsIdRef = () => props.datasourceId
    const browse = useBrowseStore()
    const tagImport = useTagImport(dsIdRef)
    const tagTable = useTagTable(dsIdRef)

    const selectedFolderId = ref<string | null>(null)
    const browseLoading = ref(false)
    const browseChildrenLoading = ref(false)

    const handleDiscover = async () => {
      if (!props.datasourceId) return
      browseLoading.value = true
      selectedFolderId.value = null
      try {
        const port = dsPort.value || '49320'
        const connId = `${props.pluginName.toLowerCase()}://${dsHost.value}:${port}`
        await browse.loadRoots(connId)
      } catch (err: any) {
        message.error(err.message || 'Discover failed')
      } finally {
        browseLoading.value = false
      }
    }

    const handleSelectFolder = async (nodeId: string) => {
      selectedFolderId.value = nodeId
      const node = browse.getNode(nodeId)
      if (node && !node.loadedOnce && !node.leaf) {
        browseChildrenLoading.value = true
        try {
          await browse.loadChildren(nodeId)
        } finally {
          browseChildrenLoading.value = false
        }
      }
    }

    const handleCheck = (nodeId: string) => {
      const node = browse.getNode(nodeId)
      if (node) tagImport.toggleCheck(node)
    }

    const handleImportSuccess = () => {
      message.success('导入成功')
      selectedFolderId.value = null
      tagTable.loadTagList()
    }

    const handleDeleteTag = async (tagId: string) => {
      try {
        await tagTable.handleDeleteTag(tagId)
        message.success('已删除')
      } catch (err: any) {
        message.error(err.message || '删除失败')
      }
    }

    const syncRunning = ref(false)
    const handleRefresh = async () => {
      if (!props.datasourceId) return
      syncRunning.value = true
      try {
        await refreshTags(props.datasourceId)
        message.success((t('datasource.refresh') || '同步') + ' 已触发')
      } catch (err: any) {
        message.error(err.message || 'Refresh failed')
      } finally {
        syncRunning.value = false
      }
    }

    onMounted(() => {
      if (props.datasourceId && PLC_TYPES.includes(props.pluginName)) {
        tagTable.loadTagList()
      }
    })

    const isPlcType = () => PLC_TYPES.includes(props.pluginName)
    const isBrowsing = computed(() => selectedFolderId.value !== null)

    const leafChildren = computed(() => {
      if (!selectedFolderId.value) return []
      return browse.getLeafChildren(selectedFolderId.value)
    })

    const browseNode = computed(() => {
      if (!selectedFolderId.value) return null
      return browse.getNode(selectedFolderId.value)
    })

    return () => {
      if (!isPlcType()) return null

      return (
        <div class="flex flex-col gap-tide-gap-lg h-[calc(100vh-200px)] p-tide-container-padding overflow-hidden">
          {/* Breadcrumbs & Header */}
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-tide-gap-md flex-shrink-0">
            <div>
              <nav class="flex text-tide-on-surface-variant font-tide-body-sm text-tide-body-sm mb-tide-gap-xs">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                  <li class="inline-flex items-center">
                    <a class="inline-flex items-center hover:text-tide-primary transition-colors cursor-pointer">数据源</a>
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
                disabled={browseLoading.value}
              >
                <span class="material-symbols-outlined text-[18px]">travel_explore</span>
                浏览节点
              </button>
              <button
                class="bg-tide-primary text-tide-on-primary px-tide-gap-md py-1.5 rounded-tide hover:bg-tide-primary-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-tide-gap-sm disabled:opacity-50 shadow-none"
                disabled={tagImport.checkedNodes.size === 0 || tagImport.importing.value}
                onClick={() => tagImport.handleImport(handleImportSuccess)}
              >
                <span class="material-symbols-outlined text-[18px]">download</span>
                导入选中 ({tagImport.checkedNodes.size})
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
            {/* Left: Flat Folder List */}
            <div class="lg:w-1/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col shadow-none hover:shadow-md transition-shadow hover:border-tide-primary-fixed-dim/50 overflow-hidden">
              <div class="p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex justify-between items-center">
                <h3 class="font-tide-label-md text-tide-label-md text-tide-on-surface">设备层级</h3>
              </div>
              <FolderList
                folders={browse.folderList.value}
                selectedId={selectedFolderId.value}
                loading={browseLoading.value}
                onSelect={handleSelectFolder}
              />
            </div>

            {/* Right: Browse children or Tag list */}
            {isBrowsing.value ? (
              <BrowseTable
                nodes={leafChildren.value}
                checkedIds={Array.from(tagImport.checkedNodes.keys())}
                loading={browseChildrenLoading.value}
                selectedLabel={browseNode.value?.label || ''}
                onCheck={handleCheck}
                onImport={() => tagImport.handleImport(handleImportSuccess)}
                onBack={() => { selectedFolderId.value = null; tagImport.clearChecks() }}
              />
            ) : (
              <div class="lg:w-3/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden">
                <div class="flex-1 overflow-y-auto">
                  <TagTable
                    tags={tagTable.pagedTagList.value}
                    loading={tagTable.tagList.value.length === 0}
                    page={tagTable.page.value}
                    totalPages={tagTable.totalPages.value}
                    searchQuery={tagTable.searchQuery.value}
                    onDelete={handleDeleteTag}
                    onUpdate:searchQuery={(v: string) => { tagTable.searchQuery.value = v; tagTable.page.value = 1 }}
                    onUpdate:page={(v: number) => { tagTable.page.value = v }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  },
})
