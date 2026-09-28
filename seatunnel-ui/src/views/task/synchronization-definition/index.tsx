/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  defineComponent,
  onMounted,
  onBeforeUnmount,
  toRefs,
  watch,
  computed,
  ref,
  h,
  nextTick
} from 'vue'
import {
  NButton,
  NButtonGroup,
  NInput,
  NIcon,
  NDataTable,
  NSelect
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import {
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  MergeCellsOutlined,
  CaretLeftOutlined,
  CaretRightOutlined
} from '@vicons/antd'
import { I18N_KEYS } from '@/common/i18n-keys'
import { useTable } from './use-table'
import { TaskModal } from './task-modal'
import { ScheduleModal } from './schedule-modal'
import TaskCard from '@/components/task-card'
import { useRoute, useRouter } from 'vue-router'
import isEmpty from 'lodash/isEmpty'
import type { Task, TaskStats } from '@/types/task'

const SynchronizationDefinition = defineComponent({
  name: 'SynchronizationDefinition',
  setup() {
    const { t, locale } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const {
      variables,
      createColumns,
      getTableData,
      handleRun,
      handleDelete,
      loadingStates
    } = useTable()

    const viewMode = ref((route.query.view as string) || 'table')

    const toggleView = (mode: 'table' | 'card') => {
      viewMode.value = mode
      router.replace({ query: { ...route.query, view: mode } })
    }

    const handleEdit = (task: Task) => {
      router.push({
        path: `/task/synchronization-definition/${task.id}`,
        query: { jobMode: task.jobMode }
      })
    }

    // 类型筛选：所有 / 数据集成 / 结构同步（参考页核心差异）
    const jobTypeFilter = ref('')
    const taskTypeOptions = computed(() => [
      {
        label: t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.ALL_TASK_TYPES),
        value: ''
      },
      {
        label: t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.DATA_INTEGRATION),
        value: 'DATA_INTEGRATION'
      },
      {
        label: t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.WHOLE_LIBRARY_SYNC),
        value: 'whole_library_sync'
      }
    ])

    const isReplicaType = (jobType?: string) =>
      !!jobType &&
      (jobType === 'DATA_REPLICA' || jobType === 'whole_library_sync')

    // 类型筛选项：数据集成 -> DATA_INTEGRATION；结构同步 -> 整库/结构同步
    const filterData = (rows: Task[]) => {
      if (!jobTypeFilter.value) return rows
      return rows.filter((row: Task) => {
        const jobType = row.jobType
        if (jobTypeFilter.value === 'DATA_INTEGRATION')
          return jobType === 'DATA_INTEGRATION'
        return isReplicaType(jobType)
      })
    }

    const filteredTableData = computed(() =>
      filterData((variables.tableData || []) as Task[])
    )

    const paginationSummary = computed(() => {
      const total = variables.totalCount || 0
      const page = variables.page || 1
      const pageSize = variables.pageSize || 0
      const start = total === 0 ? 0 : (page - 1) * pageSize + 1
      const end = total === 0 ? 0 : Math.min(page * pageSize, total)
      return t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.PAGINATION_SUMMARY, {
        start,
        end,
        total
      })
    })

    const pageItems = computed(() => {
      const total = variables.totalPage || 1
      const current = variables.page || 1
      const pages: (number | '...')[] = []
      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i)
      } else {
        const start = Math.max(1, current - 2)
        const end = Math.min(total, current + 2)
        if (start > 1) {
          pages.push(1)
          if (start > 2) pages.push('...')
        }
        for (let i = start; i <= end; i++) pages.push(i)
        if (end < total) {
          if (end < total - 1) pages.push('...')
          pages.push(total)
        }
      }
      return pages
    })

    const jumpToPage = (val: string) => {
      const p = Number.parseInt(val, 10)
      if (Number.isNaN(p) || p < 1 || p > (variables.totalPage || 1)) return
      variables.page = p
      requestData()
    }

    const onReset = () => {
      variables.searchName = ''
      jobTypeFilter.value = ''
      if ('searchName' in route.query) {
        router.replace({
          query: { ...route.query, searchName: undefined }
        })
      }
      variables.page = 1
      requestData()
    }

    const onRefresh = () => {
      requestData()
    }

    const stats = computed((): TaskStats => {
      const data = (variables.tableData || []) as Task[]
      let running = 0
      let structSync = 0
      let dataIntegration = 0
      for (const row of data) {
        const s = row.status || row.jobStatus
        if (
          s &&
          (s === 'SUBMITTED_SUCCESS' ||
            s === 'RUNNING_EXECUTION' ||
            s === 'RUNNING')
        )
          running++
        const jt = row.jobType
        if (jt === 'DATA_REPLICA' || jt === 'whole_library_sync') structSync++
        else if (jt === 'DATA_INTEGRATION') dataIntegration++
      }
      return {
        total: variables.totalCount,
        running,
        structSync,
        dataIntegration
      }
    })

    const requestData = () => {
      getTableData({
        pageSize: variables.pageSize,
        pageNo: variables.page,
        searchName: variables.searchName
      })
    }

    const onCancelModal = () => {
      variables.showModalRef = false
    }

    const onConfirmModal = () => {
      variables.showModalRef = false
      requestData()
    }

    const onCancelScheduleModal = () => {
      variables.scheduleModalRef = false
    }

    const onConfirmScheduleModal = () => {
      variables.scheduleModalRef = false
      requestData()
    }

    const handleModalChange = () => {
      variables.showModalRef = true
    }

    const onSearch = () => {
      variables.page = 1

      const query = {} as any
      if (variables.searchName) {
        query.searchName = variables.searchName
      }

      router.replace({
        query: !isEmpty(query)
          ? {
              ...query,
              ...route.query
            }
          : {
              ...route.query
            }
      })
      requestData()
    }

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onSearch()
      }
    }

    const initSearch = () => {
      const { searchName } = route.query
      if (searchName) {
        variables.searchName = searchName as string
      }
    }

    onMounted(() => {
      initSearch()
      createColumns(variables)
      requestData()
    })

    watch(locale, () => {
      createColumns(variables)
    })

    watch(
      () => route.meta.jobMode,
      () => {
        variables.page = 1
        requestData()
      }
    )

    // —— 列表行高自适应：让表格填充卡片剩余高度，行数少时拉伸、行数多时定格 ——
    const tableWrapRef = ref<HTMLElement | null>(null)
    let resizeObserver: ResizeObserver | null = null

    const setTableWrapRef = (el: unknown) => {
      tableWrapRef.value = (el as HTMLElement | null) || null
    }

    const applyAdaptiveRowHeight = () => {
      const wrap = tableWrapRef.value
      if (!wrap || viewMode.value !== 'table') return
      const scroller = wrap.querySelector<HTMLElement>('.n-scrollbar-container')
      if (!scroller) return
      // thead 位于滚动容器外部（frame 内、scroller 上方），可用的行区域即容器高度
      const available = scroller.clientHeight
      const rows = filteredTableData.value.length
      if (!rows || available <= 0) return
      // 固定按 10 行均分：数据不足 10 行时，底部留出与行高一致的空行位（视觉整齐）；
      // 数据超过 10 行时保持该行高，容器内部滚动。
      const TARGET_ROWS = 10
      const MIN_ROW_H = 44
      let rowH = available / TARGET_ROWS
      if (rowH < MIN_ROW_H) rowH = MIN_ROW_H
      wrap.style.setProperty('--st-row-h', `${rowH}px`)
    }

    onMounted(() => {
      nextTick(applyAdaptiveRowHeight)
      resizeObserver = new ResizeObserver(() => applyAdaptiveRowHeight())
      resizeObserver.observe(document.body)
    })

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      resizeObserver = null
    })

    watch(filteredTableData, () => {
      nextTick(applyAdaptiveRowHeight)
    })

    watch(viewMode, () => {
      nextTick(applyAdaptiveRowHeight)
    })

    return {
      t,
      ...toRefs(variables),
      stats,
      viewMode,
      handleEdit,
      handleRun,
      handleDelete,
      loadingStates,
      taskTypeOptions,
      jobTypeFilter,
      filteredTableData,
      paginationSummary,
      pageItems,
      jumpToPage,
      onReset,
      onRefresh,
      requestData,
      onCancelModal,
      onConfirmModal,
      onCancelScheduleModal,
      onConfirmScheduleModal,
      handleModalChange,
      onSearch,
      handleKeyup,
      toggleView,
      tableWrapRef,
      setTableWrapRef
    }
  },
  render() {
    const renderSearchBar = () => (
      <div class='bg-white rounded-xl border border-[#E5E7EB] shadow-sm px-4 py-3.5 flex items-center justify-between gap-4'>
        <div class='flex items-center gap-3'>
          <NInput
            clearable
            v-model={[this.searchName, 'value']}
            placeholder={this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.TASK_NAME)}
            onKeyup={this.handleKeyup}
            style={{ width: '220px' }}
          />
          <NButton type='primary' onClick={this.onSearch}>
            <NIcon>
              <SearchOutlined />
            </NIcon>
          </NButton>
          <NSelect
            v-model:value={this.jobTypeFilter}
            options={this.taskTypeOptions}
            placeholder={this.t(
              I18N_KEYS.SYNCHRONIZATION_DEFINITION.ALL_TASK_TYPES
            )}
            style={{ width: '160px' }}
          />
          <NButton onClick={this.onReset}>
            {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.RESET)}
          </NButton>
        </div>
        <div class='flex items-center gap-3'>
          <NButtonGroup size='small'>
            <NButton
              type={this.viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => this.toggleView('table')}
            >
              {{
                icon: () =>
                  h(NIcon, null, { default: () => h(UnorderedListOutlined) })
              }}
            </NButton>
            <NButton
              type={this.viewMode === 'card' ? 'primary' : 'default'}
              onClick={() => this.toggleView('card')}
            >
              {{
                icon: () =>
                  h(NIcon, null, { default: () => h(AppstoreOutlined) })
              }}
            </NButton>
          </NButtonGroup>
          <NButton title={this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.REFRESH)} onClick={this.onRefresh}>
            {{
              icon: () => h(NIcon, null, { default: () => h(ReloadOutlined) })
            }}
          </NButton>
          <NButton type='info' onClick={this.handleModalChange}>
            {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.CREATE_TASK)}
          </NButton>
        </div>
      </div>
    )

    const renderStatCards = () => (
      <div class='grid grid-cols-2 lg:grid-cols-4 gap-3.5'>
        <div class='bg-white rounded-xl p-3 px-4 border border-slate-200/80 shadow-sm flex items-center justify-between'>
          <div class='flex items-center gap-3'>
            <div class='w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base flex-shrink-0'>
              <NIcon size={17}>
                <AppstoreOutlined />
              </NIcon>
            </div>
            <div>
              <p class='text-[11px] font-medium text-slate-500'>
                {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.TOTAL_TASKS)}
              </p>
              <div class='flex items-baseline gap-2'>
                <span class='text-xl font-bold text-slate-800'>
                  {this.stats.total}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class='bg-white rounded-xl p-3 px-4 border border-slate-200/80 shadow-sm flex items-center justify-between'>
          <div class='flex items-center gap-3'>
            <div class='w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-base flex-shrink-0'>
              <NIcon size={17}>
                <ThunderboltOutlined />
              </NIcon>
            </div>
            <div>
              <p class='text-[11px] font-medium text-slate-500'>
                {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.RUNNING_TASKS)}
              </p>
              <div class='flex items-baseline gap-2'>
                <span class='text-xl font-bold text-amber-600'>
                  {this.stats.running}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class='bg-white rounded-xl p-3 px-4 border border-slate-200/80 shadow-sm flex items-center justify-between'>
          <div class='flex items-center gap-3'>
            <div class='w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-base flex-shrink-0'>
              <NIcon size={17}>
                <ApartmentOutlined />
              </NIcon>
            </div>
            <div>
              <p class='text-[11px] font-medium text-slate-500'>
                {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.WHOLE_LIBRARY_SYNC)}
              </p>
              <div class='flex items-baseline gap-2'>
                <span class='text-xl font-bold text-slate-800'>
                  {this.stats.structSync}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class='bg-white rounded-xl p-3 px-4 border border-slate-200/80 shadow-sm flex items-center justify-between'>
          <div class='flex items-center gap-3'>
            <div class='w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base flex-shrink-0'>
              <NIcon size={17}>
                <MergeCellsOutlined />
              </NIcon>
            </div>
            <div>
              <p class='text-[11px] font-medium text-slate-500'>
                {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.DATA_INTEGRATION)}
              </p>
              <div class='flex items-baseline gap-2'>
                <span class='text-xl font-bold text-emerald-600'>
                  {this.stats.dataIntegration}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    const renderCompactPagination = () => (
      <div class='flex items-center gap-3'>
        <div class='flex items-center gap-1.5'>
          <span>{this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.PER_PAGE)}:</span>
          <select
            class='bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500'
            value={this.pageSize}
            onChange={(e: any) => {
              this.pageSize = Number(e.target.value)
              this.page = 1
              this.requestData()
            }}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.ITEMS_PER_PAGE, {
                  count: size
                })}
              </option>
            ))}
          </select>
        </div>
        <div class='flex items-center gap-1'>
          <button
            class='w-7 h-7 rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center'
            disabled={this.page <= 1}
            onClick={() => {
              this.page = (this.page || 1) - 1
              this.requestData()
            }}
          >
            <NIcon size={10}>
              <CaretLeftOutlined />
            </NIcon>
          </button>
          {this.pageItems.map((p: number | '...', idx: number) =>
            p === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                class='w-7 h-7 flex items-center justify-center text-slate-400'
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                class={`w-7 h-7 rounded border flex items-center justify-center text-xs font-semibold transition ${
                  p === this.page
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => {
                  this.page = p
                  this.requestData()
                }}
              >
                {p}
              </button>
            )
          )}
          <button
            class='w-7 h-7 rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center'
            disabled={this.page >= (this.totalPage || 1)}
            onClick={() => {
              this.page = (this.page || 1) + 1
              this.requestData()
            }}
          >
            <NIcon size={10}>
              <CaretRightOutlined />
            </NIcon>
          </button>
        </div>
        <div class='flex items-center gap-1.5 pl-2'>
          <span>{this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.JUMP_TO)}</span>
          <input
            type='text'
            value={this.page}
            class='w-10 text-center bg-white border border-slate-200 rounded py-1 focus:outline-none focus:ring-1 focus:ring-blue-500'
            onKeydown={(e: any) => {
              if (e.key === 'Enter') this.jumpToPage(e.target.value)
            }}
          />
          <span>{this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.PAGE_UNIT)}</span>
        </div>
      </div>
    )

    const renderTableView = () => (
      <div
        ref={(el: any) => {
          this.setTableWrapRef(el)
        }}
        class='bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col'
      >
        <div class='overflow-x-auto st-offline-table flex-1 min-h-0'>
          <NDataTable
            flex-height
            loading={this.loadingRef}
            columns={this.columns}
            data={this.filteredTableData}
            scroll-x={this.columns.reduce(
              (total: number, col: any) => total + (col.width || 120),
              0
            )}
          />
        </div>
        <div class='px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 flex-shrink-0'>
          <div data-testid='table-footer-summary'>
            {this.paginationSummary}
          </div>
          {renderCompactPagination()}
        </div>
      </div>
    )

    const renderCardView = () => (
      <div class='bg-white rounded-xl border border-[#E5E7EB] shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden'>
        <div class='flex-1 min-h-0 overflow-y-auto p-3'>
          <div class='grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3'>
            {this.filteredTableData.map((task: Task) => (
              <TaskCard
                task={task}
                onEdit={this.handleEdit}
                onRun={this.handleRun}
                onDelete={this.handleDelete}
                loadingStates={this.loadingStates}
              />
            ))}
          </div>
        </div>
        <div class='flex-shrink-0 px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-center'>
          {renderCompactPagination()}
        </div>
      </div>
    )

    return (
      <div class='h-full flex flex-col overflow-hidden pb-6 gap-4'>
        <div class='flex-shrink-0'>{renderStatCards()}</div>
        <div class='flex-shrink-0'>{renderSearchBar()}</div>
        {this.viewMode === 'table' ? renderTableView() : renderCardView()}
        <TaskModal
          showModalRef={this.showModalRef}
          onCancelModal={this.onCancelModal}
          onConfirmModal={this.onConfirmModal}
        />
        <ScheduleModal
          showModalRef={this.scheduleModalRef}
          row={this.scheduleRow}
          onCancelModal={this.onCancelScheduleModal}
          onConfirmModal={this.onConfirmScheduleModal}
        />
      </div>
    )
  }
})

export default SynchronizationDefinition
