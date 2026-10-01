import { defineComponent, PropType } from 'vue'

export interface TreeTagNode {
  kind: 'tag'
  id: string
  tagName: string
  tagAddress: string
  status?: string
  unit?: string
}

export interface TreeGroupNode {
  kind: 'group'
  id: string
  groupName: string
  path: string
  count: number
  depth: number
  children: TreeNode[]
}

export type TreeNode = TreeGroupNode | TreeTagNode

export const TagGroupTree = defineComponent({
  props: {
    groups: { type: Array as PropType<TreeGroupNode[]>, required: true },
    selectedPath: { type: String, default: null },
    loading: { type: Boolean, default: false }
  },
  emits: ['select', 'delete'],
  setup(props, { emit }) {
    const renderTag = (node: TreeTagNode, depth: number) => (
      <div
        key={`tag-${node.id}`}
        class='flex items-center justify-between px-2 py-1 rounded-tide hover:bg-tide-surface-container transition-colors'
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        title={node.tagAddress}
      >
        <div class='flex items-center gap-2 min-w-0'>
          <span class='material-symbols-outlined text-[14px] flex-shrink-0 text-tide-primary'>
            {node.status === 'ORPHANED' ? 'link_off' : 'sensors'}
          </span>
          <span class='truncate font-tide-body-sm text-tide-body-sm text-tide-on-surface-variant'>
            {node.tagName}
          </span>
          {node.unit && (
            <span class='flex-shrink-0 text-tide-label-sm text-tide-label-sm text-tide-outline'>
              {node.unit}
            </span>
          )}
        </div>
        {node.status === 'ORPHANED' && (
          <span class='flex-shrink-0 text-tide-label-sm text-tide-label-sm text-tide-outline'>
            离线
          </span>
        )}
      </div>
    )

    const renderGroup = (node: TreeGroupNode) => {
      const isSelected = props.selectedPath === node.path
      return (
        <div key={node.path}>
          <div
            class={[
              'flex items-center justify-between px-2 py-1.5 rounded-tide cursor-pointer transition-colors group/tree',
              isSelected
                ? 'bg-tide-primary/10 ring-1 ring-tide-primary/30 font-medium'
                : 'hover:bg-tide-surface-container'
            ].join(' ')}
            style={{ paddingLeft: `${12 + node.depth * 20}px` }}
            onClick={() => emit('select', node.path)}
          >
            <div class='flex items-center gap-2 min-w-0'>
              <span class='material-symbols-outlined text-[16px] flex-shrink-0 text-tide-data-db'>
                {node.depth === 0 ? 'dns' : 'folder'}
              </span>
              <span class='truncate font-tide-body-sm text-tide-body-sm text-tide-on-surface'>
                {node.groupName}
              </span>
            </div>
            <div class='flex items-center gap-1'>
              <span class='flex-shrink-0 text-tide-label-sm text-tide-label-sm text-tide-outline bg-tide-surface-container-lowest px-1.5 py-0.5 rounded-full'>
                {node.count}
              </span>
              <button
                class='opacity-0 group-hover/tree:opacity-100 text-tide-error/70 hover:text-tide-error transition-all p-0.5 rounded'
                title='删除'
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  emit('delete', node)
                }}
              >
                <span class='material-symbols-outlined text-[14px]'>
                  delete
                </span>
              </button>
            </div>
          </div>
          {node.children.length > 0 && (
            <div>
              {node.children.map((child) =>
                child.kind === 'tag'
                  ? renderTag(child, node.depth + 1)
                  : renderGroup(child)
              )}
            </div>
          )}
        </div>
      )
    }

    return () => (
      <div class='flex-1 overflow-y-auto'>
        {props.loading ? (
          <div class='flex items-center justify-center py-8 text-tide-outline'>
            <span class='material-symbols-outlined text-[24px] animate-spin mr-2'>
              sync
            </span>
            <span class='font-tide-body-sm'>加载中...</span>
          </div>
        ) : props.groups.length === 0 ? (
          <div class='py-8 text-center text-sm text-tide-outline'>
            <span class='material-symbols-outlined text-[32px] block mx-auto mb-2'>
              folder_off
            </span>
            <span class='font-tide-body-sm'>
              暂无设备，请先新增设备层级节点
            </span>
          </div>
        ) : (
          <div class='space-y-0.5'>{props.groups.map(renderGroup)}</div>
        )}
      </div>
    )
  }
})
