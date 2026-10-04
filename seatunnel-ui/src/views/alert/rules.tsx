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
  NSpace,
  NTag,
  NPopconfirm
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import RuleFormModal from './rule-form-modal'
import { alertRuleList, alertRuleDelete, alertRuleTest } from '@/service/alert'
import type { AlertRule } from '@/service/alert'

const Rules = defineComponent({
  setup() {
    const { t } = useI18n()
    const loading = ref(false)
    const tableData = ref<AlertRule[]>([])
    const pageNo = ref(1)
    const pageSize = ref(10)
    const totalCount = ref(0)
    const showFormModal = ref(false)
    const formStatus = ref(0)
    const row = ref<any>({})

    const getTableData = () => {
      loading.value = true
      alertRuleList({
        pageNo: pageNo.value,
        pageSize: pageSize.value
      })
        .then((res: any) => {
          tableData.value = res?.data || []
          totalCount.value = res?.totalCount || 0
        })
        .finally(() => {
          loading.value = false
        })
    }

    const handleCreate = () => {
      formStatus.value = 0
      row.value = {}
      showFormModal.value = true
    }

    const handleEdit = (record: AlertRule) => {
      formStatus.value = 1
      row.value = { ...record }
      showFormModal.value = true
    }

    const handleDelete = (record: AlertRule) => {
      alertRuleDelete(record.id as number).then(() => {
        if (tableData.value.length === 1 && pageNo.value > 1) {
          --pageNo.value
        }
        getTableData()
      })
    }

    const handleTest = (record: AlertRule) => {
      alertRuleTest(record.id as number).then((res: any) => {
        if (res?.success) {
          window.$message.success(t('alert.test_send_success'))
        } else {
          window.$message.error(t('alert.test_send_failed'))
        }
      })
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

    const columns = [
      { title: 'ID', key: 'id', width: 80 },
      {
        title: t('alert.rule_name'),
        key: 'name',
        minWidth: 160,
        ellipsis: { tooltip: true }
      },
      {
        title: t('alert.event_type'),
        key: 'eventType',
        width: 120,
        render: () =>
          h(
            NTag,
            { size: 'small', type: 'warning' },
            {
              default: () => t('alert.event_type_task_failed')
            }
          )
      },
      {
        title: t('alert.webhook_url'),
        key: 'webhookUrl',
        minWidth: 200,
        ellipsis: { tooltip: true }
      },
      {
        title: t('alert.status'),
        key: 'status',
        width: 90,
        render: (record: AlertRule) =>
          h(
            NTag,
            {
              size: 'small',
              type: record.status === 1 ? 'success' : 'default'
            },
            {
              default: () =>
                record.status === 1
                  ? t('alert.status_enabled')
                  : t('alert.status_disabled')
            }
          )
      },
      {
        title: t('alert.cooldown_seconds'),
        key: 'cooldownSeconds',
        width: 120
      },
      {
        title: t('alert.create_time'),
        key: 'createTime',
        width: 170
      },
      {
        title: t('common.operation'),
        key: 'operation',
        width: 230,
        render: (record: AlertRule) =>
          h(NSpace, null, {
            default: () => [
              h(
                NButton,
                {
                  text: true,
                  type: 'primary',
                  onClick: () => handleEdit(record)
                },
                { default: () => t('common.edit') }
              ),
              h(
                NButton,
                {
                  text: true,
                  type: 'primary',
                  onClick: () => handleTest(record)
                },
                { default: () => t('alert.test_send') }
              ),
              h(
                NPopconfirm,
                { onPositiveClick: () => handleDelete(record) },
                {
                  trigger: () =>
                    h(
                      NButton,
                      { text: true, type: 'error' },
                      { default: () => t('common.delete') }
                    ),
                  default: () => t('alert.delete_rule_tips')
                }
              )
            ]
          })
      }
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
      showFormModal,
      formStatus,
      row,
      columns,
      getTableData,
      handleCreate,
      handlePageSize,
      handlePageNo
    }
  },
  render() {
    return (
      <NCard size='small' class='mt-2'>
        <div class='mb-3 flex items-center justify-between'>
          <span class='text-tide-title-lg'>{this.t('alert.rule_tab')}</span>
          <NButton type='primary' onClick={this.handleCreate}>
            {this.t('alert.create_rule')}
          </NButton>
        </div>
        <NDataTable
          size='small'
          loading={this.loading}
          columns={this.columns}
          data={this.tableData}
          scrollX={1100}
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
        <RuleFormModal
          show={this.showFormModal}
          status={this.formStatus}
          row={this.row}
          onCancelModal={() => (this.showFormModal = false)}
          onConfirmModal={() => {
            this.showFormModal = false
            this.getTableData()
          }}
        />
      </NCard>
    )
  }
})

export default Rules
