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
import { endOfToday, format, startOfToday, subDays } from 'date-fns'
import { useTableLink, useTableOperation } from '@/hooks'
import {
  AlignLeftOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  DownloadOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined
} from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import { cleanState, downloadLog, forceSuccess } from '@/service/task-instances'
import {
  COLUMN_WIDTH_CONFIG,
  DefaultTableWidth,
  calculateTableWidth
} from '@/common/column-width-config'
import { useRoute, useRouter } from 'vue-router'
import { ITaskState } from '@/common/types'
import { tasksState } from '@/common/common'
import { NButton, NIcon, NPopover, NSpin, NTooltip } from 'naive-ui'
import { useMessage } from 'naive-ui'
import {
  querySyncTaskInstancePaging,
  hanldlePauseJob,
  hanldleRecoverJob,
  hanldleDelJob
} from '@/service/sync-task-instance'
import type { RowKey } from 'naive-ui/lib/data-table/src/interface'
import type { Router } from 'vue-router'
import {
  cleanStateByIds,
  forcedSuccessByIds
} from '@/service/sync-task-instance'
import { getRemainTime } from '@/utils/time'
import ErrorMessageHighlight from './error-message-highlight'

export function useSyncTask(syncTaskType = 'BATCH') {
  const { t } = useI18n()
  const router: Router = useRouter()
  const route = useRoute()
  const message = useMessage()

  const variables = reactive({
    tableWidth: DefaultTableWidth,
    columns: [],
    tableData: [],
    page: ref(1),
    pageSize: ref(10),
    totalPage: ref(1),
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
    stateType: null as null | string,
    syncTaskType,
    checkedRowKeys: [] as Array<RowKey>,
    buttonList: [],
    datePickerRange: [
      format(subDays(startOfToday(), 30), 'yyyy-MM-dd HH:mm:ss'),
      format(endOfToday(), 'yyyy-MM-dd HH:mm:ss')
    ],
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

  const isRunning = (jobStatus?: string) =>
    !!jobStatus &&
    ['RUNNING', 'RUNNING_EXECUTION', 'SUBMITTED_SUCCESS'].includes(jobStatus)

  // 引擎终态全集（与 Seatunnel JobStatus.EndState.GLOBALLY 对齐）：
  // FAILED / SAVEPOINT_DONE / CANCELED / FINISHED / UNKNOWABLE；缺失任一会被误当运行中
  const endStates = [
    'FINISHED',
    'SAVEPOINT_DONE',
    'CANCELED',
    'FAILED',
    'UNKNOWABLE'
  ]

  // 每秒跳动驱动：每行锁定锚点毫秒（snapshotAt - runningTime*1000 ≈ 真实开始时刻），
  // 非终态统一基于 floor((nowTick - anchor)/1000) 单源计时，跨轮询持久，避免双时间基准对账抖动
  const nowTick = ref(Date.now())
  const rowAnchors = new Map<number, number>()
  const tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
  onUnmounted(() => clearInterval(tickTimer))

  const creatInstanceButtons = (variables: any) => {
    variables.buttonList = [
      {
        label: t('project.task.clean_state'),
        key: 'clean_state'
      },
      {
        label: t('project.task.forced_success'),
        key: 'forced_success'
      }
    ]
  }
  //
  const createColumns = (variables: any) => {
    variables.columns = [
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
                taskName: row.jobDefineName
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
                { trigger: 'click' },
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
          if (endStates.includes(row.jobStatus)) {
            return getRemainTime(row.runningTime)
          }
          const anchor = rowAnchors.get(row.id)
          if (anchor === undefined) {
            return getRemainTime(row.runningTime)
          }
          return getRemainTime(
            Math.max(0, Math.floor((nowTick.value - anchor) / 1000))
          )
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
            show: (row) => !isRunning(row.jobStatus),
            onClick: (row) => void handleRecover(row.id)
          },
          {
            text: t('project.workflow.pause'),
            icon: h(PauseCircleOutlined),
            show: (row) => isRunning(row.jobStatus),
            onClick: (row) => void handlePause(row.id)
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
        if (endStates.includes(row.jobStatus)) {
          rowAnchors.delete(row.id)
          return { ...row }
        }
        const anchor = snapshotAt - (row.runningTime || 0) * 1000
        const prevAnchor = rowAnchors.get(row.id)
        if (prevAnchor === undefined || Math.abs(anchor - prevAnchor) > 2000) {
          rowAnchors.set(row.id, anchor)
        }
        return { ...row }
      })
      variables.totalPage = res.totalPage
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

  const handleCleanState = (row: any) => {
    cleanState(Number(row.projectCode), [row.id]).then(() => {
      getList()
    })
  }

  const handleForcedSuccess = (row: any) => {
    forceSuccess({ id: row.id }, { projectCode: Number(row.projectCode) }).then(
      () => {
        getList()
      }
    )
  }

  const getList = () => {
    getTableData({
      pageSize: variables.pageSize,
      pageNo:
        variables.tableData.length === 1 && variables.page > 1
          ? variables.page - 1
          : variables.page,
      taskName: variables.taskName,
      host: variables.host,
      stateType: variables.stateType,
      startDate: variables.datePickerRange ? variables.datePickerRange[0] : '',
      endDate: variables.datePickerRange ? variables.datePickerRange[1] : '',
      executorName: variables.executeUser,
      syncTaskType: variables.syncTaskType
    })
  }

  const onReset = () => {
    variables.taskName = ''
    variables.executeUser = ''
    variables.host = ''
    variables.stateType = null
    variables.datePickerRange = [
      format(subDays(startOfToday(), 30), 'yyyy-MM-dd HH:mm:ss'),
      format(endOfToday(), 'yyyy-MM-dd HH:mm:ss')
    ]
  }
  const onBatchCleanState = (ids: any) => {
    cleanStateByIds(ids).then(() => {
      window.$message.success(t('project.workflow.success'))
      variables.checkedRowKeys = []
      getList()
    })
  }

  const onBatchForcedSuccess = (ids: any) => {
    forcedSuccessByIds(ids).then(() => {
      window.$message.success(t('project.workflow.success'))
      variables.checkedRowKeys = []
      getList()
    })
  }

  const batchBtnListClick = (key: string) => {
    if (variables.checkedRowKeys.length == 0) {
      window.$message.warning(t('project.select_task_instance'))
      return
    }
    switch (key) {
      case 'clean_state':
        onBatchCleanState(variables.checkedRowKeys)
        break
      case 'forced_success':
        onBatchForcedSuccess(variables.checkedRowKeys)
        break
    }
  }

  return {
    variables,
    createColumns,
    getTableData,
    onReset,
    batchBtnListClick,
    creatInstanceButtons,
    handleViewLogs
  }
}

const renderStateCell = (state: ITaskState, t: Function) => {
  if (!state) return ''

  const stateOption = tasksState(t)[state]
  if (!stateOption) return ''
  const Icon = h(
    NIcon,
    {
      color: stateOption.color,
      class: stateOption.classNames,
      style: {
        display: 'flex'
      },
      size: 20
    },
    () => h(stateOption.icon)
  )
  return h(NTooltip, null, {
    trigger: () => {
      if (!stateOption.isSpin) return Icon
      return h(NSpin, { size: 20 }, { icon: () => Icon })
    },
    default: () => stateOption.desc
  })
}
