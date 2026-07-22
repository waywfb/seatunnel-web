import { defineComponent } from 'vue'
import type { TagRow } from './types'

export const TagTable = defineComponent({
  props: {
    tags: { type: Array as () => TagRow[], required: true },
    loading: { type: Boolean, default: false },
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    searchQuery: { type: String, default: '' }
  },
  emits: ['delete', 'update:searchQuery', 'update:page'],
  setup(props, { emit }) {
    return () => (
      <div class='flex flex-col gap-tide-gap-md p-tide-gap-md'>
        {/* Search */}
        <div class='relative'>
          <span class='material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tide-outline text-[18px]'>
            search
          </span>
          <input
            class='w-full pl-10 pr-3 py-2 bg-tide-surface-container-low border border-tide-outline-variant rounded-tide font-tide-body-sm text-tide-body-sm focus:outline-none focus:border-tide-primary focus:ring-1 focus:ring-tide-primary/20 placeholder:text-tide-outline'
            placeholder='搜索已导入测点...'
            value={props.searchQuery}
            onInput={(e: any) => emit('update:searchQuery', e.target.value)}
          />
        </div>

        {/* Table */}
        <div class='overflow-auto rounded-tide border border-tide-outline-variant'>
          <table class='w-full text-left border-collapse'>
            <thead class='bg-tide-surface-bright border-b border-tide-outline-variant font-tide-label-caps text-tide-label-caps text-tide-on-surface uppercase tracking-wider'>
              <tr>
                <th class='p-tide-gap-sm pl-tide-gap-md font-bold'>测点名称</th>
                <th class='p-tide-gap-sm font-bold'>地址</th>
                <th class='p-tide-gap-sm font-bold'>数据类型</th>
                <th class='p-tide-gap-sm pr-tide-gap-md font-bold text-right'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody class='font-tide-body-sm text-tide-body-sm text-tide-on-surface divide-y divide-tide-outline-variant/30 bg-white'>
              {props.loading ? (
                <tr>
                  <td colspan='4' class='p-8 text-center text-tide-outline'>
                    <span class='material-symbols-outlined text-[24px] animate-spin inline-block mr-2'>
                      sync
                    </span>
                    <span class='font-tide-body-sm'>加载中...</span>
                  </td>
                </tr>
              ) : props.tags.length === 0 ? (
                <tr>
                  <td
                    colspan='4'
                    class='p-8 text-center text-tide-outline font-tide-body-sm'
                  >
                    <span class='material-symbols-outlined text-[32px] block mx-auto mb-2'>
                      playlist_remove
                    </span>
                    暂无已导入测点
                  </td>
                </tr>
              ) : (
                props.tags.map((tag) => (
                  <tr class='hover:bg-tide-surface-container-low transition-colors'>
                    <td class='p-tide-gap-sm pl-tide-gap-md font-medium'>
                      {tag.tagName || '-'}
                    </td>
                    <td class='p-tide-gap-sm font-tide-mono-data text-tide-mono-data text-tide-on-surface-variant'>
                      {tag.tagAddress || '-'}
                    </td>
                    <td class='p-tide-gap-sm'>{tag.dataType || '-'}</td>
                    <td class='p-tide-gap-sm pr-tide-gap-md text-right'>
                      <button
                        class='text-tide-error/80 hover:text-tide-error transition-colors font-tide-label-md text-tide-label-md disabled:opacity-50'
                        onClick={() => emit('delete', tag.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {props.totalPages > 1 && (
          <div class='flex items-center justify-between gap-4 text-tide-body-sm'>
            <span class='text-tide-outline font-tide-body-sm'>
              共 {props.totalPages} 页
            </span>
            <div class='flex items-center gap-2'>
              <button
                class='p-1.5 rounded-tide border border-tide-outline-variant hover:bg-tide-surface-container disabled:opacity-30 transition-colors'
                disabled={props.page <= 1}
                onClick={() => emit('update:page', props.page - 1)}
              >
                <span class='material-symbols-outlined text-[16px]'>
                  chevron_left
                </span>
              </button>
              <span class='px-3 py-1 rounded-tide bg-tide-primary text-tide-on-primary font-tide-label-md text-tide-label-md'>
                {props.page}
              </span>
              <button
                class='p-1.5 rounded-tide border border-tide-outline-variant hover:bg-tide-surface-container disabled:opacity-30 transition-colors'
                disabled={props.page >= props.totalPages}
                onClick={() => emit('update:page', props.page + 1)}
              >
                <span class='material-symbols-outlined text-[16px]'>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
})
