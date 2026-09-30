import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  computed
} from 'vue'
import { useMessage, useDialog, NModal, NInput } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import {
  getGroupTree,
  getTagList,
  deleteTag,
  createGroup,
  deleteGroup,
  readTagValues
} from '@/service/data-source'
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
    children: flattenGroups(g.children, depth + 1)
  }))
}

function countAll(groups: GroupNode[], tags: TagRow[], root?: boolean): number {
  let total = 0
  for (const g of groups) {
    const direct = tags.filter((t) => t.groupPath === g.path)
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
    pluginName: { type: String, default: '' }
  },
  setup(props) {
    const { t } = useI18n()
    const message = useMessage()
    const dialog = useDialog()

    const groupTree = ref<GroupNode[]>([])
    const allTags = ref<TagRow[]>([])
    const selectedPath = ref<string | null>(null)
    const loading = ref(false)
    const hasLoaded = ref(false)
    const page = ref(1)
    const pageSize = 20

    const isPlcType = () => PLC_TYPES.includes(props.pluginName)

    // 读值接口支持 Modbus / S7 / OPC UA（app 侧 BridgeClient 直连 PLC4X 与 Milo）
    const valueVisible = computed(() =>
      ['Modbus', 'S7', 'OPCUA'].includes(props.pluginName)
    )
    const values = ref<Record<string, { value: string; error: string }>>({})
    const live = ref(true)
    const reading = ref(false)
    let valueTimer: number | null = null

    const isModbus = () => props.pluginName === 'Modbus'
    const addressOf = (t: TagRow) => (t.tagAddress || t.nativeId || '').trim()
    // Modbus 靠 properties 里的寄存器坐标，S7 / OPC UA 靠 browse 出来的地址
    const readableTags = computed(() =>
      pagedTags.value.filter((t) =>
        isModbus()
          ? t.properties &&
            t.properties.registerOffset != null &&
            t.properties.functionCode != null
          : addressOf(t) !== ''
      )
    )

    const pollValues = async () => {
      if (!valueVisible.value || reading.value) return
      const targets = readableTags.value
      if (targets.length === 0) return
      reading.value = true
      try {
        const list: any[] = await readTagValues({
          datasourceId: props.datasourceId,
          points: targets.map((t) =>
            isModbus()
              ? {
                  unitId: Number(t.properties?.unitId ?? 1),
                  functionCode: Number(t.properties?.functionCode),
                  offset: Number(t.properties?.registerOffset),
                  dataType: String(t.properties?.dataType || 'UINT16'),
                  byteOrder: String(t.properties?.byteOrder || 'ABCD')
                }
              : {
                  address: addressOf(t),
                  dataType: String(t.dataType || '')
                }
          )
        })
        const next: Record<string, { value: string; error: string }> = {}
        for (const item of Array.isArray(list) ? list : []) {
          const row = targets[item.index]
          if (!row) continue
          next[row.id] = { value: item.value || '', error: item.error || '' }
        }
        values.value = next
      } catch {
        // 实时轮询失败不弹全局提示，保持上一次的值
      } finally {
        reading.value = false
      }
    }

    const startValuePolling = () => {
      if (valueTimer !== null || !valueVisible.value) return
      void pollValues()
      valueTimer = window.setInterval(() => {
        if (live.value) void pollValues()
      }, 1000)
    }
    const stopValuePolling = () => {
      if (valueTimer === null) return
      window.clearInterval(valueTimer)
      valueTimer = null
    }

    onMounted(startValuePolling)
    onBeforeUnmount(stopValuePolling)

    // 切换数据源或翻页时清掉旧值
    watch([() => props.datasourceId, () => props.pluginName], () => {
      values.value = {}
    })
    watch(page, () => {
      values.value = {}
    })
    // 非 Modbus 数据源不展示当前值，切换时同步启停轮询
    watch(valueVisible, (visible) => {
      if (visible) {
        startValuePolling()
      } else {
        stopValuePolling()
        values.value = {}
      }
    })

    const loadData = async (keepSelection = false) => {
      if (!props.datasourceId) return
      if (!hasLoaded.value) loading.value = true
      try {
        const [groupsRes, tagsRes] = await Promise.all([
          getGroupTree(props.datasourceId),
          getTagList(props.datasourceId)
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
          dataType: t.dataType || t.properties?.dataType || '',
          properties: t.properties || {},
          groupId: t.groupId != null ? String(t.groupId) : '',
          groupPath: t.groupPath || ''
        }))
        countAll(newGroups, newTags)
        groupTree.value = newGroups
        allTags.value = newTags
        if (!keepSelection) {
          selectedPath.value = null
          page.value = 1
        }
        hasLoaded.value = true
      } catch (err: any) {
        message.error(err.message || '加载失败')
      } finally {
        loading.value = false
      }
    }

    watch(
      () => props.datasourceId,
      (val) => {
        if (val) loadData()
      },
      { immediate: true }
    )

    function buildGroupPathMap(
      nodes: GroupNode[],
      map: Record<string, string> = {}
    ): Record<string, string> {
      for (const n of nodes) {
        map[n.id] = n.path
        buildGroupPathMap(n.children, map)
      }
      return map
    }

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
      const idToPath = buildGroupPathMap([node])
      return allTags.value.filter((t) => {
        if (t.groupPath && paths.has(t.groupPath)) return true
        if (t.groupId && idToPath[t.groupId])
          return paths.has(idToPath[t.groupId])
        return false
      })
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
    const importTargetPath = ref<string | null>(null)

    const handleAddTag = () => {
      if (!isPlcType()) return
      if (groupTree.value.length === 0) {
        message.warning('请先创建设备层级节点后再导入测点')
        return
      }
      importTargetPath.value = selectedPath.value
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
      // Check duplicate name among siblings
      const parentPath = selectedPath.value
        ? (() => {
            function findFullPath(
              nodes: GroupNode[],
              target: string
            ): string | null {
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
      const siblings =
        parentPath === '/root'
          ? groupTree.value
          : (() => {
              function findParent(
                nodes: GroupNode[],
                target: string
              ): GroupNode[] | null {
                for (const n of nodes) {
                  if (n.path === target) return n.children
                  const found = findParent(n.children, target)
                  if (found) return found
                }
                return null
              }
              return findParent(groupTree.value, parentPath!) || []
            })()
      if (siblings.some((n) => n.groupName === name)) {
        message.warning('同一层级下已存在同名节点')
        return
      }
      creating.value = true
      try {
        await createGroup(props.datasourceId, {
          parentPath: parentPath || '/root',
          groupName: name
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

    const handleImported = async () => {
      const target = importTargetPath.value
      importTargetPath.value = null
      await loadData(true)
      page.value = 1
      if (target) selectedPath.value = target
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

    const handleDeleteGroup = (node: GroupNode) => {
      dialog.warning({
        title: '确认删除',
        content: `确定删除节点"${node.groupName}"吗？${
          node.count > 0 ? `（该节点下含 ${node.count} 个测点）` : ''
        }`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            await deleteGroup(node.id)
            message.success('节点已删除')
            if (
              selectedPath.value === node.path ||
              selectedPath.value?.startsWith(node.path + '/')
            ) {
              selectedPath.value = null
            }
            await loadData()
          } catch (err: any) {
            message.error(err.message || '删除失败')
          }
        }
      })
    }

    return () => {
      if (!isPlcType()) return null

      return (
        <div class='flex flex-row gap-tide-gap-lg flex-1 min-h-0 overflow-hidden'>
          {/* Left: Category tree */}
          <div class='lg:w-1/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden'>
            <div class='p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex justify-between items-center'>
              <h3 class='font-tide-label-md text-tide-label-md text-tide-on-surface'>
                设备层级
              </h3>
              <button
                class='bg-tide-primary text-white px-2 py-1 rounded-tide hover:bg-tide-primary-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs shadow-none'
                onClick={handleOpenCreateGroup}
              >
                <span class='material-symbols-outlined text-[14px]'>add</span>
                新增
              </button>
            </div>
            <TagGroupTree
              groups={groupTree.value}
              selectedPath={selectedPath.value}
              loading={loading.value}
              onSelect={handleSelectGroup}
              onDelete={handleDeleteGroup}
            />
          </div>

          {/* Right: Tag table */}
          <div class='lg:w-3/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden'>
            <TagManageTable
              tags={pagedTags.value}
              loading={loading.value}
              page={page.value}
              totalPages={totalPages.value}
              selectedGroupName={selectedGroupName.value}
              totalTagCount={filteredTags.value.length}
              canAdd={groupTree.value.length > 0}
              values={values.value}
              valueVisible={valueVisible.value}
              live={live.value}
              onRefresh={() => void pollValues()}
              onUpdate:live={(v: boolean) => {
                live.value = v
                if (v) void pollValues()
              }}
              onEdit={(id: string) => {
                // TODO: open edit modal
              }}
              onDelete={handleDelete}
              onAdd={handleAddTag}
              onUpdate:page={(v: number) => {
                page.value = v
              }}
            />
            <BrowseImportModal
              show={showBrowseModal.value}
              datasourceId={props.datasourceId}
              pluginName={props.pluginName}
              groupPath={importTargetPath.value || '/root'}
              onClose={handleCloseBrowseModal}
              onImported={handleImported}
            />
            <NModal
              show={showCreateGroupModal.value}
              onUpdateShow={(v: boolean) => {
                showCreateGroupModal.value = v
              }}
              preset='card'
              title='新增设备层级节点'
              style={{ maxWidth: '420px' }}
              bordered={false}
              closable={true}
            >
              <div class='flex flex-col gap-3'>
                <div class='text-sm text-tide-on-surface-variant'>
                  父路径：{selectedPath.value || '/root'}
                </div>
                <NInput
                  value={newGroupName.value}
                  onUpdateValue={(v: string) => {
                    newGroupName.value = v
                  }}
                  placeholder='请输入节点名称'
                  maxlength={100}
                />
                <div class='flex justify-end gap-2 mt-2'>
                  <button
                    class='px-4 py-2 rounded-tide border border-tide-outline-variant text-sm text-tide-on-surface hover:bg-tide-surface-container transition-colors'
                    onClick={() => {
                      showCreateGroupModal.value = false
                    }}
                  >
                    取消
                  </button>
                  <button
                    class={`px-4 py-2 rounded-tide text-sm text-white transition-colors ${
                      creating.value
                        ? 'bg-tide-primary/60 cursor-not-allowed'
                        : 'bg-tide-primary hover:bg-tide-primary-container'
                    }`}
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
  }
})
