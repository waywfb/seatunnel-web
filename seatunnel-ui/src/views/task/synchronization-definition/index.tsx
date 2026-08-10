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
  toRefs,
  watch,
  computed,
  ref,
  h
} from 'vue'
import {
  NSpace,
  NCard,
  NButton,
  NButtonGroup,
  NInput,
  NIcon,
  NDataTable,
  NPagination
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import {
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined
} from '@vicons/antd'
import { I18N_KEYS } from '@/common/i18n-keys'
import { useTable } from './use-table'
import { TaskModal } from './task-modal'
import { ScheduleModal } from './schedule-modal'
import StatCard from '@/components/stat-card'
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

    const stats = computed((): TaskStats => {
      const data = (variables.tableData || []) as Task[]
      let running = 0
      let success = 0
      let failed = 0
      for (const row of data) {
        const s = row.status || row.jobStatus
        if (!s) continue
        if (
          s === 'SUBMITTED_SUCCESS' ||
          s === 'RUNNING_EXECUTION' ||
          s === 'RUNNING'
        )
          running++
        else if (s === 'SUCCESS') success++
        else if (s === 'FAILURE' || s === 'FAILED') failed++
      }
      return { total: data.length, running, success, failed }
    })

    const requestData = () => {
      getTableData({
        pageSize: variables.pageSize,
        pageNo: variables.page,
        searchName: variables.searchName
      })
    }

    const onUpdatePageSize = () => {
      variables.page = 1
      requestData()
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

    return {
      t,
      ...toRefs(variables),
      stats,
      viewMode,
      handleEdit,
      handleRun,
      handleDelete,
      loadingStates,
      onUpdatePageSize,
      requestData,
      onCancelModal,
      onConfirmModal,
      onCancelScheduleModal,
      onConfirmScheduleModal,
      handleModalChange,
      onSearch,
      handleKeyup,
      toggleView
    }
  },
  render() {
    const renderSearchBar = () => (
      <div class='bg-white rounded-xl border border-[#E5E7EB] px-5 py-4 flex items-center justify-between gap-4'>
        <div class='flex items-center gap-3'>
          <NInput
            clearable
            v-model={[this.searchName, 'value']}
            placeholder={this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.TASK_NAME)}
            onKeyup={this.handleKeyup}
            style={{ width: '260px' }}
          />
          <NButton type='primary' onClick={this.onSearch}>
            <NIcon>
              <SearchOutlined />
            </NIcon>
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
          <NButton type='info' onClick={this.handleModalChange}>
            {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.CREATE_TASK)}
          </NButton>
        </div>
      </div>
    )

    const renderStatCards = () => (
      <div class='flex gap-3'>
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.TOTAL)}
          value={this.stats.total}
          color='#3B82F6'
          loading={this.loadingRef}
          icon={h('span', { class: 'text-lg' }, '📦')}
        />
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.RUNNING)}
          value={this.stats.running}
          color='#F59E0B'
          loading={this.loadingRef}
          icon={h('span', { class: 'text-lg' }, '⚡')}
          trend='up'
          trendText='12%'
        />
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.SUCCESS)}
          value={this.stats.success}
          color='#16A34A'
          loading={this.loadingRef}
          icon={h('span', { class: 'text-lg' }, '✅')}
        />
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.FAIL)}
          value={this.stats.failed}
          color='#DC2626'
          loading={this.loadingRef}
          icon={h('span', { class: 'text-lg' }, '⚠️')}
        />
      </div>
    )

    const renderPagination = () => (
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
    )

    const renderTableView = () => (
      <NCard
        style='height: 100%; overflow: hidden; display: flex; flex-direction: column;'
        contentStyle='flex: 1; overflow: hidden; display: flex; flex-direction: column;'
      >
        <div style='flex: 1; overflow: hidden; display: flex; flex-direction: column;'>
          <div style='flex: 1; overflow: auto;'>
            <NDataTable
              loading={this.loadingRef}
              columns={this.columns}
              data={this.tableData}
            />
          </div>
          <NSpace justify='center' style='padding: 12px 0; flex-shrink: 0;'>
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
        </div>
      </NCard>
    )

    const renderCardView = () => (
      <div style='height: 100%; overflow: auto;'>
        <div class='grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3 mb-4'>
          {this.tableData.map((task: Task) => (
            <TaskCard
              task={task}
              onEdit={this.handleEdit}
              onRun={this.handleRun}
              onDelete={this.handleDelete}
              loadingStates={this.loadingStates}
            />
          ))}
        </div>
        {renderPagination()}
      </div>
    )

    return (
      <div class='h-full flex flex-col overflow-hidden'>
        {renderSearchBar()}
        {renderStatCards()}
        <div style='flex: 1; overflow: hidden;'>
          {this.viewMode === 'table' ? renderTableView() : renderCardView()}
        </div>
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
