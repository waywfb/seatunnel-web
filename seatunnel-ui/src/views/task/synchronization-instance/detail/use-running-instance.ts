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

import { h, reactive, ref } from 'vue'
import { NIcon, NSpin, NTag, NTooltip } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { queryRunningInstancePaging } from '@/service/sync-task-instance'
import { useRoute } from 'vue-router'
import { tasksState } from '@/common/common'
import type { ITaskState } from '@/common/types'

const PIPELINE_DISPLAY_NAMES: Record<string, string> = {
  'JDBC-Mysql': 'MySQL',
  'JDBC-Postgres': 'PostgreSQL',
  'JDBC-SQLServer': 'SQLServer',
  'JDBC-Oracle': 'Oracle',
  'JDBC-Db2': 'Db2',
  'JDBC-Hive': 'Hive',
  'JDBC-KingBase': 'Kingbase',
  'JDBC-TiDB': 'TiDB',
  'MySQL-CDC': 'MySQL-CDC',
  'Postgres-CDC': 'Postgres-CDC',
  'SqlServer-CDC': 'SQLServer-CDC',
  Kafka: 'Kafka',
  Http: 'HTTP',
  ElasticSearch: 'Elasticsearch',
  S3: 'S3',
  MongoDB: 'MongoDB',
  FakeSource: 'FakeSource',
  Hive: 'Hive',
  Console: 'Console',
  StarRocks: 'StarRocks',
  'Jdbc-MultiTableSink': 'JDBC'
}

function formatPipelineName(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/^(Source|Sink)\[\d+\]-/, '').replace(/\]$/, '')
  return PIPELINE_DISPLAY_NAMES[cleaned] || cleaned || raw
}

export function useRunningInstance() {
  const { t } = useI18n()
  const route = useRoute()

  const variables = reactive({
    columns: [],
    tableData: [],
    loadingRef: ref(false)
  })

  const createColumns = (variables: any) => {
    variables.columns = [
      {
        title: t('project.synchronization_instance.pipeline_id'),
        key: 'pipelineId',
        render: (row: any) => {
          if (row.pipelineId === undefined || row.pipelineId === null) return ''
          return h(
            NTag,
            {
              size: 'tiny',
              color: {
                textColor: '#555',
                borderColor: '#d0d0d0',
                color: '#f5f5f5'
              },
              bordered: false,
              round: false
            },
            { default: () => `Pipeline #${row.pipelineId}` }
          )
        }
      },
      {
        title: t('project.synchronization_instance.source'),
        key: 'sourceTableNames',
        render: (row: any) => {
          if (!row.sourceTableNames) return ''
          const labels = row.sourceTableNames.split(',').filter(Boolean)
          return h(
            'span',
            { style: { display: 'inline-flex', gap: '4px', flexWrap: 'wrap' } },
            labels.map((l: string) =>
              h(
                NTag,
                {
                  size: 'tiny',
                  color: {
                    textColor: '#6172a0',
                    borderColor: '#d2d9ed',
                    color: '#eef1f8'
                  },
                  bordered: false,
                  round: false
                },
                { default: () => formatPipelineName(l.trim()) }
              )
            )
          )
        }
      },
      {
        title: t('project.synchronization_instance.read_rate'),
        key: 'readQps'
      },
      {
        title: t('project.synchronization_instance.amount_of_data_read'),
        key: 'readRowCount'
      },
      {
        title: t('project.synchronization_instance.delay_of_data'),
        key: 'recordDelay',
        render: (row: any) => {
          if (!row.recordDelay && row.recordDelay !== 0) return ''
          return row.recordDelay / 1000
        }
      },
      {
        title: t('project.synchronization_instance.sink'),
        key: 'sinkTableNames',
        render: (row: any) => {
          if (!row.sinkTableNames) return ''
          const labels = row.sinkTableNames.split(',').filter(Boolean)
          return h(
            'span',
            { style: { display: 'inline-flex', gap: '4px', flexWrap: 'wrap' } },
            labels.map((l: string) =>
              h(
                NTag,
                {
                  size: 'tiny',
                  color: {
                    textColor: '#6172a0',
                    borderColor: '#d2d9ed',
                    color: '#eef1f8'
                  },
                  bordered: false,
                  round: false
                },
                { default: () => formatPipelineName(l.trim()) }
              )
            )
          )
        }
      },
      {
        title: t('project.synchronization_instance.processing_rate'),
        key: 'writeQps'
      },
      {
        title: t('project.synchronization_instance.amount_of_data_written'),
        key: 'writeRowCount'
      },
      {
        title: t('project.synchronization_instance.state'),
        key: 'status',
        render: (row: any) => renderStateCell(row.status, t)
      }
    ]
  }

  const getTableData = (silent = false) => {
    if (variables.loadingRef) return Promise.resolve(variables.tableData)
    if (!silent) variables.loadingRef = true

    return queryRunningInstancePaging({
      jobInstanceId: route.query.jobInstanceId
    })
      .then((res: any) => {
        variables.tableData = res
        variables.loadingRef = false
        return res
      })
      .catch(() => {
        variables.loadingRef = false
        return []
      })
  }

  return {
    variables,
    createColumns,
    getTableData
  }
}

const renderStateCell = (state: ITaskState, t: Function) => {
  if (!state) return ''

  const stateOption = tasksState(t)[state]
  if (!stateOption) return state
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
