import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useMessage, NModal, NInput } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { getGroupTree, getTagList, deleteTag, createGroup } from '@/service/data-source'
import { TagGroupTree } from './TagGroupTree'
import type { GroupNode } from './TagGroupTree'
import { TagManageTable } from './TagManageTable'
import type { TagRow } from './TagManageTable'
import { BrowseImportModal } from './BrowseImportModal'

const PLC_TYPES = ['OPCUA', 'S7', 'Modbus', 'Plc4x']

function flattenGroups(raw: any[], depth: number): GroupNode[] {
  return (raw || []).map((g: any) => ({
    id: String(g.id || ''),
    groupName: g.groupName || g.path || '',
    path: g.path || '',
    count: 0,
    depth,
    children: flattenGroups(g.children, depth + 1),
  }))
}

function countAll(groups: GroupNode[], tags: TagRow[], root?: boolean): number {
  let total = 0
  for (const g of groups) {
    const direct = tags.filter(t => t.groupPath === g.path)
    const childCount = countAll(g.children, tags)
    g.count = direct.length + childCount
    total += g.count
  }
  return total
}

function collectPaths(groups: GroupNode[], result: string[] = []) {
  for (const g of groups) {
    result.push(g.path)
    collectPaths(g.children, result)
  }
  return result
}

export default defineComponent({
  props: {
    datasourceId: { type: String, required: true },
    pluginName: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useI18n()
    const message = useMessage()

    const groupTree = ref<GroupNode[]>([])
    const allTags = ref<TagRow[]>([])
    const selectedPath = ref<string | null>(null)
    const loading = ref(false)
    const hasLoaded = ref(false)
    const page = ref(1)
    const pageSize = 20

    const isPlcType = () => PLC_TYPES.includes(props.pluginName)

    const loadData = async () => {
      if (!props.datasourceId) return
      if (!hasLoaded.value) loading.value = true
      try {
        const [groupsRes, tagsRes] = await Promise.all([
          getGroupTree(props.datasourceId),
          getTagList(props.datasourceId),
        ])
        const newGroups = flattenGroups(groupsRes || [], 0)
        const newTags = (tagsRes || []).map((t: any) => ({
          id: String(t.id || ''),
          nativeId: t.nativeId || '',
          tagName: t.tagName || '',
          tagAddress: t.tagAddress || '',
          readOnly: t.readOnly,
          status: t.status || 'ACTIVE',
          unit: t.unit,
          precision: t.precision,
          dataType: t.dataType || (t.properties?.dataType) || '',
          groupPath: t.groupPath || '',
        }))
        countAll(newGroups, newTags)
        groupTree.value = newGroups
        allTags.value = newTags
        selectedPath.value = null
        page.value = 1
        hasLoaded.value = true
      } catch (err: any) {
        message.error(err.message || '加载失败')
      } finally {
        loading.value = false
      }
    }

    watch(() => props.datasourceId, val => { if (val) loadData() }, { immediate: true })

const filteredTags = computed(() => {
  if (!selectedPath.value) return allTags.value
  function findNode(nodes: GroupNode[], target: string): GroupNode | null {
    for (const n of nodes) {
      if (n.path === target) return n
      const found = findNode(n.children, target)
      if (found) return found
    }
    return null
  }
  const node = findNode(groupTree.value, selectedPath.value)
  if (!node) return allTags.value
  const paths = new Set(collectPaths([node]))
  return allTags.value.filter(t => t.groupPath && paths.has(t.groupPath))
})

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(filteredTags.value.length / pageSize))
    )

    const pagedTags = computed(() => {
      const start = (page.value - 1) * pageSize
      return filteredTags.value.slice(start, start + pageSize)
    })

    const showBrowseModal = ref(false)
    const showCreateGroupModal = ref(false)
    const newGroupName = ref('')
    const creating = ref(false)

    const handleAddTag = () => {
      if (!isPlcType()) return
      if (groupTree.value.length === 0) {
        message.warning('请先创建设备层级节点后再导入测点')
        return
      }
      showBrowseModal.value = true
    }

    const handleOpenCreateGroup = () => {
      newGroupName.value = ''
      showCreateGroupModal.value = true
    }

    const handleCreateGroup = async () => {
      const name = newGroupName.value.trim()
      if (!name) {
        message.warning('请输入节点名称')
        return
      }
      creating.value = true
      try {
        const parentPath = selectedPath.value
          ? (() => {
              function findFullPath(nodes: GroupNode[], target: string): string | null {
                for (const n of nodes) {
                  if (n.path === target) return n.path
                  const found = findFullPath(n.children, target)
                  if (found) return found
                }
                return null
              }
              return findFullPath(groupTree.value, selectedPath.value!)
            })()
          : '/root'
        await createGroup(props.datasourceId, {
          parentPath: parentPath || '/root',
          groupName: name,
        })
        message.success('节点创建成功')
        showCreateGroupModal.value = false
        await loadData()
      } catch (err: any) {
        message.error(err.message || '创建失败')
      } finally {
        creating.value = false
      }
    }

    const handleCloseBrowseModal = () => {
      showBrowseModal.value = false
    }

    const handleImported = () => {
      loadData()
    }

    const selectedGroupName = computed(() => {
      if (!selectedPath.value) return '全部测点'
      const findName = (nodes: GroupNode[]): string => {
        for (const n of nodes) {
          if (n.path === selectedPath.value) return n.groupName
          const found = findName(n.children)
          if (found) return found
        }
        return ''
      }
      return findName(groupTree.value) || selectedPath.value
    })

    const handleSelectGroup = (path: string) => {
      selectedPath.value = path
      page.value = 1
    }

    const handleDelete = async (tagId: string) => {
      try {
        await deleteTag(tagId)
        message.success('已删除')
        await loadData()
      } catch (err: any) {
        message.error(err.message || '删除失败')
      }
    }

    return () => {
      if (!isPlcType()) return null

      return (
        <div class="flex flex-row gap-tide-gap-lg flex-1 min-h-0 overflow-hidden">
          {/* Left: Category tree */}
          <div class="lg:w-1/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden">
            <div class="p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex justify-between items-center">
              <h3 class="font-tide-label-md text-tide-label-md text-tide-on-surface">设备层级</h3>
              <button
                class="bg-tide-primary text-white px-2 py-1 rounded-tide hover:bg-tide-primary-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs shadow-none"
                onClick={handleOpenCreateGroup}
              >
                <span class="material-symbols-outlined text-[14px]">add</span>
                新增
              </button>
            </div>
            <TagGroupTree
              groups={groupTree.value}
              selectedPath={selectedPath.value}
              loading={loading.value}
              onSelect={handleSelectGroup}
            />
          </div>

          {/* Right: Tag table */}
          <div class="lg:w-3/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden">
            <TagManageTable
              tags={pagedTags.value}
              loading={loading.value}
              page={page.value}
              totalPages={totalPages.value}
              selectedGroupName={selectedGroupName.value}
              totalTagCount={filteredTags.value.length}
              canAdd={groupTree.value.length > 0}
              onEdit={(id: string) => {
                // TODO: open edit modal
              }}
              onDelete={handleDelete}
              onAdd={handleAddTag}
              onUpdate:page={(v: number) => { page.value = v }}
            />
            <BrowseImportModal
              show={showBrowseModal.value}
              datasourceId={props.datasourceId}
              pluginName={props.pluginName}
              onClose={handleCloseBrowseModal}
              onImported={handleImported}
            />
            <NModal
              show={showCreateGroupModal.value}
              onUpdateShow={(v: boolean) => { showCreateGroupModal.value = v }}
              preset="card"
              title="新增设备层级节点"
              style={{ maxWidth: '420px' }}
              bordered={false}
              closable={true}
            >
              <div class="flex flex-col gap-3">
                <div class="text-sm text-tide-on-surface-variant">
                  父路径：{selectedPath.value || '/root'}
                </div>
                <NInput
                  value={newGroupName.value}
                  onUpdateValue={(v: string) => { newGroupName.value = v }}
                  placeholder="请输入节点名称"
                  maxlength={100}
                />
                <div class="flex justify-end gap-2 mt-2">
                  <button
                    class="px-4 py-2 rounded-tide border border-tide-outline-variant text-sm text-tide-on-surface hover:bg-tide-surface-container transition-colors"
                    onClick={() => { showCreateGroupModal.value = false }}
                  >
                    取消
                  </button>
                  <button
                    class={`px-4 py-2 rounded-tide text-sm text-white transition-colors ${creating.value ? 'bg-tide-primary/60 cursor-not-allowed' : 'bg-tide-primary hover:bg-tide-primary-container'}`}
                    disabled={creating.value}
                    onClick={handleCreateGroup}
                  >
                    {creating.value ? '创建中...' : '确认'}
                  </button>
                </div>
              </div>
            </NModal>
          </div>
        </div>
      )
    }
  },
})
