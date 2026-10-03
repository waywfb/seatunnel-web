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

import { h, onUnmounted, reactive, ref } from 'vue'
import { format, subDays, subHours } from 'date-fns'
import { useTableLink, useTableOperation } from '@/hooks'
import {
  AlignLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import {
  COLUMN_WIDTH_CONFIG,
  DefaultTableWidth,
  calculateTableWidth
} from '@/common/column-width-config'
import { useRouter } from 'vue-router'
import { ITaskState } from '@/common/types'
import { isJobEndState, tasksState } from '@/common/common'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { useMessage } from 'naive-ui'
import {
  querySyncTaskInstancePaging,
  hanldlePauseJob,
  hanldleRecoverJob,
  hanldleDelJob
} from '@/service/sync-task-instance'
import { queryUserNames } from '@/service/user'
import type { RowKey } from 'naive-ui/lib/data-table/src/interface'
import type { Router } from 'vue-router'
import { getRemainTime } from '@/utils/time'
import ErrorMessageHighlight from './error-message-highlight'

/** 状态筛选药丸取值：all（空）/ 运行中 / 成功 / 失败，后端按同口径状态组过滤 */
export type StatusFilter = '' | 'RUNNING' | 'SUCCESS' | 'FAILED'
/** 时间范围预设：24 小时 / 7 天 / 30 天 / 自定义区间 */
export type TimePreset = '24h' | '7d' | '30d' | 'custom'

/** 默认时间范围：与改版前行为一致取近 30 天（设计稿首屏为 7 天，如需跟随改此处即可） */
export const DEFAULT_TIME_PRESET: TimePreset = '30d'

export function useSyncTask(syncTaskType = 'BATCH') {
  const { t } = useI18n()
  const router: Router = useRouter()
  const message = useMessage()

  const variables = reactive({
    tableWidth: DefaultTableWidth,
    columns: [],
    tableData: [],
    page: ref(1),
    pageSize: ref(10),
    totalPage: ref(1),
    total: ref(0),
    runningCount: ref(null as number | null),
    successCount: ref(null as number | null),
    failedCount: ref(null as number | null),
    loadingRef: ref(false),
    logRef: '',
    logLoadingRef: ref(true),
    showModalRef: ref(false),
    row: {},
    skipLineNum: ref(0),
    limit: ref(1000),
    taskName: ref(''),
    executeUser: ref(''),
    errorMessage: ref(''),
    host: ref(''),
    stateType: '' as string,
    syncTaskType,
    checkedRowKeys: [] as Array<RowKey>,
    // 状态药丸角标：不受 stateType 影响的全量计数（后端 allCount），未返回时退回本地统计
    allCount: ref(0),
    // 时间范围预设与自定义区间（设计稿：24h / 7天 / 30天 / 自定义）
    timePreset: DEFAULT_TIME_PRESET as TimePreset,
    // 空值必须是 null：NDatePicker 的 datetimerange 对空数组会按 [undefined, undefined] 解析并抛错
    customTimeRange: null as Array<string | null> | null,
    userOptions: [] as Array<{ label: string; value: string }>,
    batchLoading: ref(false),
    showLogViewerModal: ref(false),
    currentJobId: ref(''),
    currentJobName: ref(''),
    logNodes: [] as any[],
    selectedLogNode: ref(''),
    logContent: ref(''),
    logLoading: ref(false),
    refreshInterval: ref(5),
    autoScroll: ref(true),
    refreshTimerId: ref(0)
  })

  // 引擎「运行中」状态：这些状态下可以执行 savepoint 暂停
  const runningStates = ['RUNNING', 'RUNNING_EXECUTION', 'SUBMITTED_SUCCESS']
  // 可恢复状态：引擎已做 savepoint 停止，等待从 savepoint 恢复
  // 只有这些状态才应展示「恢复暂停」，终态（FINISHED/FAILED/CANCELED）不应出现
  const resumableStates = ['SAVEPOINT_DONE', 'PAUSED', 'READY_PAUSE']
  // 暂停指令已发出但引擎尚未确认，中间态应禁用重复操作
  const pausingStates = ['DOING_SAVEPOINT', 'PAUSING', 'CANCELING']
  // 引擎侧任务状态丢失（重启/故障转移后引擎返回 UNKNOWABLE）：不可从 savepoint 恢复，
  // 只能重新提交配置拉起，单独展示「重新拉起」按钮，不混入 resumableStates
  const isLost = (jobStatus?: string) => jobStatus === 'UNKNOWABLE'

  const isRunning = (jobStatus?: string) =>
    !!jobStatus && runningStates.includes(jobStatus)

  const isResumable = (jobStatus?: string) =>
    !!jobStatus && resumableStates.includes(jobStatus)

  const isPausing = (jobStatus?: string) =>
    !!jobStatus && pausingStates.includes(jobStatus)

  // 高频跳动驱动：每行锁定锚点毫秒（snapshotAt - runningTime ≈ 真实开始时刻，runningTime 为毫秒），
  // 非终态统一基于 nowTick - anchor 毫秒级单源计时，跨轮询持久，避免双时间基准对账抖动；
  // 100ms 跳动让不足 1 秒的耗时能实时显示毫秒位
  const nowTick = ref(Date.now())
  const rowAnchors = new Map<number, number>()
  const tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 100)
  onUnmounted(() => clearInterval(tickTimer))

  /** 时间范围：预设为滚动窗口，自定义为用户选定区间；返回后端可直接解析的 [start, end] */
  const buildTimeRange = (): [string, string] => {
    const now = new Date()
    if (variables.timePreset === 'custom') {
      const [start, end] = variables.customTimeRange || []
      if (start && end) {
        return [start, end]
      }
    }
    const start =
      variables.timePreset === '24h'
        ? subHours(now, 24)
        : subDays(now, variables.timePreset === '7d' ? 7 : 30)
    return [
      format(start, 'yyyy-MM-dd HH:mm:ss'),
      format(now, 'yyyy-MM-dd HH:mm:ss')
    ]
  }

  /** 列表查询参数：筛选条件统一在此组装，保证手动查询 / 轮询 / 重置三条链路口径一致 */
  const buildQueryParams = (pageNo = variables.page) => {
    const [startDate, endDate] = buildTimeRange()
    return {
      pageNo,
      pageSize: variables.pageSize,
      taskName: variables.taskName,
      executorName: variables.executeUser,
      host: variables.host,
      stateType: variables.stateType,
      startDate,
      endDate,
      syncTaskType: variables.syncTaskType
    }
  }

  const setStatusFilter = (value: StatusFilter) => {
    variables.stateType = value
    variables.page = 1
    variables.checkedRowKeys = []
    getList()
  }

  const setTimePreset = (preset: TimePreset) => {
    variables.timePreset = preset
    variables.page = 1
    variables.checkedRowKeys = []
    getList()
  }

  /** 应用自定义时间区间：校验完整性与先后顺序，成功后切换到 custom 预设并重新查询 */
  const applyCustomTime = () => {
    const [start, end] = variables.customTimeRange || []
    if (!start || !end) {
      window.$message.warning(
        t('project.synchronization_instance.select_time_range')
      )
      return false
    }
    if (start > end) {
      window.$message.warning(
        t('project.synchronization_instance.time_range_invalid')
      )
      return false
    }
    variables.timePreset = 'custom'
    variables.page = 1
    variables.checkedRowKeys = []
    getList()
    return true
  }

  const clearCustomTime = () => {
    variables.customTimeRange = null
    setTimePreset(DEFAULT_TIME_PRESET)
  }

  const loadUserOptions = () => {
    queryUserNames()
      .then((names: unknown) => {
        variables.userOptions = (Array.isArray(names) ? names : [])
          .filter((name): name is string => typeof name === 'string')
          .map((name) => ({ label: name, value: name }))
      })
      .catch(() => {
        variables.userOptions = []
      })
  }

  /** 批量删除：复用单条删除接口并发执行，删完后回到当前页刷新 */
  const onBatchDelete = async () => {
    const ids = ([...variables.checkedRowKeys] as Array<string | number>).map(
      Number
    )
    if (ids.length === 0 || variables.batchLoading) return
    variables.batchLoading = true
    try {
      await Promise.all(ids.map((id) => hanldleDelJob(id)))
      window.$message.success(t('project.synchronization_instance.batch_done'))
      variables.checkedRowKeys = []
      getList()
    } catch (error) {
      // 失败提示由请求拦截器统一弹出，这里只保证状态复位
    } finally {
      variables.batchLoading = false
    }
  }

  /** 批量重试：仅对「可恢复 / 状态丢失」的实例下发恢复指令，与单行按钮口径一致 */
  const onBatchRetry = async () => {
    const ids = ([...variables.checkedRowKeys] as Array<string | number>).map(
      Number
    )
    const eligible = (variables.tableData as any[]).filter(
      (row) =>
        ids.includes(Number(row.id)) &&
        (isResumable(row.jobStatus) || isLost(row.jobStatus))
    )
    if (eligible.length === 0) {
      window.$message.warning(
        t('project.synchronization_instance.no_retriable_task')
      )
      return
    }
    if (variables.batchLoading) return
    variables.batchLoading = true
    try {
      await Promise.all(
        eligible.map((row) => hanldleRecoverJob(Number(row.id)))
      )
      window.$message.success(
        t('project.synchronization_instance.batch_retry_submitted', {
          count: eligible.length
        })
      )
      variables.checkedRowKeys = []
      getList()
    } catch (error) {
      // 失败提示由请求拦截器统一弹出
    } finally {
      variables.batchLoading = false
    }
  }

  //
  const createColumns = (variables: any) => {
    variables.columns = [
      {
        type: 'selection' as const,
        ...COLUMN_WIDTH_CONFIG['selection']
      },
      useTableLink({
        title: t('project.synchronization_definition.task_name'),
        key: 'jobDefineName',
        ...COLUMN_WIDTH_CONFIG['link_name'],
        button: {
          onClick: (row: any) => {
            router.push({
              path: `/task/synchronization-instance/${row.jobDefineId}`,
              query: {
                jobInstanceId: row.id,
                taskName: row.jobDefineName,
                syncTaskType: variables.syncTaskType
              }
            })
          }
        }
      }),
      {
        title: t('project.synchronization_instance.amount_of_data_read'),
        key: 'readRowCount',
        ...COLUMN_WIDTH_CONFIG['tag']
      },
      {
        title: t('project.synchronization_instance.amount_of_data_written'),
        key: 'writeRowCount',
        ...COLUMN_WIDTH_CONFIG['tag']
      },
      {
        title: t('project.synchronization_instance.execute_user'),
        key: 'username',
        ...COLUMN_WIDTH_CONFIG['state']
      },
      {
        title: t('project.synchronization_instance.state'),
        key: 'jobStatus',
        ...COLUMN_WIDTH_CONFIG['state'],
        render: (row: any) => renderStateCell(row.jobStatus, t)
      },
      {
        title: t('project.synchronization_instance.error_message'),
        key: 'parameter',
        ...COLUMN_WIDTH_CONFIG['state'],
        render: (row: any) => {
          return row.errorMessage
            ? h(
                NPopover,
                {
                  trigger: 'click',
                  themeOverrides: {
                    color: '#0f172a',
                    textColor: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow:
                      '0 0 0 1px #334155, 0 12px 32px rgba(0, 0, 0, 0.35)',
                    padding: '0'
                  }
                },
                {
                  trigger: () =>
                    h(
                      NButton,
                      { text: true },
                      {
                        default: () => t('tasks.view')
                      }
                    ),
                  default: () =>
                    h(ErrorMessageHighlight, {
                      params: row.errorMessage
                    })
                }
              )
            : '--'
        }
      },
      {
        title: t('project.synchronization_instance.start_time'),
        key: 'createTime',
        ...COLUMN_WIDTH_CONFIG['time']
      },
      {
        title: t('project.synchronization_instance.end_time'),
        key: 'endTime',
        ...COLUMN_WIDTH_CONFIG['time']
      },
      {
        title: t('project.synchronization_instance.run_time'),
        key: 'runningTime',
        render: (row: any) => {
          if (isJobEndState(row.jobStatus)) {
            return getRemainTime(row.runningTime)
          }
          const anchor = rowAnchors.get(row.id)
          if (anchor === undefined) {
            return getRemainTime(row.runningTime)
          }
          return getRemainTime(Math.max(0, nowTick.value - anchor))
        },
        ...COLUMN_WIDTH_CONFIG['duration']
      },
      useTableOperation({
        title: t('project.synchronization_instance.operation'),
        key: 'operation',
        itemNum: 3,
        buttons: [
          {
            text: t('project.workflow.recovery_suspend'),
            icon: h(PlayCircleOutlined),
            show: (row) => isResumable(row.jobStatus),
            disabled: (row) => isPausing(row.jobStatus),
            onClick: (row) => void handleRecover(row.id)
          },
          {
            text: t('project.workflow.pause'),
            icon: h(PauseCircleOutlined),
            show: (row) => isRunning(row.jobStatus),
            disabled: (row) => isPausing(row.jobStatus),
            onClick: (row) => void handlePause(row.id)
          },
          {
            text: t('project.workflow.lost_resubmit'),
            icon: h(ReloadOutlined),
            show: (row) => isLost(row.jobStatus),
            onClick: (row) => void handleRecover(row.id)
          },
          {
            text: t('project.synchronization_instance.view_logs'),
            icon: h(AlignLeftOutlined),
            onClick: (row) => void handleViewLogs(row)
          },
          {
            isDelete: true,
            text: t('project.synchronization_instance.delete'),
            icon: h(DeleteOutlined),
            onPositiveClick: (row) => void handleDel(row.id),
            positiveText: t('project.synchronization_instance.confirm'),
            popTips: t('project.synchronization_instance.delete_confirm')
          }
        ]
      })
    ]

    if (variables.tableWidth) {
      variables.tableWidth = calculateTableWidth(variables.columns)
    }
  }

  let abortController: AbortController | null = null

  const getTableData = async (params: any, silent = false) => {
    if (variables.loadingRef) return
    if (!silent) {
      variables.loadingRef = true
    }

    // 取消上一次未完成的请求，防御陈旧数据覆盖新数据
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    try {
      const res = await querySyncTaskInstancePaging(params, {
        signal: abortController.signal
      })
      const snapshotAt = Date.now()
      variables.tableData = (res.totalList as any[]).map((row: any) => {
        if (isJobEndState(row.jobStatus)) {
          rowAnchors.delete(row.id)
          return { ...row }
        }
        const anchor = snapshotAt - (row.runningTime || 0)
        const prevAnchor = rowAnchors.get(row.id)
        if (prevAnchor === undefined || Math.abs(anchor - prevAnchor) > 2000) {
          rowAnchors.set(row.id, anchor)
        }
        return { ...row }
      })
      variables.totalPage = res.totalPage
      variables.total = res.total ?? 0
      // allCount 为不受 stateType 影响的全量计数（状态药丸「全部」角标）
      variables.allCount = res.allCount ?? 0
      variables.runningCount = res.runningCount ?? null
      variables.successCount = res.successCount ?? null
      variables.failedCount = res.failedCount ?? null
    } catch (error: any) {
      // 仅处理非取消异常；AbortError 为主动取消，静默忽略
      if (error?.name !== 'AbortError') {
        variables.tableData = [] as any
      }
    } finally {
      if (!silent) {
        variables.loadingRef = false
      }
    }
  }
  const handleRecover = (id: number) => {
    hanldleRecoverJob(id).then(() => {
      message.success(t('common.success_tips'))
    })
  }
  const handlePause = (id: number) => {
    hanldlePauseJob(id).then(() => {
      message.success(t('common.success_tips'))
    })
  }
  const handleDel = (id: number) => {
    hanldleDelJob(id).then(() => {
      message.success(t('common.success_tips'))
      getList()
    })
  }

  const handleLog = (row: any) => {
    variables.showModalRef = true
    variables.row = row
  }

  const handleViewLogs = (row: any) => {
    variables.showLogViewerModal = true
    variables.currentJobId = row.jobEngineId || row.id
    variables.currentJobName = row.jobDefineName
  }

  const getList = () => {
    const pageNo =
      variables.tableData.length === 1 && variables.page > 1
        ? variables.page - 1
        : variables.page
    getTableData(buildQueryParams(pageNo))
  }

  const onReset = () => {
    variables.taskName = ''
    variables.executeUser = ''
    variables.host = ''
    variables.stateType = ''
    variables.customTimeRange = null
    variables.timePreset = DEFAULT_TIME_PRESET
    variables.page = 1
    variables.checkedRowKeys = []
    getList()
  }

  return {
    variables,
    createColumns,
    getTableData,
    buildQueryParams,
    loadUserOptions,
    setStatusFilter,
    setTimePreset,
    applyCustomTime,
    clearCustomTime,
    onBatchDelete,
    onBatchRetry,
    onReset,
    handleViewLogs
  }
}

// tasksState 里的 color 是给 20px 图标用的浅色，直接当 11px 文字色会看不清；
// pill 文字统一映射到可读的深色系（语义对齐 design tokens）
const STATE_PILL_TEXT_COLORS: Record<string, string> = {
  SUBMITTED_SUCCESS: '#64748B',
  INITIALIZING: '#64748B',
  CREATED: '#64748B',
  RUNNING_EXECUTION: '#2563EB',
  RUNNING: '#2563EB',
  READY_PAUSE: '#0F766E',
  PAUSE: '#0F766E',
  PAUSE_BY_ISOLATION: '#0F766E',
  PAUSE_BY_CORONATION: '#0F766E',
  DOING_SAVEPOINT: '#0F766E',
  READY_STOP: '#E11D48',
  STOP: '#E11D48',
  FAILURE: '#E11D48',
  FAILED: '#E11D48',
  FAILING: '#E11D48',
  KILL: '#E11D48',
  KILL_BY_ISOLATION: '#E11D48',
  SUCCESS: '#059669',
  FORCED_SUCCESS: '#059669',
  FINISHED: '#059669',
  SAVEPOINT_DONE: '#059669',
  CANCELING: '#E11D48',
  CANCELED: '#E11D48',
  UNKNOWABLE: '#64748B',
  NEED_FAULT_TOLERANCE: '#D97706',
  WAITING_THREAD: '#7C3AED',
  PENDING: '#7C3AED',
  WAITING_DEPEND: '#7C3AED',
  DELAY_EXECUTION: '#7C3AED',
  SERIAL_WAIT: '#7C3AED',
  FORBIDDEN_BY_CORONATION: '#7C3AED',
  DISPATCH: '#7C3AED',
  SCHEDULED: '#7C3AED'
}

const renderStateCell = (state: ITaskState, t: Function) => {
  if (!state) return ''

  const stateOption = tasksState(t)[state]
  if (!stateOption) return ''
  const color = STATE_PILL_TEXT_COLORS[state] || '#64748B'
  return h(
    'span',
    {
      class:
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border leading-none whitespace-nowrap',
      style: {
        color,
        backgroundColor: `${color}14`,
        borderColor: `${color}33`
      }
    },
    [
      h(
        NIcon,
        {
          size: 11,
          class: stateOption.isSpin ? 'animate-spin' : ''
        },
        () => h(stateOption.icon)
      ),
      h('span', null, stateOption.desc)
    ]
  )
}
