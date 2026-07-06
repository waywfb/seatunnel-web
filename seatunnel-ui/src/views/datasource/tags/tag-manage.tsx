import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { getGroupTree, getTagList, deleteTag } from '@/service/data-source'
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
    const page = ref(1)
    const pageSize = 20

    const isPlcType = () => PLC_TYPES.includes(props.pluginName)

    const loadData = async () => {
      if (!props.datasourceId) return
      loading.value = true
      try {
        const [groupsRes, tagsRes] = await Promise.all([
          getGroupTree(props.datasourceId),
          getTagList(props.datasourceId),
        ])
        groupTree.value = flattenGroups(groupsRes || [], 0)
        allTags.value = (tagsRes || []).map((t: any) => ({
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
        countAll(groupTree.value, allTags.value)
        page.value = 1
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

    const handleAddTag = () => {
      if (isPlcType()) {
        showBrowseModal.value = true
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
          </div>
        </div>
      )
    }
  },
})
