import { defineComponent } from 'vue'
import type { FolderItem } from './types'

export const FolderList = defineComponent({
  props: {
    folders: { type: Array as () => FolderItem[], required: true },
    selectedId: { type: String, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const iconColor = (node: FolderItem) => {
      if (node.nodeId?.includes('Objects')) return 'text-tide-status-warning'
      return 'text-tide-data-db'
    }

    return () => (
      <div class="flex-1 overflow-y-auto">
        {props.loading ? (
          <div class="flex items-center justify-center py-8 text-tide-outline">
            <span class="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
            <span class="font-tide-body-sm">加载中...</span>
          </div>
        ) : props.folders.length === 0 ? (
          <div class="py-8 text-center text-sm text-tide-outline">
            <span class="material-symbols-outlined text-[32px] block mx-auto mb-2">folder_off</span>
            <span class="font-tide-body-sm">点击"浏览节点"展开设备层级</span>
          </div>
        ) : (
          <div class="font-tide-body-sm text-tide-body-sm text-tide-on-surface space-y-0.5">
            {props.folders.map(folder => {
              const isSelected = props.selectedId === folder.nodeId
              return (
                <div
                  key={folder.nodeId}
                  class={[
                    'flex items-center gap-2 px-2 py-1.5 rounded-tide cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-tide-primary/10 ring-1 ring-tide-primary/30 font-medium'
                      : 'hover:bg-tide-surface-container',
                  ].join(' ')}
                  style={{ paddingLeft: `${12 + folder.depth * 20}px` }}
                  onClick={() => emit('select', folder.nodeId)}
                >
                  <span
                    class={`material-symbols-outlined text-[16px] flex-shrink-0 ${iconColor(folder)}`}
                  >
                    {folder.nodeId?.includes('Objects') ? 'dns' : 'folder'}
                  </span>
                  <span class="truncate">{folder.label}</span>
                  {folder.loading && (
                    <span class="material-symbols-outlined text-[14px] animate-spin ml-auto">
                      sync
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  },
})
