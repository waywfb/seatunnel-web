import { defineComponent, computed, ref } from 'vue'
import type { BrowseNode } from './types'

export const BrowseTable = defineComponent({
  props: {
    nodes: { type: Array as () => BrowseNode[], required: true },
    checkedIds: { type: Array as () => string[], default: () => [] },
    loading: { type: Boolean, default: false },
    selectedLabel: { type: String, default: '' },
    selectedNodeId: { type: String, default: '' },
    showEmpty: { type: Boolean, default: false },
  },
  emits: ['check', 'checkAll', 'import', 'back'],
  setup(props, { emit }) {
    const searchQuery = ref('')

    const filteredNodes = computed(() => {
      const q = searchQuery.value.toLowerCase()
      if (!q) return props.nodes
      return props.nodes.filter(
        n =>
          n.label.toLowerCase().includes(q) ||
          n.nodeId.toLowerCase().includes(q),
      )
    })

    const isChecked = (nodeId: string) => props.checkedIds.includes(nodeId)

    const allChecked = computed(() =>
      props.nodes.length > 0 && props.nodes.every(n => isChecked(n.nodeId))
    )

    const indeterminate = computed(() =>
      !allChecked.value && props.nodes.some(n => isChecked(n.nodeId))
    )

    return () => (
      <div class="w-full flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div class="p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex flex-col gap-tide-gap-sm">
          <div class="flex items-center gap-tide-gap-md">
            <button
              class="p-1 rounded-tide text-tide-outline hover:bg-tide-surface-container transition-colors"
              onClick={() => emit('back')}
              title="返回导入列表"
            >
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-[18px] text-tide-primary flex-shrink-0">dns</span>
              <div class="flex flex-col min-w-0">
                <span class="font-tide-label-md text-tide-label-md text-tide-on-surface truncate">
                  {props.selectedLabel || '浏览'}
                </span>
                {props.selectedNodeId && (
                  <span class="font-tide-body-sm text-tide-body-sm text-tide-outline truncate">
                    {props.selectedNodeId}
                  </span>
                )}
              </div>
            </div>
            {props.nodes.length > 0 && (
              <button
                class="ml-auto bg-tide-primary text-tide-on-primary px-3 py-1 rounded-tide hover:bg-tide-primary-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 disabled:opacity-50 text-xs"
                onClick={() => emit('import')}
                disabled={props.checkedIds.length === 0}
              >
                <span class="material-symbols-outlined text-[16px]">download</span>
                导入选中 ({props.checkedIds.length})
              </button>
            )}
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-tide-outline text-[16px]">
              search
            </span>
            <input
              class="w-full pl-8 pr-3 py-1.5 bg-tide-surface-container-lowest border border-tide-outline-variant rounded-tide font-tide-body-sm text-tide-body-sm focus:outline-none focus:border-tide-primary focus:ring-1 focus:ring-tide-primary/20 placeholder:text-tide-outline"
              placeholder="搜索节点..."
              value={searchQuery.value}
              onInput={(e: any) => (searchQuery.value = e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div class="flex-1 overflow-auto bg-tide-surface-container-lowest">
          {props.showEmpty ? (
            <div class="flex-1 h-full flex items-center justify-center text-tide-outline gap-2 py-16">
              <span class="material-symbols-outlined text-[40px]">folder_open</span>
              <span class="font-tide-body-sm">请选择设备层级节点浏览</span>
            </div>
          ) : props.loading ? (
            <div class="flex items-center justify-center py-16 text-tide-outline">
              <span class="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
              <span class="font-tide-body-sm">加载中...</span>
            </div>
          ) : (
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 bg-tide-surface-bright border-b border-tide-outline-variant font-tide-label-caps text-tide-label-caps text-tide-on-surface uppercase tracking-wider z-10">
                <tr>
                  <th class="p-tide-gap-sm pl-tide-gap-md font-bold w-8"></th>
                  <th class="p-tide-gap-sm font-bold">名称</th>
                  <th class="p-tide-gap-sm font-bold">节点ID</th>
                  <th class="p-tide-gap-sm font-bold">描述</th>
                  <th class="p-tide-gap-sm pr-tide-gap-md font-bold text-right">
                    <div class="flex items-center justify-end gap-2">
                      <span>操作</span>
                      <span
                        class={`w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${allChecked.value
                          ? 'bg-tide-primary border-tide-primary text-tide-on-primary'
                          : indeterminate.value
                            ? 'bg-tide-primary border-tide-primary text-tide-on-primary'
                            : 'border-tide-outline-variant hover:border-tide-primary bg-white'
                          }`}
                        onClick={() => emit('checkAll', !allChecked.value, filteredNodes.value.map(n => n.nodeId))}
                      >
                        {allChecked.value ? (
                          <span class="material-symbols-outlined text-[12px]">check</span>
                        ) : indeterminate.value ? (
                          <span class="material-symbols-outlined text-[12px]">horizontal_rule</span>
                        ) : null}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="font-tide-body-sm text-tide-body-sm text-tide-on-surface divide-y divide-tide-outline-variant/30">
                {filteredNodes.value.length === 0 ? (
                  <tr>
                    <td colspan="5" class="p-8 text-center text-tide-outline font-tide-body-sm">
                      <span class="material-symbols-outlined text-[32px] block mx-auto mb-2">
                        folder_off
                      </span>
                      暂无节点
                    </td>
                  </tr>
                ) : (
                  filteredNodes.value.map(child => {
                    const checked = isChecked(child.nodeId)
                    return (
                      <tr class="hover:bg-tide-surface-container-low transition-colors group/row">
                        <td class="p-tide-gap-sm pl-tide-gap-md w-8">
                          <span class="material-symbols-outlined text-[18px] text-tide-outline">
                            contract_edit
                          </span>
                        </td>
                        <td class="p-tide-gap-sm font-medium">{child.label || '-'}</td>
                        <td class="p-tide-gap-sm font-tide-mono-data text-tide-mono-data text-tide-on-surface-variant">
                          {child.nodeId || '-'}
                        </td>
                        <td class="p-tide-gap-sm text-tide-on-surface-variant max-w-[200px] truncate">
                          {child.description || '-'}
                        </td>
                        <td class="p-tide-gap-sm pr-tide-gap-md text-right">
                          <div class="flex justify-end gap-1">
                            <span
                              class={`w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${checked
                                ? 'bg-tide-primary border-tide-primary text-tide-on-primary'
                                : 'border-tide-outline-variant hover:border-tide-primary bg-white'
                                }`}
                              onClick={() => emit('check', child.nodeId)}
                            >
                              {checked && (
                                <span class="material-symbols-outlined text-[12px]">check</span>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  },
})
