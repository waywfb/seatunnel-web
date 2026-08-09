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
  ScheduleOutlined
} from '@vicons/antd'
import {
  querySyncTaskDefinitionPaging,
  deleteSyncTaskDefinition,
  executeJob,
  queryJobSchedulePaging
} from '@/service/sync-task-definition'
import { useRouter } from 'vue-router'
import type { Router } from 'vue-router'
import type { JobType } from './dag/types'
import { useMessage } from 'naive-ui'
import { tasksState } from '@/common/common'
import { NTooltip, NSpin, NIcon, NTag } from 'naive-ui'
import TimeAgo from '@/components/time-ago'
import { getDatasourceDisplayName } from './dag/sidebar/use-sidebar'
import type { Task } from '@/types/task'

export function useTable() {
  const { t } = useI18n()
  const router: Router = useRouter()
  const variables = reactive({
    columns: [],
    tableData: [],
    page: ref(1),
    pageSize: ref(10),
    searchName: ref(''),
    totalPage: ref(1),
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

  const renderStateCell = (state: string, t: Function) => {
    if (!state) return ''
    const stateOption = tasksState(t)[state]
    if (!stateOption) return ''
    const Icon = h(
      NIcon,
      {
        color: stateOption.color,
        class: stateOption.classNames,
        style: { display: 'flex' },
        size: 18
      },
      () => h(stateOption.icon)
    )
    return h(NTooltip, null, {
      trigger: () => {
        if (!stateOption.isSpin)
          return h(
            'span',
            {
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }
            },
            [
              Icon,
              h(
                'span',
                { style: { color: stateOption.color, fontSize: '13px' } },
                stateOption.desc
              )
            ]
          )
        return h(NSpin, { size: 18 }, { icon: () => Icon })
      },
      default: () => stateOption.desc
    })
  }

  const renderJobTypeTag = (jobType: string) => {
    if (!jobType) return ''
    const isReplica =
      jobType === 'DATA_REPLICA' || jobType === 'whole_library_sync'
    return h(
      NTag,
      {
        size: 'small',
        type: isReplica ? 'info' : 'success',
        bordered: false,
        round: false
      },
      {
        default: () =>
          t(
            isReplica
              ? 'project.synchronization_definition.whole_library_sync'
              : 'project.synchronization_definition.data_integration'
          )
      }
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
                    color: '#999',
                    fontStyle: 'italic',
                    fontSize: '12px'
                  }
                },
                t('project.synchronization_definition.unconfigured_pipeline')
              )
            : h(
                NTag,
                {
                  size: 'tiny',
                  color: {
                    textColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    color: '#f3f4f6'
                  },
                  bordered: false,
                  round: false,
                  style: { fontSize: '11px', padding: '0 6px' }
                },
                { default: () => pipelineNodes.join(' → ') }
              )

          return h('div', { style: { lineHeight: '1.7' } }, [
            h(
              'div',
              { style: { fontSize: '14px', color: '#1a1a1a' } },
              row.name || '-'
            ),
            h('div', { style: { marginTop: '2px' } }, pipelineContent)
          ])
        }
      },
      {
        title: t('project.synchronization_definition.job_type'),
        key: 'jobType',
        width: 120,
        render: (row: any) => renderJobTypeTag(row.jobType)
      },
      {
        title: t('project.synchronization_definition.job_mode'),
        key: 'jobMode',
        width: 100,
        render: (row: any) => {
          if (!row.jobMode) return ''
          const label = row.jobMode === 'STREAMING' ? '实时同步' : '离线同步'
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
      },
      {
        title: t('project.synchronization_definition.schedule_status'),
        key: 'scheduleStatus',
        width: 110,
        render: (row: any) => {
          if (row.jobMode === 'STREAMING') return '-'
          const schedule = variables.scheduleMap[row.id]
          if (!schedule) {
            return h(
              NTag,
              {
                size: 'small',
                color: {
                  textColor: '#6b7280',
                  borderColor: '#e5e7eb',
                  color: '#f3f4f6'
                },
                bordered: false,
                round: false
              },
              {
                default: () =>
                  t('project.synchronization_definition.schedule_unconfigured')
              }
            )
          }
          if (schedule.status === 1) {
            return h(
              NTag,
              {
                size: 'small',
                color: {
                  textColor: '#16a34a',
                  borderColor: '#bbf7d0',
                  color: '#f0fdf4'
                },
                bordered: false,
                round: false
              },
              {
                default: () =>
                  t('project.synchronization_definition.schedule_enabled')
              }
            )
          }
          return h(
            NTag,
            {
              size: 'small',
              color: {
                textColor: '#d97706',
                borderColor: '#fde68a',
                color: '#fffbeb'
              },
              bordered: false,
              round: false
            },
            {
              default: () =>
                t('project.synchronization_definition.schedule_disabled')
            }
          )
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
          return h(
            NTag,
            {
              size: 'small',
              color: {
                textColor: '#555',
                borderColor: '#d0d0d0',
                color: '#f0f0f0'
              },
              bordered: false,
              round: false
            },
            { default: () => labels[row.dataSaveMode] || row.dataSaveMode }
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
              { style: { fontSize: '13px', fontWeight: 500, color: '#333' } },
              row.createUserName || '-'
            ),
            h(
              'div',
              { style: { fontSize: '12px', color: '#999' } },
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
              { style: { fontSize: '13px', fontWeight: 500, color: '#333' } },
              row.updateUserName || '-'
            ),
            h(
              'div',
              { style: { fontSize: '12px', color: '#999' } },
              row.updateTime ? h(TimeAgo, { date: row.updateTime }) : '-'
            )
          ])
      },
      useTableOperation({
        title: t('project.synchronization_definition.operation'),
        key: 'operation',
        itemNum: 4,
        buttons: [
          {
            type: 'default',
            text: t('project.synchronization_definition.edit'),
            onClick: (row: any) => {
              router.push({
                path: `/task/synchronization-definition/${row.id}`
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

    querySyncTaskDefinitionPaging(params)
      .then((res: any) => {
        variables.tableData = res.data
        variables.totalPage = res.totalPage
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
          taskName: row.name
        }
      })
    } catch (error) {
      message.error(t('project.synchronization_definition.start_failed'))
      loadingStates.value.set(row.id, false)
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
