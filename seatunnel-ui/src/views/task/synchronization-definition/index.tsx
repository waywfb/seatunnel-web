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
import StatCard from '@/components/stat-card'
import TaskCard from '@/components/task-card'
import { useRoute, useRouter } from 'vue-router'
import isEmpty from 'lodash/isEmpty'

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

    const handleEdit = (task: any) => {
      router.push({ path: `/task/synchronization-definition/${task.id}` })
    }

    const stats = computed(() => {
      const data = variables.tableData || []
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
      handleModalChange,
      onSearch,
      handleKeyup,
      toggleView
    }
  },
  render() {
    const renderSearchBar = () => (
      <NCard>
        <NSpace justify='space-between' itemStyle={{ flexGrow: 1 }}>
          <NButton type='info' onClick={this.handleModalChange}>
            {this.t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.CREATE_TASK)}
          </NButton>
          <NSpace justify='end'>
            <NInput
              clearable
              v-model={[this.searchName, 'value']}
              placeholder={this.t(
                I18N_KEYS.SYNCHRONIZATION_DEFINITION.TASK_NAME
              )}
              onKeyup={this.handleKeyup}
            />

            <NButton type='primary' onClick={this.onSearch}>
              <NIcon>
                <SearchOutlined />
              </NIcon>
            </NButton>
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
          </NSpace>
        </NSpace>
      </NCard>
    )

    const renderStatCards = () => (
      <div class='flex gap-3'>
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.TOTAL)}
          value={this.stats.total}
          color='var(--color-info)'
          loading={this.loadingRef}
        />
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.RUNNING)}
          value={this.stats.running}
          color='var(--color-primary)'
          loading={this.loadingRef}
        />
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.SUCCESS)}
          value={this.stats.success}
          color='var(--color-success)'
          loading={this.loadingRef}
        />
        <StatCard
          label={this.t(I18N_KEYS.SYNCHRONIZATION_INSTANCE.FAIL)}
          value={this.stats.failed}
          color='var(--color-error)'
          loading={this.loadingRef}
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
      <NCard>
        <NSpace vertical>
          <NDataTable
            loading={this.loadingRef}
            columns={this.columns}
            data={this.tableData}
          />
          {renderPagination()}
        </NSpace>
      </NCard>
    )

    const renderCardView = () => (
      <div>
        <div class='grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3 mb-4'>
          {this.tableData.map((task: any) => (
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
      <NSpace vertical>
        {renderSearchBar()}
        {renderStatCards()}
        {this.viewMode === 'table' ? renderTableView() : renderCardView()}
        <TaskModal
          showModalRef={this.showModalRef}
          onCancelModal={this.onCancelModal}
          onConfirmModal={this.onConfirmModal}
        />
      </NSpace>
    )
  }
})

export default SynchronizationDefinition
