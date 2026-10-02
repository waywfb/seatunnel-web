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

import { useI18n } from 'vue-i18n'
import { h, reactive, ref } from 'vue'
import { useTableOperation } from '@/hooks'
import {
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  ScheduleOutlined,
  ThunderboltOutlined
} from '@vicons/antd'
import {
  querySyncTaskDefinitionPaging,
  deleteSyncTaskDefinition,
  executeJob,
  queryJobSchedulePaging,
  enableJobSchedule,
  disableJobSchedule,
  triggerJobSchedule
} from '@/service/sync-task-definition'
import { useRoute, useRouter } from 'vue-router'
import type { Router } from 'vue-router'
import type { JobType } from './dag/types'
import { useMessage } from 'naive-ui'
import { tasksState } from '@/common/common'
import { NTooltip, NTag, NSwitch } from 'naive-ui'
import TimeAgo from '@/components/time-ago'
import { getDatasourceDisplayName } from './dag/sidebar/use-sidebar'
import type { Task } from '@/types/task'

export function useTable() {
  const { t } = useI18n()
  const router: Router = useRouter()
  const route = useRoute()
  const variables = reactive({
    columns: [],
    tableData: [],
    page: ref(1),
    pageSize: ref(10),
    searchName: ref(''),
    totalPage: ref(1),
    totalCount: ref(0),
    showModalRef: ref(false),
    scheduleModalRef: ref(false),
    statusRef: ref(0),
    row: {},
    scheduleRow: {},
    scheduleMap: {},
    loadingRef: ref(false)
  })

  const JOB_TYPE = {
    DATA_REPLICA: 'whole_library_sync',
    DATA_INTEGRATION: 'data_integration'
  } as { [key in JobType]: string }

  const isRunningStatus = (status: string) =>
    ['RUNNING', 'RUNNING_EXECUTION', 'SUBMITTED_SUCCESS'].includes(status)

  const isUnreadyStatus = (status: string) =>
    ['CREATED', 'INITIALIZING', 'PENDING'].includes(status)

  const message = useMessage()

  const loadingStates = ref(new Map())

  const scheduleLoadingStates = ref(new Map())

  const renderStateCell = (state: string, t: Function) => {
    if (!state) return ''
    const stateOption = tasksState(t)[state]
    if (!stateOption) return ''
    return h(NTooltip, null, {
      trigger: () =>
        h(
          'span',
          {
            class: 'inline-flex items-center',
            style: {
              gap: '6px',
              fontWeight: 500,
              fontSize: '12px'
            }
          },
          [
            h('span', {
              class: `w-2 h-2 rounded-full ${stateOption.isSpin ? 'animate-ping' : ''}`,
              style: { backgroundColor: stateOption.color }
            }),
            h(
              'span',
              { style: { color: stateOption.color } },
              stateOption.desc
            )
          ]
        ),
      default: () => stateOption.desc
    })
  }

  const renderJobTypeTag = (jobType: string) => {
    if (!jobType) return ''
    const isReplica =
      jobType === 'DATA_REPLICA' || jobType === 'whole_library_sync'
    return h(
      'span',
      {
        class: isReplica
          ? 'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100'
          : 'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
      },
      t(
        isReplica
          ? 'project.synchronization_definition.whole_library_sync'
          : 'project.synchronization_definition.data_integration'
      )
    )
  }

  const createColumns = (variables: any) => {
    variables.columns = [
      {
        title: t(
          'project.synchronization_definition.synchronization_task_name'
        ),
        key: 'name',
        width: 260,
        render: (row: any) => {
          const source = row.sourceDatasourceName || row.sourceConnectorType
          const sink = row.sinkDatasourceName || row.sinkConnectorType

          const pipelineNodes: string[] = []
          if (source) pipelineNodes.push(getDatasourceDisplayName(source))
          else
            pipelineNodes.push(
              t('project.synchronization_definition.unconfigured')
            )

          if (sink) pipelineNodes.push(getDatasourceDisplayName(sink))
          else
            pipelineNodes.push(
              t('project.synchronization_definition.unconfigured')
            )

          const bothEmpty = !source && !sink
          const pipelineContent = bothEmpty
            ? h(
                'span',
                {
                  style: {
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    fontSize: '12px'
                  }
                },
                t('project.synchronization_definition.unconfigured_pipeline')
              )
            : h(
                'div',
                {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }
                },
                pipelineNodes.map((node, idx) => [
                  idx > 0
                    ? h(
                        'span',
                        {
                          style: {
                            fontSize: '9px',
                            color: '#94a3b8',
                            margin: '0 1px'
                          }
                        },
                        '→'
                      )
                    : null,
                  h(
                    'span',
                    {
                      class:
                        'bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-600 text-[11px]'
                    },
                    node
                  )
                ])
              )

          const isRunning = isRunningStatus(row.status || row.jobStatus)
          return h(
            'div',
            { style: { lineHeight: '1.7' } },
            [
              h(
                'div',
                {
                  class: 'font-medium text-slate-800 text-sm',
                  style: { display: 'flex', alignItems: 'center', gap: '8px' }
                },
                [
                  row.name || '-',
                  isRunning
                    ? h(
                        'span',
                        {
                          class:
                            'px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-medium'
                        },
                        t('project.synchronization_definition.running')
                      )
                    : null
                ]
              ),
              h('div', { style: { marginTop: '2px' } }, pipelineContent)
            ]
          )
        }
      },
      {
        title: t('project.synchronization_definition.job_type'),
        key: 'jobType',
        width: 120,
        render: (row: any) => renderJobTypeTag(row.jobType)
      },
      // 离线（BATCH）页面作业模式恒为离线同步，列冗余，按参考页隐藏
      ...((route.meta.jobMode as string) === 'BATCH'
        ? []
        : [
            {
              title: t('project.synchronization_definition.job_mode'),
              key: 'jobMode',
              width: 100,
              render: (row: any) => {
                if (!row.jobMode) return ''
                const label =
                  row.jobMode === 'STREAMING' ? '实时同步' : '离线同步'
                return h(
                  NTag,
                  {
                    size: 'small',
                    color:
                      row.jobMode === 'STREAMING'
                        ? {
                            textColor: '#7c3aed',
                            borderColor: '#ddd6fe',
                            color: '#f5f3ff'
                          }
                        : {
                            textColor: '#1a5c8a',
                            borderColor: '#b8dff5',
                            color: '#e8f4fd'
                          },
                    bordered: false,
                    round: false
                  },
                  { default: () => label }
                )
              }
            }
          ]),
      {
        title: t('project.synchronization_definition.schedule_status'),
        key: 'scheduleStatus',
        width: 110,
        render: (row: any) => {
          if (row.jobMode === 'STREAMING') return '-'
          const schedule = variables.scheduleMap[row.id]
          if (!schedule) {
            return h(
              'span',
              { style: { color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' } },
              t('project.synchronization_definition.schedule_unconfigured')
            )
          }
          const loading = !!scheduleLoadingStates.value.get(schedule.id)
          return h(NTooltip, null, {
            trigger: () =>
              h(NSwitch, {
                value: schedule.status,
                checkedValue: 1,
                uncheckedValue: 0,
                loading,
                disabled: loading,
                onUpdateValue: (value: number) =>
                  handleToggleSchedule(schedule, value)
              }),
            default: () =>
              t(
                schedule.status === 1
                  ? 'project.synchronization_definition.schedule_enabled'
                  : 'project.synchronization_definition.schedule_disabled'
              )
          })
        }
      },
      {
        title: t('project.synchronization_definition.data_save_mode'),
        key: 'dataSaveMode',
        width: 140,
        render: (row: any) => {
          if (!row.dataSaveMode) return ''
          const labels: Record<string, string> = {
            APPEND_DATA: '追加数据',
            DROP_DATA: '清空数据',
            CUSTOM_PROCESSING: '自定义处理',
            ERROR_WHEN_DATA_EXISTS: '数据已存在时报错'
          }
          const isDrop = row.dataSaveMode === 'DROP_DATA'
          return h(
            'span',
            {
              class: isDrop
                ? 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100'
                : 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100'
            },
            labels[row.dataSaveMode] || row.dataSaveMode
          )
        }
      },
      {
        title: t('project.synchronization_definition.state'),
        key: 'status',
        width: 120,
        render: (row: any) => renderStateCell(row.status || row.jobStatus, t)
      },
      {
        title: t('project.synchronization_definition.create_info'),
        key: 'creatorInfo',
        width: 180,
        render: (row: any) =>
          h('div', { style: { lineHeight: '1.6' } }, [
            h(
              'div',
              { style: { fontWeight: 500, color: '#1e293b', fontSize: '13px' } },
              row.createUserName || '-'
            ),
            h(
              'div',
              { style: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' } },
              row.createTime ? h(TimeAgo, { date: row.createTime }) : '-'
            )
          ])
      },
      {
        title: t('project.synchronization_definition.update_info'),
        key: 'updaterInfo',
        width: 180,
        render: (row: any) =>
          h('div', { style: { lineHeight: '1.6' } }, [
            h(
              'div',
              { style: { fontWeight: 500, color: '#1e293b', fontSize: '13px' } },
              row.updateUserName || '-'
            ),
            h(
              'div',
              { style: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' } },
              row.updateTime ? h(TimeAgo, { date: row.updateTime }) : '-'
            )
          ])
      },
      useTableOperation({
        title: t('project.synchronization_definition.operation'),
        key: 'operation',
        itemNum: 5,
        buttons: [
          {
            type: 'default',
            text: t('project.synchronization_definition.edit'),
            onClick: (row: any) => {
              router.push({
                path: `/task/synchronization-definition/${row.id}`,
                query: { jobMode: row.jobMode }
              })
            },
            icon: h(EditOutlined)
          },
          {
            type: 'info',
            text: t('project.synchronization_definition.schedule'),
            isHidden: (row: any) => row.jobMode === 'STREAMING',
            onClick: (row: any) => {
              variables.scheduleRow = row
              variables.scheduleModalRef = true
            },
            icon: h(ScheduleOutlined)
          },
          {
            type: 'warning',
            text: t('project.synchronization_definition.execute_now'),
            isHidden: (row: any) => row.jobMode === 'STREAMING',
            disabled: (row: any) => !variables.scheduleMap[row.id],
            class: 'execute-now-btn',
            onClick: (row: any) => handleTrigger(row),
            icon: h(ThunderboltOutlined)
          },
          {
            type: 'primary',
            text: (row: any) => {
              const status = row.status || row.jobStatus
              if (isRunningStatus(status))
                return t('project.synchronization_definition.running')
              return t('project.synchronization_definition.start')
            },
            disabled: (row: any) => {
              const status = row.status || row.jobStatus
              return isUnreadyStatus(status) || isRunningStatus(status)
            },
            onClick: (row: any) => {
              if (loadingStates.value.get(row.id)) return
              handleRun(row)
            },
            icon: (row: any) => {
              const status = row.status || row.jobStatus
              if (isRunningStatus(status)) return h(PauseCircleOutlined)
              return h(PlayCircleOutlined)
            }
          },
          {
            more: true,
            isDelete: true,
            text: t('project.synchronization_definition.delete'),
            onPositiveClick: (row: any) => void handleDelete(row),
            popTips: t('project.synchronization_definition.delete_confirm'),
            icon: h(DeleteOutlined)
          }
        ]
      })
    ]
  }

  const loadScheduleMap = () => {
    queryJobSchedulePaging({ pageNo: 1, pageSize: 1000 })
      .then((res: any) => {
        const map: Record<number, any> = {}
        ;(res?.totalList || []).forEach((s: any) => {
          if (s.jobDefinitionId != null) map[s.jobDefinitionId] = s
        })
        variables.scheduleMap = map
      })
      .catch(() => {})
  }

  const getTableData = (params: any) => {
    if (variables.loadingRef) return
    variables.loadingRef = true

    const jobMode = (route.meta.jobMode as string) || ''
    querySyncTaskDefinitionPaging({ ...params, jobMode })
      .then((res: any) => {
        variables.tableData = res.data
        variables.totalPage = res.totalPage
        variables.totalCount = res.totalCount
        variables.loadingRef = false
        loadScheduleMap()
      })
      .catch(() => {
        variables.loadingRef = false
      })
  }

  const handleRun = async (row: any) => {
    // Prevent duplicate task submissions
    loadingStates.value.set(row.id, true)

    try {
      const res: any = await executeJob(row.id)
      message.success(t('project.synchronization_definition.start_success'))
      router.push({
        path: `/task/synchronization-instance/${row.id}`,
        query: {
          jobInstanceId: res,
          taskName: row.name,
          syncTaskType: row.jobMode || (route.meta.jobMode as string) || 'BATCH'
        }
      })
    } catch (error) {
      message.error(t('project.synchronization_definition.start_failed'))
      loadingStates.value.set(row.id, false)
    }
  }

  const handleToggleSchedule = async (schedule: any, value: number) => {
    if (!schedule || !schedule.id) return
    scheduleLoadingStates.value.set(schedule.id, true)
    try {
      if (value === 1) {
        await enableJobSchedule(schedule.id)
        message.success(t('project.synchronization_definition.enable_success'))
      } else {
        await disableJobSchedule(schedule.id)
        message.success(t('project.synchronization_definition.disable_success'))
      }
      schedule.status = value
    } catch (err) {
      message.error(
        t(
          value === 1
            ? 'project.synchronization_definition.enable_failed'
            : 'project.synchronization_definition.disable_failed'
        )
      )
    } finally {
      scheduleLoadingStates.value.set(schedule.id, false)
    }
  }

  const handleTrigger = async (row: any) => {
    const schedule = variables.scheduleMap[row.id]
    if (!schedule || !schedule.id) return
    try {
      await triggerJobSchedule(schedule.id)
      message.success(t('project.synchronization_definition.trigger_success'))
    } catch (err) {
      message.error(t('project.synchronization_definition.trigger_failed'))
    }
  }

  const handleDelete = async (row: Task) => {
    if (variables.tableData.length === 1 && variables.page > 1) {
      --variables.page
    }

    try {
      await deleteSyncTaskDefinition({
        projectCode: row.projectCode,
        id: row.id
      })
      getTableData({
        pageSize: variables.pageSize,
        pageNo: variables.page,
        searchName: variables.searchName
      })
    } catch {
      message.error(t('project.synchronization_definition.delete_failed'))
    }
  }

  return {
    variables,
    createColumns,
    getTableData,
    handleRun,
    handleDelete,
    loadingStates
  }
}
