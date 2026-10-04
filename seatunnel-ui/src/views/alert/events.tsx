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

import { defineComponent, onMounted, ref, h } from 'vue'
import {
  NCard,
  NButton,
  NDataTable,
  NPagination,
  NSelect,
  NTag,
  NSpace
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { alertEventList, alertEventHistoryList } from '@/service/alert'
import type { AlertEvent } from '@/service/alert'

const Events = defineComponent({
  props: {
    /** 读历史归档表（已超保留期的事件），默认读主表 */
    history: { type: Boolean, default: false }
  },
  setup(props) {
    const { t } = useI18n()
    const loading = ref(false)
    const tableData = ref<AlertEvent[]>([])
    const pageNo = ref(1)
    const pageSize = ref(10)
    const totalCount = ref(0)
    const sendStatus = ref<number | null>(null)

    const statusLabel = (value?: number) => {
      if (value === 1) return t('alert.send_status_success')
      if (value === 2) return t('alert.send_status_failed')
      return t('alert.send_status_pending')
    }

    const statusType = (value?: number) => {
      if (value === 1) return 'success'
      if (value === 2) return 'error'
      return 'default'
    }

    const getTableData = () => {
      loading.value = true
      const query = {
        pageNo: pageNo.value,
        pageSize: pageSize.value,
        ...(sendStatus.value === null ? {} : { sendStatus: sendStatus.value })
      }
      const fetcher = props.history ? alertEventHistoryList : alertEventList
      fetcher(query)
        .then((res: any) => {
          tableData.value = res?.data || []
          totalCount.value = res?.totalCount || 0
        })
        .finally(() => {
          loading.value = false
        })
    }

    const handleFilter = (value: number | null) => {
      sendStatus.value = value
      pageNo.value = 1
      getTableData()
    }

    const handleRefresh = () => {
      getTableData()
    }

    const handlePageSize = (size: number) => {
      pageSize.value = size
      pageNo.value = 1
      getTableData()
    }

    const handlePageNo = (page: number) => {
      pageNo.value = page
      getTableData()
    }

    const statusOptions = [
      ...(props.history
        ? []
        : [{ label: t('alert.send_status_pending'), value: 0 }]),
      { label: t('alert.send_status_success'), value: 1 },
      { label: t('alert.send_status_failed'), value: 2 }
    ]

    const columns = [
      { title: 'ID', key: 'id', width: 80 },
      {
        title: t('alert.rule_name'),
        key: 'ruleName',
        minWidth: 140,
        ellipsis: { tooltip: true }
      },
      {
        title: t('alert.job_name'),
        key: 'jobDefineName',
        minWidth: 160,
        ellipsis: { tooltip: true }
      },
      { title: t('alert.job_instance_id'), key: 'jobInstanceId', width: 120 },
      {
        title: t('alert.error_message'),
        key: 'errorMessage',
        minWidth: 220,
        ellipsis: { tooltip: true }
      },
      {
        title: t('alert.send_status'),
        key: 'sendStatus',
        width: 110,
        render: (record: AlertEvent) =>
          h(
            NTag,
            { size: 'small', type: statusType(record.sendStatus) as any },
            { default: () => statusLabel(record.sendStatus) }
          )
      },
      { title: t('alert.retry_count'), key: 'retryCount', width: 90 },
      { title: t('alert.send_time'), key: 'sendTime', width: 170 },
      { title: t('alert.event_create_time'), key: 'createTime', width: 170 }
    ]

    onMounted(() => {
      getTableData()
    })

    return {
      t,
      loading,
      tableData,
      pageNo,
      pageSize,
      totalCount,
      sendStatus,
      statusOptions,
      columns,
      handleFilter,
      handleRefresh,
      handlePageSize,
      handlePageNo
    }
  },
  render() {
    return (
      <NCard size='small' class='mt-2'>
        <div class='mb-3 flex items-center justify-between'>
          <span class='text-tide-title-lg'>
            {this.history
              ? this.t('alert.history_tab')
              : this.t('alert.event_tab')}
          </span>
          <NSpace>
            <NSelect
              value={this.sendStatus}
              options={this.statusOptions}
              placeholder={this.t('alert.send_status')}
              clearable
              class='w-40'
              onUpdateValue={this.handleFilter}
            />
            <NButton onClick={this.handleRefresh}>
              {this.t('common.refresh')}
            </NButton>
          </NSpace>
        </div>
        <NDataTable
          size='small'
          loading={this.loading}
          columns={this.columns}
          data={this.tableData}
          scrollX={1300}
        />
        <div class='mt-4 flex justify-end'>
          <NPagination
            v-model:page={this.pageNo}
            v-model:page-size={this.pageSize}
            itemCount={this.totalCount}
            show-size-picker
            pageSizes={[10, 20, 50]}
            onUpdatePage={this.handlePageNo}
            onUpdatePageSize={this.handlePageSize}
          />
        </div>
      </NCard>
    )
  }
})

export default Events
