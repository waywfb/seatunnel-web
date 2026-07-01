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
import { EditOutlined, PlayCircleOutlined, DeleteOutlined } from '@vicons/antd'
import {
  querySyncTaskDefinitionPaging,
  deleteSyncTaskDefinition,
  executeJob
} from '@/service/sync-task-definition'
import { useRoute, useRouter } from 'vue-router'
import type { Router } from 'vue-router'
import type { JobType } from './dag/types'
import { COLUMN_WIDTH_CONFIG } from '@/common/column-width-config'
import { useTableLink } from '@/hooks'
import { useMessage } from 'naive-ui'
import { tasksState } from '@/common/common'
import { NTooltip, NSpin, NIcon, NTag } from 'naive-ui'
import TimeAgo from '@/components/time-ago'
import { getDatasourceDisplayName } from './dag/sidebar/use-sidebar'

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
    showModalRef: ref(false),
    statusRef: ref(0),
    row: {},
    loadingRef: ref(false),
  })

  const JOB_TYPE = {
    DATA_REPLICA: 'whole_library_sync',
    DATA_INTEGRATION: 'data_integration'
  } as { [key in JobType]: string }

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
        if (!stateOption.isSpin) return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, [Icon, h('span', { style: { color: stateOption.color, fontSize: '13px' } }, stateOption.desc)])
        return h(NSpin, { size: 18 }, { icon: () => Icon })
      },
      default: () => stateOption.desc
    })
  }

  const renderJobTypeTag = (jobType: string) => {
    if (!jobType) return ''
    const isReplica = jobType === 'DATA_REPLICA' || jobType === 'whole_library_sync'
    return h(
      NTag,
      {
        size: 'small',
        type: isReplica ? 'info' : 'success',
        bordered: false,
        round: false
      },
      { default: () => t(isReplica ? 'project.synchronization_definition.whole_library_sync' : 'project.synchronization_definition.data_integration') }
    )
  }

  const createColumns = (variables: any) => {
    variables.columns = [
      {
        title: t(
          'project.synchronization_definition.synchronization_task_name'
        ),
        key: 'name'
      },
      {
          title: 'Source → Target',
          key: 'sourceConnectorType',
          width: 200,
          render: (row: any) => {
            const source = row.sourceConnectorType
            const sink = getDatasourceDisplayName(row.sinkDatasourceName || row.sinkConnectorType)
            if (!source && !sink) return ''
            return h(
              'span',
              { style: { fontSize: '13px', color: 'var(--color-foreground)' } },
              [source || '?', h('span', { style: { margin: '0 6px', color: 'var(--color-muted-foreground)' } }, '→'), sink || '?']
            )
          }
        },
      {
        title: t('project.synchronization_definition.job_type'),
        key: 'jobType',
        width: 120,
        render: (row: any) => renderJobTypeTag(row.jobType)
      },
      {
        title: t('project.synchronization_definition.state'),
        key: 'status',
        width: 120,
        render: (row: any) => renderStateCell(row.status || row.jobStatus, t)
      },
      {
        title: t('project.synchronization_definition.create_user'),
        key: 'createUserName'
      },
      {
        title: t('project.synchronization_definition.create_time'),
        key: 'createTime',
        render: (row: any) => row.createTime ? h(TimeAgo, { date: row.createTime }) : ''
      },
      {
        title: t('project.synchronization_definition.update_user'),
        key: 'updateUserName'
      },
      {
        title: t('project.synchronization_definition.update_time'),
        key: 'updateTime',
        render: (row: any) => row.updateTime ? h(TimeAgo, { date: row.updateTime }) : ''
      },
      useTableOperation(
        {
          title: t('project.synchronization_definition.operation'),
          key: 'operation',
          itemNum: 3,
          buttons: [
            {
              type: 'default',
              text: t('project.synchronization_definition.edit'),
              onClick: (row: any) => {
                router.push({
                  path: `/task/synchronization-definition/${row.id}`,
                })
              },
              icon: h(EditOutlined)
            },
            {
              type: 'primary',
              text: t('project.synchronization_definition.start'),
              onClick: (row: any) => {
                if (loadingStates.value.get(row.id)) return
                handleRun(row)
              },
              icon: h(PlayCircleOutlined)
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
        }
      )
    ]
  }

  const getTableData = (params: any) => {
    if (variables.loadingRef) return
    variables.loadingRef = true

    querySyncTaskDefinitionPaging(params)
      .then((res: any) => {
        variables.tableData = res.data
        variables.totalPage = res.totalPage
        variables.loadingRef = false
      })
      .catch(() => {
        variables.loadingRef = false
      })
  }

  const handleRun = (row: any) => {
    // Prevent duplicate task submissions
    loadingStates.value.set(row.id, true)
   
    executeJob(row.id).then((res: any) => {
      message.success(t('project.synchronization_definition.start_success'))
      router.push({
        path: `/task/synchronization-instance/${row.id}`,
        query: {
          jobInstanceId: res,
          taskName: row.name
        }
      })
    }).catch((error) => {
      message.error(t('project.synchronization_definition.start_failed'))
      loadingStates.value.set(row.id, false)
    })
  }

  const handleDelete = (row: any) => {
    if (variables.tableData.length === 1 && variables.page > 1) {
      --variables.page
    }

    deleteSyncTaskDefinition({
      projectCode: row.projectCode,
      id: row.id
    }).then(() => {
      getTableData({
        pageSize: variables.pageSize,
        pageNo: variables.page,
        searchName: variables.searchName
      })
    })
  }

  return {
    variables,
    createColumns,
    getTableData,
    handleRun,
    handleDelete,
    loadingStates,
  }
}
