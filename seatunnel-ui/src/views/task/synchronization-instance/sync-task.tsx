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
  onUnmounted,
  PropType,
  toRefs,
  watch,
  ref,
  reactive,
  computed
} from 'vue'
import { useSyncTask } from './use-sync-task'
import type { StatusFilter } from './use-sync-task'
import {
  NDataTable,
  NPagination,
  NInput,
  NSelect,
  NDatePicker,
  NIcon,
  NButton,
  NPopover
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import LogModal from '@/components/log-modal'
import LogViewerModal from './log-viewer-modal'
import { useAsyncState } from '@vueuse/core'
import { queryLog } from '@/service/log'
import { LogRes } from '@/service/log/types'
import ColumnSelector from '@/components/column-selector'
import { getRangeShortCuts } from '@/utils/timePickeroption'
import { useRoute, useRouter } from 'vue-router'
import {
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  RotateLeftOutlined,
  DeleteOutlined,
  RedoOutlined
} from '@vicons/antd'

const props = {
  syncTaskType: {
    type: String as PropType<string>,
    default: 'BATCH'
  }
}

/** 筛选类路由 query 键：重写 query 时先整体剔除，避免旧筛选残留在地址栏 */
const FILTER_QUERY_KEYS = [
  'taskName',
  'executeUser',
  'host',
  'stateType',
  'timePreset',
  'startDate',
  'endDate'
]

const SyncTask = defineComponent({
  name: 'SyncTask',
  props,
  setup(props) {
    let logTimer: ReturnType<typeof setTimeout>
    let pollTimer: ReturnType<typeof setTimeout> | null = null
    let searchTimer: ReturnType<typeof setTimeout> | null = null
    const pollInterval = props.syncTaskType === 'STREAMING' ? 3000 : 30000
    const { t, locale } = useI18n()
    const {
      variables,
      getTableData,
      buildQueryParams,
      createColumns,
      onReset,
      loadUserOptions,
      setStatusFilter,
      setTimePreset,
      applyCustomTime,
      clearCustomTime,
      onBatchDelete,
      onBatchRetry
    } = useSyncTask(props.syncTaskType)
    const route = useRoute()
    const router = useRouter()

    const tableColumn = ref([]) as any
    const customTimeOpen = ref(false)

    const stats = computed(() => {
      const data = variables.tableData || []
      let running = 0
      let success = 0
      let failed = 0
      for (const row of data as any[]) {
        const s = row.jobStatus || row.state || row.status
        if (!s) continue
        if (s === 'RUNNING' || s === 'SUBMITTED_SUCCESS') running++
        else if (s === 'SUCCESS' || s === 'FINISHED' || s === 'FORCED_SUCCESS')
          success++
        else if (s === 'FAILURE' || s === 'FAILED') failed++
      }
      return {
        total: variables.total,
        // 优先用后端全局计数（同过滤条件全量聚合）；后端未返回时退回当前页本地计数
        running: variables.runningCount ?? running,
        success: variables.successCount ?? success,
        failed: variables.failedCount ?? failed
      }
    })

    // 状态药丸角标：all 取不受 stateType 影响的全量计数，其余取后端同口径分组计数
    const pillCounts = computed(() => ({
      all: variables.allCount || variables.total,
      running: stats.value.running,
      success: stats.value.success,
      failed: stats.value.failed
    }))

    const tableTitle = computed(() =>
      props.syncTaskType === 'STREAMING'
        ? t('project.synchronization_instance.streaming_log_list')
        : t('project.synchronization_instance.offline_log_list')
    )

    const requestData = () => {
      variables.checkedRowKeys = []
      getTableData(buildQueryParams())
    }

    // 上一轮请求完全结束后延迟 pollInterval 再发起下一次，避免请求堆积
    const pollData = async () => {
      await getTableData(buildQueryParams(), true)
      pollTimer = setTimeout(pollData, pollInterval)
    }
    const stopPolling = () => {
      if (pollTimer) {
        clearTimeout(pollTimer)
        pollTimer = null
      }
    }
    const rangeShortCuts = reactive({
      rangeOption: {}
    })
    rangeShortCuts.rangeOption = getRangeShortCuts(t)

    const onUpdatePageSize = () => {
      variables.page = 1
      requestData()
    }

    /** 执行用户下拉 / 输入类筛选变更后：回到第一页重新查询 */
    const onFilterChange = () => {
      variables.page = 1
      requestData()
    }

    const getLogs = (row: any) => {
      const { state } = useAsyncState(
        queryLog({
          taskInstanceId: Number(row.id),
          limit: variables.limit,
          skipLineNum: variables.skipLineNum
        }).then((res: LogRes) => {
          if (res.log) {
            variables.logRef += res.log
          }
          if (res.hasNext) {
            variables.limit += 1000
            variables.skipLineNum += 1000
            clearTimeout(logTimer)
            logTimer = setTimeout(() => {
              getLogs(row)
            }, 2000)
          } else {
            variables.logLoadingRef = false
          }
        }),
        null
      )

      return state
    }

    const refreshLogs = (row: any) => {
      variables.logRef = ''
      variables.limit = 1000
      variables.skipLineNum = 0
      getLogs(row)
    }

    const handleSearch = () => {
      variables.page = 1

      const query: Record<string, string> = {
        syncTaskType: props.syncTaskType
      }
      if (variables.taskName) {
        query.taskName = variables.taskName
      }
      if (variables.executeUser) {
        query.executeUser = variables.executeUser
      }
      if (variables.host) {
        query.host = variables.host
      }
      if (variables.stateType) {
        query.stateType = variables.stateType
      }
      if (variables.timePreset) {
        query.timePreset = variables.timePreset
      }
      if (variables.timePreset === 'custom') {
        const [start, end] = variables.customTimeRange || []
        if (start && end) {
          query.startDate = start
          query.endDate = end
        }
      }

      const nextQuery: Record<string, any> = { ...route.query }
      FILTER_QUERY_KEYS.forEach((key) => delete nextQuery[key])
      router.replace({ query: { ...nextQuery, ...query } })
      requestData()
    }

    /** 任务名称输入防抖触发查询（设计稿为实时过滤，这里加 400ms 防抖避免逐键请求） */
    const onTaskNameChange = (value: string) => {
      variables.taskName = value
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(() => handleSearch(), 400)
    }

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (searchTimer) clearTimeout(searchTimer)
        handleSearch()
      }
    }

    const initSearch = () => {
      const { startDate, endDate, timePreset } = route.query
      variables.taskName = (route.query.taskName as string) || ''
      variables.executeUser = (route.query.executeUser as string) || ''
      variables.host = (route.query.host as string) || ''
      variables.stateType = (route.query.stateType as string) || ''
      if (startDate && endDate) {
        variables.timePreset = 'custom'
        variables.customTimeRange = [startDate as string, endDate as string]
      } else if (
        timePreset === '24h' ||
        timePreset === '7d' ||
        timePreset === '30d'
      ) {
        variables.timePreset = timePreset
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (!pollTimer) {
        pollData()
      }
    }

    onMounted(() => {
      initSearch()
      createColumns(variables)
      loadUserOptions()
      document.addEventListener('visibilitychange', onVisibilityChange)
      pollData()
    })

    onUnmounted(() => {
      clearTimeout(logTimer)
      if (searchTimer) clearTimeout(searchTimer)
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    })

    watch(locale, () => {
      createColumns(variables)
      rangeShortCuts.rangeOption = getRangeShortCuts(t)
    })

    watch(
      () => variables.showModalRef,
      () => {
        if (variables.showModalRef) {
          getLogs(variables.row)
        } else {
          variables.row = {}
          variables.logRef = ''
          variables.logLoadingRef = true
          variables.skipLineNum = 0
          variables.limit = 1000
          clearTimeout(logTimer)
        }
      }
    )

    const handleChangeColumn = (options: any) => {
      tableColumn.value = options
    }

    const onApplyCustomTime = () => {
      if (applyCustomTime()) {
        customTimeOpen.value = false
      }
    }

    const onClearCustomTime = () => {
      clearCustomTime()
      customTimeOpen.value = false
    }

    const onResetFilter = () => {
      customTimeOpen.value = false
      onReset()
    }

    return {
      t,
      ...toRefs(variables),
      stats,
      pillCounts,
      tableTitle,
      customTimeOpen,
      requestData,
      onUpdatePageSize,
      onFilterChange,
      refreshLogs,
      handleSearch,
      onTaskNameChange,
      handleKeyup,
      handleChangeColumn,
      onApplyCustomTime,
      onClearCustomTime,
      onResetFilter,
      setStatusFilter,
      setTimePreset,
      onBatchDelete,
      onBatchRetry,
      tableColumn,
      rangeShortCuts
    }
  },
  render() {
    const { t } = this

    const statusPills: Array<{
      value: StatusFilter
      label: string
      count: number
      dot: string
    }> = [
      {
        value: '',
        label: t('project.synchronization_instance.status_all'),
        count: this.pillCounts.all,
        dot: ''
      },
      {
        value: 'RUNNING',
        label: t('project.synchronization_instance.running'),
        count: this.pillCounts.running,
        dot: 'bg-blue-500'
      },
      {
        value: 'SUCCESS',
        label: t('project.synchronization_instance.success'),
        count: this.pillCounts.success,
        dot: 'bg-emerald-500'
      },
      {
        value: 'FAILED',
        label: t('project.synchronization_instance.fail'),
        count: this.pillCounts.failed,
        dot: 'bg-rose-500'
      }
    ]

    const timePresets = [
      { value: '24h', label: t('project.synchronization_instance.preset_24h') },
      { value: '7d', label: t('project.synchronization_instance.preset_7d') },
      { value: '30d', label: t('project.synchronization_instance.preset_30d') }
    ]

    const [customStart, customEnd] = this.customTimeRange || []
    const customLabel =
      this.timePreset === 'custom' && customStart && customEnd
        ? `${String(customStart).slice(0, 10)} ~ ${String(customEnd).slice(
            0,
            10
          )}`
        : t('project.synchronization_instance.preset_custom')

    const rangeStart = this.total > 0 ? (this.page - 1) * this.pageSize + 1 : 0
    const rangeEnd = Math.min(this.page * this.pageSize, this.total)

    const renderFilterConsole = () => (
      <div class='bg-white rounded-xl border border-[#E5E7EB] shadow-sm'>
        <div class='flex items-center justify-between gap-3 border-b border-[#F3F4F6] px-3 py-2.5 flex-wrap'>
          <div class='flex items-center gap-2 text-xs flex-wrap'>
            <span class='font-semibold text-slate-600 flex items-center gap-1 mr-1'>
              <NIcon size={13} class='text-blue-500'>
                <FilterOutlined />
              </NIcon>
              <span>
                {t('project.synchronization_instance.running_status')}:
              </span>
            </span>
            {statusPills.map((pill) => {
              const active = this.stateType === pill.value
              return (
                <button
                  key={pill.value || 'all'}
                  onClick={() => this.setStatusFilter(pill.value)}
                  class={[
                    'px-3 py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1.5',
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  ]}
                >
                  {pill.dot && (
                    <span
                      class={`w-1.5 h-1.5 rounded-full ${pill.dot} inline-block`}
                    />
                  )}
                  <span>{pill.label}</span>
                  <span
                    class={[
                      'text-[10px] px-1.5 py-px rounded-full font-mono',
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    ]}
                  >
                    {pill.count}
                  </span>
                </button>
              )
            })}
          </div>
          <div class='text-xs text-slate-400 font-mono'>
            {t('project.synchronization_instance.filtered_count', {
              count: this.total
            })}
          </div>
        </div>

        <div class='flex items-center justify-between gap-3 px-3 py-2.5 flex-wrap'>
          <div class='flex items-center gap-2 flex-1 min-w-[260px] max-w-2xl'>
            <NInput
              value={this.taskName}
              onUpdate:value={this.onTaskNameChange}
              onKeyup={this.handleKeyup}
              placeholder={t(
                'project.synchronization_instance.search_placeholder'
              )}
              clearable
              class='flex-1'
            >
              {{
                prefix: () => (
                  <NIcon size={14} class='text-slate-400'>
                    <SearchOutlined />
                  </NIcon>
                )
              }}
            </NInput>
            <div class='w-44 shrink-0'>
              <NSelect
                value={this.executeUser || ''}
                options={[
                  {
                    label: t('project.synchronization_instance.all_executors'),
                    value: ''
                  },
                  ...this.userOptions
                ]}
                onUpdate:value={(v: string | null) => {
                  this.executeUser = v || ''
                  this.onFilterChange()
                }}
                placeholder={t('project.synchronization_instance.execute_user')}
                clearable
              />
            </div>
          </div>

          <div class='flex items-center gap-2 shrink-0'>
            <span class='text-xs text-slate-400'>
              {t('project.synchronization_instance.time_range')}:
            </span>
            <div class='bg-slate-50 p-0.5 rounded-lg border border-slate-200 flex items-center gap-0.5'>
              {timePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => this.setTimePreset(preset.value as any)}
                  class={[
                    'px-2.5 py-1 rounded text-[11px] transition',
                    this.timePreset === preset.value
                      ? 'bg-white text-blue-600 font-medium border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  ]}
                >
                  {preset.label}
                </button>
              ))}
              <NPopover
                show={this.customTimeOpen}
                onUpdateShow={(v: boolean) => (this.customTimeOpen = v)}
                trigger='click'
                placement='bottom-end'
                v-slots={{
                  trigger: () => (
                    <button
                      class={[
                        'px-2.5 py-1 rounded text-[11px] transition flex items-center gap-1',
                        this.timePreset === 'custom'
                          ? 'bg-white text-blue-600 font-medium border border-slate-200 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      ]}
                    >
                      <NIcon size={11}>
                        <CalendarOutlined />
                      </NIcon>
                      <span>{customLabel}</span>
                    </button>
                  )
                }}
              >
                <div class='w-[320px] space-y-3'>
                  <div class='flex items-center justify-between border-b border-slate-100 pb-2'>
                    <span class='text-xs font-semibold text-slate-700 flex items-center gap-1.5'>
                      <NIcon size={13} class='text-blue-500'>
                        <CalendarOutlined />
                      </NIcon>
                      {t('project.synchronization_instance.custom_time_range')}
                    </span>
                  </div>
                  <NDatePicker
                    type='datetimerange'
                    v-model:formattedValue={[
                      this.customTimeRange,
                      'formattedValue'
                    ]}
                    start-placeholder={t(
                      'project.synchronization_instance.start_time'
                    )}
                    end-placeholder={t(
                      'project.synchronization_instance.end_time'
                    )}
                    shortcuts={this.rangeShortCuts.rangeOption}
                    clearable={false}
                    style={{ width: '100%' }}
                  />
                  <div class='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
                    <NButton size='small' onClick={this.onClearCustomTime}>
                      {t('project.synchronization_instance.reset_filter')}
                    </NButton>
                    <NButton
                      size='small'
                      type='primary'
                      onClick={this.onApplyCustomTime}
                    >
                      {t('project.synchronization_instance.apply_time')}
                    </NButton>
                  </div>
                </div>
              </NPopover>
            </div>

            <div class='h-4 w-px bg-slate-200 mx-1' />

            <NButton size='small' onClick={this.onResetFilter}>
              <NIcon size={13}>
                <RotateLeftOutlined />
              </NIcon>
              <span class='ml-1'>
                {t('project.synchronization_instance.reset_filter')}
              </span>
            </NButton>
          </div>
        </div>
      </div>
    )

    const renderToolbar = () => (
      <div class='px-3 py-2 border-b border-[#F3F4F6] flex items-center justify-between gap-3 text-xs'>
        <div class='flex items-center gap-3 min-w-0 flex-wrap'>
          <span class='font-semibold text-slate-700 whitespace-nowrap'>
            {this.tableTitle}
          </span>
          {this.checkedRowKeys.length > 0 && (
            <div class='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1'>
              <span class='text-slate-600'>
                {t('project.synchronization_instance.batch_selected', {
                  count: this.checkedRowKeys.length
                })}
              </span>
              <div class='w-px h-3 bg-slate-200' />
              <NButton
                size='small'
                type='error'
                ghost
                loading={this.batchLoading}
                onClick={this.onBatchDelete}
              >
                <NIcon size={13}>
                  <DeleteOutlined />
                </NIcon>
                <span class='ml-1'>
                  {t('project.synchronization_instance.batch_delete')}
                </span>
              </NButton>
              <NButton
                size='small'
                type='primary'
                ghost
                loading={this.batchLoading}
                onClick={this.onBatchRetry}
              >
                <NIcon size={13}>
                  <RedoOutlined />
                </NIcon>
                <span class='ml-1'>
                  {t('project.synchronization_instance.batch_retry')}
                </span>
              </NButton>
            </div>
          )}
        </div>
        <div class='shrink-0'>
          <ColumnSelector
            tableKey='taskInstance'
            tableColumns={this.columns}
            onChangeOptions={this.handleChangeColumn}
          />
        </div>
      </div>
    )

    return (
      <div class='h-full flex flex-col gap-2.5 overflow-hidden'>
        {renderFilterConsole()}
        <div class='bg-white rounded-xl border border-[#E5E7EB] shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden'>
          {renderToolbar()}
          <div class='flex-1 overflow-auto'>
            <NDataTable
              loading={this.loadingRef}
              columns={this.tableColumn}
              data={this.tableData}
              rowKey={(row) => row.id}
              scrollX={this.tableWidth}
              v-model:checked-row-keys={this.checkedRowKeys}
            />
          </div>
          <div class='px-3 py-2 border-t border-[#F3F4F6] flex items-center justify-between gap-3 text-xs text-slate-500'>
            <span class='font-mono'>
              {t('project.synchronization_instance.page_range', {
                start: rangeStart,
                end: rangeEnd,
                total: this.total
              })}
            </span>
            <NPagination
              v-model:page={this.page}
              v-model:page-size={this.pageSize}
              page-count={this.totalPage}
              item-count={this.total}
              show-size-picker
              page-sizes={[10, 30, 50]}
              show-quick-jumper
              onUpdatePage={this.requestData}
              onUpdatePageSize={this.onUpdatePageSize}
            />
          </div>
        </div>
        <LogModal
          showModalRef={this.showModalRef}
          logRef={this.logRef}
          row={this.row}
          logLoadingRef={this.logLoadingRef}
          onConfirmModal={() => (this.showModalRef = false)}
          onRefreshLogs={this.refreshLogs}
        />
        <LogViewerModal
          show={this.showLogViewerModal}
          jobId={this.currentJobId}
          jobName={this.currentJobName}
          onUpdateShow={(v: boolean) => (this.showLogViewerModal = v)}
        />
      </div>
    )
  }
})

export { SyncTask }
