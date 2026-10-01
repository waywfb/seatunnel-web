import { defineComponent, ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useBrowseStore } from './use-browse-store'
import { useTagImport } from './use-tag-import'
import { FolderList } from './FolderList'
import { BrowseTable } from './BrowseTable'
import { ManualPointEntry } from './ManualPointEntry'
import { Compass, Table2, X, RefreshCw } from 'lucide-vue-next'

export const BrowseImportModal = defineComponent({
  props: {
    show: { type: Boolean, default: false },
    datasourceId: { type: String, required: true },
    pluginName: { type: String, default: '' },
    groupPath: { type: String, default: '' }
  },
  emits: ['close', 'imported'],
  setup(props, { emit }) {
    const browse = useBrowseStore()
    const tagImport = useTagImport(() => props.datasourceId)
    const browseLoading = ref(false)
    const browseChildrenLoading = ref(false)
    const selectedFolderId = ref<string | null>(null)
    const message = useMessage()

    const dsId = ref('')

    const handleDiscover = async () => {
      browseLoading.value = true
      selectedFolderId.value = null
      try {
        await browse.loadRoots(dsId.value)
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

    const handleImportSuccess = () => {
      message.success('导入成功')
      selectedFolderId.value = null
      tagImport.clearChecks()
      browse.clear()
      emit('imported')
      emit('close')
    }

    const handleBack = () => {
      selectedFolderId.value = null
      tagImport.clearChecks()
    }

    const leafChildren = computed(() => {
      if (!selectedFolderId.value) return []
      return browse.getLeafChildren(selectedFolderId.value)
    })

    const browseNode = computed(() => {
      if (!selectedFolderId.value) return null
      return browse.getNode(selectedFolderId.value)
    })

    const isBrowsing = computed(() => selectedFolderId.value !== null)

    // Modbus does not support browsing; show manual point entry instead
    const isManualEntry = computed(
      () => (props.pluginName || '').toLowerCase() === 'modbus'
    )

    const autoDiscover = async () => {
      dsId.value = props.datasourceId
      await handleDiscover()
    }

    watch(
      () => props.show,
      async (val) => {
        if (val && !isManualEntry.value) await autoDiscover()
      },
      { immediate: true }
    )

    return () => {
      if (!props.show) return null

      return (
        <div class='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div class='bg-white rounded-tide-2xl shadow-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden'>
            {/* Modal header */}
            <div class='flex items-center justify-between px-tide-gap-md py-tide-gap-sm border-b border-tide-outline-variant bg-tide-surface flex-shrink-0'>
              <div class='flex items-center gap-2'>
                {isManualEntry.value ? (
                  <Table2 size={20} class='text-tide-primary' />
                ) : (
                  <Compass size={20} class='text-tide-primary' />
                )}
                <h3 class='font-tide-label-md text-tide-label-md text-tide-on-surface'>
                  {isManualEntry.value ? '录入测点' : '浏览节点导入测点'}
                </h3>
              </div>
              <div class='flex items-center gap-2'>
                <button
                  class='p-1.5 rounded-tide text-tide-outline hover:bg-tide-surface-container transition-colors'
                  onClick={() => {
                    browse.clear()
                    tagImport.clearChecks()
                    emit('close')
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div class='flex-1 min-h-0 p-tide-gap-md'>
              {isManualEntry.value ? (
                <ManualPointEntry
                  datasourceId={props.datasourceId}
                  groupPath={props.groupPath}
                  onImported={handleImportSuccess}
                />
              ) : browseLoading.value ? (
                <div class='flex-1 h-full flex items-center justify-center text-tide-outline gap-2'>
                  <RefreshCw size={24} class='animate-spin' />
                  <span class='font-tide-body-sm'>加载设备层级...</span>
                </div>
              ) : (
                <div class='flex flex-row gap-tide-gap-lg flex-1 h-full overflow-hidden'>
                  {/* Left: folders */}
                  <div class='lg:w-1/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden flex-shrink-0'>
                    <div class='p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex justify-between items-center'>
                      <h3 class='font-tide-label-md text-tide-label-md text-tide-on-surface'>
                        设备层级
                      </h3>
                    </div>
                    <FolderList
                      folders={browse.folderList.value}
                      selectedId={selectedFolderId.value}
                      loading={browseLoading.value}
                      onSelect={handleSelectFolder}
                    />
                  </div>

                  {/* Right: always show BrowseTable */}
                  <div class='lg:w-3/4 w-full min-w-0 bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden'>
                    <BrowseTable
                      nodes={isBrowsing.value ? leafChildren.value : []}
                      checkedIds={Array.from(tagImport.checkedNodes.keys())}
                      loading={browseChildrenLoading.value}
                      selectedLabel={browseNode.value?.label || ''}
                      selectedNodeId={browseNode.value?.nodeId || ''}
                      showEmpty={!isBrowsing.value}
                      onCheck={(nodeId: string) => {
                        const node = browse.getNode(nodeId)
                        if (node) tagImport.toggleCheck(node)
                      }}
                      onCheckAll={(checked: boolean, nodeIds: string[]) => {
                        for (const id of nodeIds) {
                          const node = browse.getNode(id)
                          if (node) {
                            if (checked) tagImport.check(node)
                            else tagImport.uncheck(node)
                          }
                        }
                      }}
                      onImport={() =>
                        tagImport.handleImport(
                          handleImportSuccess,
                          props.groupPath
                        )
                      }
                      onBack={handleBack}
                    />
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
