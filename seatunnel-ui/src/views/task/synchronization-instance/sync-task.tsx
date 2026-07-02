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
import {
  NSpace,
  NCard,
  NDataTable,
  NPagination,
  NInput,
  NSelect,
  NDatePicker,
  NIcon,
  NButton,
  NDropdown
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { stateType } from '@/common/common'
import LogModal from '@/components/log-modal'
import LogViewerModal from './log-viewer-modal'
import { SearchOutlined, ReloadOutlined } from '@vicons/antd'
import { useAsyncState } from '@vueuse/core'
import { queryLog } from '@/service/log'
import { LogRes } from '@/service/log/types'
import ColumnSelector from '@/components/column-selector'
import { getRangeShortCuts } from '@/utils/timePickeroption'
import { useRoute, useRouter } from 'vue-router'
import isEmpty from 'lodash/isEmpty'
import { DownOutlined } from '@vicons/antd'
import StatCard from '@/components/stat-card'

const props = {
  syncTaskType: {
    type: String as PropType<string>,
    default: 'BATCH'
  }
}

const SyncTask = defineComponent({
  name: 'SyncTask',
  props,
  setup(props) {
    let logTimer: number
    let refreshTimer: number
    const { t, locale } = useI18n()
    const {
      variables,
      getTableData,
      batchBtnListClick,
      creatInstanceButtons,
      createColumns,
      onReset
    } = useSyncTask(props.syncTaskType)
    const route = useRoute()
    const router = useRouter()

    const tableColumn = ref([]) as any

    const stats = computed(() => {
      const data = variables.tableData || []
      let running = 0
      let success = 0
      let failed = 0
      for (const row of data as any[]) {
        const s = row.state || row.status
        if (!s) continue
        if (s === 'RUNNING' || s === 'SUBMITTED_SUCCESS') running++
        else if (s === 'SUCCESS') success++
        else if (s === 'FAILURE' || s === 'FAILED') failed++
      }
      return {
        total: variables.totalPage * variables.pageSize || data.length,
        running,
        success,
        failed
      }
    })
    const requestData = () => {
      getTableData({
        pageNo: variables.page,
        pageSize: variables.pageSize,
        taskName: variables.taskName,
        executorName: variables.executeUser,
        host: variables.host,
        stateType: variables.stateType,
        startDate: variables.datePickerRange
          ? variables.datePickerRange[0]
          : '',
        endDate: variables.datePickerRange ? variables.datePickerRange[1] : '',
        syncTaskType: variables.syncTaskType
      })
    }
    const rangeShortCuts = reactive({
      rangeOption: {}
    })
    rangeShortCuts.rangeOption = getRangeShortCuts(t)

    const onUpdatePageSize = () => {
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

      const query = {} as any
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

      if (variables.datePickerRange) {
        query.startDate = variables.datePickerRange[0]
        query.endDate = variables.datePickerRange[1]
      }

      router.replace({
        query: !isEmpty(query)
          ? {
            ...route.query,
            ...query,
            syncTaskType: props.syncTaskType,
            }
          : {
              ...route.query,
              syncTaskType: props.syncTaskType,
            }
      })
      requestData()
    }

    const handleKeyup = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSearch()
      }
    }

    const initSearch = () => {
      const { startDate, endDate } = route.query
      if (startDate && endDate) {
        variables.datePickerRange = [startDate as string, endDate as string]
      }
      variables.taskName = (route.query.taskName as string) || ''
      variables.executeUser = (route.query.executeUser as string) || ''
      variables.host = (route.query.host as string) || ''
      variables.stateType = (route.query.stateType as string) || null
    }

    onMounted(() => {
      initSearch()
      createColumns(variables)
      creatInstanceButtons(variables)
      requestData()
      refreshTimer = window.setInterval(requestData, 3000)
    })

    onUnmounted(() => {
      clearTimeout(logTimer)
      clearInterval(refreshTimer)
    })

    watch(locale, () => {
      createColumns(variables)
      creatInstanceButtons(variables)
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

    return {
      t,
      ...toRefs(variables),
      stats,
      requestData,
      onUpdatePageSize,
      refreshLogs,
      handleSearch,
      onReset,
      handleKeyup,
      handleChangeColumn,
      batchBtnListClick,
      tableColumn,
      rangeShortCuts
    }
  },
  render() {
    const { t } = this
    const renderSearchBar = () => (
      <NCard>
        <NSpace vertical>
          <NSpace justify='space-between' itemStyle={{ flexGrow: 1 }}>
            <NSpace>
              <NInput
                v-model={[this.taskName, 'value']}
                placeholder={t('project.synchronization_instance.task_name')}
                onKeyup={this.handleKeyup}
                clearable
                style={{ width: '200px' }}
              />
              <NInput
                v-model={[this.executeUser, 'value']}
                placeholder={t('project.synchronization_instance.execute_user')}
                onKeyup={this.handleKeyup}
                clearable
                style={{ width: '160px' }}
              />
              <NSelect
                v-model={[this.stateType, 'value']}
                options={stateType(t).slice(1)}
                placeholder={t('project.synchronization_instance.state')}
                clearable
                style={{ width: '160px' }}
              />
              <NDatePicker
                v-model={[this.datePickerRange, 'formattedValue']}
                type='datetimerange'
                start-placeholder={t('project.synchronization_instance.start_time')}
                end-placeholder={t('project.synchronization_instance.end_time')}
                shortcuts={this.rangeShortCuts.rangeOption}
                style={{ width: '340px' }}
              />
            </NSpace>
            <NSpace justify='end'>
              <NButton onClick={this.onReset}>
                <NIcon>
                  <ReloadOutlined />
                </NIcon>
              </NButton>
              <NButton type='primary' onClick={this.handleSearch}>
                <NIcon>
                  <SearchOutlined />
                </NIcon>
              </NButton>
            </NSpace>
          </NSpace>
        </NSpace>
      </NCard>
    )

    const renderStatCards = () => (
      <div class='flex gap-3'>
        <StatCard
          label={t('project.synchronization_instance.total')}
          value={this.stats.total}
          color='var(--color-info)'
          loading={false}
        />
        <StatCard
          label={t('project.synchronization_instance.running')}
          value={this.stats.running}
          color='var(--color-primary)'
          loading={false}
        />
        <StatCard
          label={t('project.synchronization_instance.success')}
          value={this.stats.success}
          color='var(--color-success)'
          loading={false}
        />
        <StatCard
          label={t('project.synchronization_instance.fail')}
          value={this.stats.failed}
          color='var(--color-error)'
          loading={false}
        />
      </div>
    )

    return (
      <NSpace vertical>
        {renderSearchBar()}
        {renderStatCards()}
        <NCard title={t('project.synchronizing_task_instance')}>
          {{
            'header-extra': () => (
              <NSpace justify='space-between'>
                <ColumnSelector
                  tableKey='taskInstance'
                  tableColumns={this.columns}
                  onChangeOptions={this.handleChangeColumn}
                ></ColumnSelector>
              </NSpace>
            ),
            default: () => (
              <NSpace vertical>
                <NDataTable
                  loading={this.loadingRef}
                  columns={this.tableColumn}
                  data={this.tableData}
                  rowKey={(row) => row.id}
                  scrollX={this.tableWidth}
                  v-model:checked-row-keys={this.checkedRowKeys}
                />
                <NSpace justify='center'>
                  <NPagination
                    v-model:page={this.page}
                    v-model:page-size={this.pageSize}
                    page-count={this.totalPage}
                    show-size-picker
                    page-sizes={[10, 30, 50]}
                    show-quick-jumper
                    onUpdatePage={this.requestData}
                    onUpdatePageSize={this.onUpdatePageSize}
                  />
                </NSpace>
              </NSpace>
            )
          }}
        </NCard>
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
          onUpdateShow={(v: boolean) => this.showLogViewerModal = v}
        />
      </NSpace>
    )
  }
})

export { SyncTask }
