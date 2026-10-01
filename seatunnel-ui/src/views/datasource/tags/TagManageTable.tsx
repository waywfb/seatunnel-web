import { defineComponent } from 'vue'
import {
  Home,
  Upload,
  Plus,
  RefreshCw,
  Database,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

interface TagRow {
  id: string
  nativeId: string
  tagName: string
  tagAddress: string
  /** 读值所需坐标（Modbus 测点导入时写入） */
  properties?: {
    dataType?: string
    functionCode?: number
    registerOffset?: number
    unitId?: number
    byteOrder?: string
  }
  readOnly?: boolean
  status?: string
  unit?: string
  precision?: number
  dataType?: string
  groupId?: string
  groupPath?: string
}

export const TagManageTable = defineComponent({
  props: {
    tags: { type: Array as () => TagRow[], required: true },
    loading: { type: Boolean, default: false },
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    selectedGroupName: { type: String, default: '' },
    totalTagCount: { type: Number, default: 0 },
    canAdd: { type: Boolean, default: true },
    values: {
      type: Object as () => Record<string, { value: string; error: string }>,
      default: () => ({})
    },
    valueVisible: { type: Boolean, default: false },
    degraded: { type: String, default: '' },
    live: { type: Boolean, default: true }
  },
  emits: ['edit', 'delete', 'add', 'update:page', 'refresh', 'update:live'],
  setup(props, { emit }) {
    const statusLabel = (status?: string) => {
      if (status === 'ACTIVE' || !status)
        return {
          label: '在线',
          cls: 'bg-green-100 text-green-700 border-green-200'
        }
      if (status === 'ORPHANED')
        return {
          label: '离线',
          cls: 'bg-gray-100 text-gray-500 border-gray-200'
        }
      return { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' }
    }

    const typeBadge = (tag: TagRow) => {
      const t = (tag.dataType || 'Float').toLowerCase()
      if (
        t.includes('int') ||
        t.includes('uint') ||
        t.includes('short') ||
        t.includes('byte')
      )
        return {
          bg: 'bg-tide-data-db/10',
          text: 'text-tide-data-db',
          border: 'border-tide-data-db/20',
          label: tag.dataType || 'Float'
        }
      if (t.includes('float') || t.includes('double'))
        return {
          bg: 'bg-tide-data-api/10',
          text: 'text-tide-data-api',
          border: 'border-tide-data-api/20',
          label: tag.dataType || 'Float'
        }
      if (t.includes('bool'))
        return {
          bg: 'bg-tide-data-mq/10',
          text: 'text-tide-data-mq',
          border: 'border-tide-data-mq/20',
          label: tag.dataType || 'Float'
        }
      if (t.includes('string') || t.includes('char'))
        return {
          bg: 'bg-tide-status-warning/10',
          text: 'text-tide-status-warning',
          border: 'border-tide-status-warning/20',
          label: tag.dataType || 'Float'
        }
      return {
        bg: 'bg-tide-outline/10',
        text: 'text-tide-outline',
        border: 'border-tide-outline/20',
        label: tag.dataType || 'Float'
      }
    }

    return () => (
      <div class='flex-1 flex flex-col overflow-hidden'>
        {/* Path + Actions */}
        <div class='flex items-center justify-between px-tide-gap-md py-tide-gap-sm border-b border-tide-outline-variant bg-tide-surface flex-shrink-0'>
          <div class='flex items-center gap-2 text-sm text-tide-on-surface-variant'>
            <Home size={16} />
            <span>当前位置：</span>
            <span class='font-medium text-tide-on-surface'>
              {props.selectedGroupName || '全部测点'}
            </span>
            {props.totalTagCount > 0 && (
              <span class='text-tide-outline'>
                (含子节点共 {props.totalTagCount} 个测点)
              </span>
            )}
          </div>
          <div class='flex items-center gap-2'>
            {props.valueVisible && props.degraded && (
              <span
                class='text-xs text-tide-error truncate max-w-[220px]'
                title={props.degraded}
              >
                {props.degraded}
              </span>
            )}
            {props.valueVisible && (
              <>
                <button
                  class={`px-3 py-1.5 rounded-tide transition-colors font-tide-label-md text-tide-label-md text-xs flex items-center gap-1 border ${
                    props.live
                      ? 'bg-tide-primary text-white border-tide-primary'
                      : 'bg-white text-tide-on-surface border-tide-outline-variant hover:bg-tide-surface-container'
                  }`}
                  onClick={() => emit('update:live', !props.live)}
                >
                  实时
                </button>
                <button
                  class='p-1.5 rounded-tide bg-white border border-tide-outline-variant text-tide-on-surface hover:bg-tide-surface-container transition-colors'
                  title='刷新值'
                  onClick={() => emit('refresh')}
                >
                  <RefreshCw size={16} />
                </button>
              </>
            )}
            <button class='bg-white text-tide-on-surface border border-tide-outline-variant px-3 py-1.5 rounded-tide hover:bg-tide-surface-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs'>
              <Upload size={16} />
              导入CSV
            </button>
            <button
              class={`px-3 py-1.5 rounded-tide transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs shadow-none ${
                props.canAdd
                  ? 'bg-tide-primary text-white hover:bg-tide-primary-container'
                  : 'bg-tide-outline/20 text-tide-outline cursor-not-allowed'
              }`}
              disabled={!props.canAdd}
              onClick={() => emit('add')}
            >
              <Plus size={16} />
              新增测点
            </button>
          </div>
        </div>

        {/* Table */}
        <div class='flex-1 overflow-auto bg-tide-surface-container-lowest'>
          <table class='w-full text-left border-collapse'>
            <thead class='sticky top-0 bg-tide-surface-bright border-b border-tide-outline-variant font-tide-label-caps text-tide-label-caps text-tide-on-surface uppercase tracking-wider z-10'>
              <tr>
                <th class='p-tide-gap-sm pl-tide-gap-md font-bold'>点位编号</th>
                <th class='p-tide-gap-sm font-bold'>名称</th>
                <th class='p-tide-gap-sm font-bold'>数据类型</th>
                <th class='p-tide-gap-sm font-bold'>读写权限</th>
                <th class='p-tide-gap-sm font-bold'>在线状态</th>
                {props.valueVisible && (
                  <th class='p-tide-gap-sm font-bold'>当前值</th>
                )}
                <th class='p-tide-gap-sm pr-tide-gap-md font-bold text-right'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody class='font-tide-body-sm text-tide-body-sm text-tide-on-surface divide-y divide-tide-outline-variant/30'>
              {props.loading ? (
                <tr>
                  <td
                    colspan={props.valueVisible ? 7 : 6}
                    class='p-8 text-center text-tide-outline'
                  >
                    <RefreshCw
                      size={24}
                      class='animate-spin inline-block mr-2'
                    />
                    <span class='font-tide-body-sm'>加载中...</span>
                  </td>
                </tr>
              ) : props.tags.length === 0 ? (
                <tr>
                  <td
                    colspan={props.valueVisible ? 7 : 6}
                    class='p-8 text-center text-tide-outline font-tide-body-sm'
                  >
                    <Database size={32} class='block mx-auto mb-2' />
                    暂无测点数据
                  </td>
                </tr>
              ) : (
                props.tags.map((tag) => {
                  const badge = typeBadge(tag)
                  const st = statusLabel(tag.status)
                  const val = props.values[tag.id]
                  return (
                    <tr class='hover:bg-tide-surface-container-low transition-colors group/row'>
                      <td class='p-tide-gap-sm pl-tide-gap-md font-tide-mono-data text-tide-mono-data text-tide-on-surface-variant'>
                        {tag.nativeId || '-'}
                      </td>
                      <td class='p-tide-gap-sm font-medium'>
                        {tag.tagName || '-'}
                      </td>
                      <td class='p-tide-gap-sm'>
                        <span
                          class={`inline-flex items-center px-2 py-0.5 rounded-tide text-[11px] font-medium ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td class='p-tide-gap-sm text-tide-on-surface-variant'>
                        <span class='inline-flex items-center gap-1'>
                          {tag.readOnly ? (
                            <Eye size={14} class='text-tide-outline' />
                          ) : (
                            <Edit3 size={14} class='text-tide-data-api' />
                          )}
                          {tag.readOnly ? '只读' : '读写'}
                        </span>
                      </td>
                      <td class='p-tide-gap-sm'>
                        <span
                          class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      {props.valueVisible && (
                        <td class='p-tide-gap-sm font-tide-mono-data text-tide-mono-data max-w-[220px]'>
                          {!val ? (
                            <span class='text-tide-outline'>—</span>
                          ) : val.error ? (
                            <span
                              class='text-tide-error truncate inline-block align-bottom'
                              title={val.error}
                            >
                              {val.error}
                            </span>
                          ) : (
                            <span
                              class={
                                val.value
                                  ? 'text-tide-on-surface'
                                  : 'text-tide-outline'
                              }
                            >
                              {val.value === 'true'
                                ? '1'
                                : val.value === 'false'
                                ? '0'
                                : val.value || '—'}
                            </span>
                          )}
                        </td>
                      )}
                      <td class='p-tide-gap-sm pr-tide-gap-md text-right'>
                        <div class='flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity'>
                          <button
                            class='text-tide-primary hover:text-tide-primary-dimm font-tide-label-md text-tide-label-md'
                            onClick={() => emit('edit', tag.id)}
                          >
                            编辑
                          </button>
                          <button
                            class='text-tide-error/80 hover:text-tide-error font-tide-label-md text-tide-label-md'
                            onClick={() => emit('delete', tag.id)}
                          >
                            删除
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
        {props.totalPages > 1 && (
          <div class='flex items-center justify-between px-tide-gap-md py-tide-gap-sm border-t border-tide-outline-variant bg-tide-surface flex-shrink-0'>
            <span class='text-tide-outline font-tide-body-sm'>
              共 {props.totalPages} 页
            </span>
            <div class='flex items-center gap-2'>
              <button
                class='p-1.5 rounded-tide border border-tide-outline-variant hover:bg-tide-surface-container disabled:opacity-30 transition-colors'
                disabled={props.page <= 1}
                onClick={() => emit('update:page', props.page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span class='px-3 py-1 rounded-tide bg-tide-primary text-white font-tide-label-md text-tide-label-md'>
                {props.page}
              </span>
              <button
                class='p-1.5 rounded-tide border border-tide-outline-variant hover:bg-tide-surface-container disabled:opacity-30 transition-colors'
                disabled={props.page >= props.totalPages}
                onClick={() => emit('update:page', props.page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
})

export type { TagRow }
