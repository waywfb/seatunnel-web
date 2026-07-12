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

import { h, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NSpace, NTag } from 'naive-ui'
import { useTableOperation } from '@/hooks'
import {
  EditOutlined,
  CopyOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined
} from '@vicons/antd'

export function useColumns(
  onCallback: (id: number, type: 'edit' | 'delete' | 'enable' | 'disable' | 'copy' | 'version') => void
) {
  const { t } = useI18n()
  const columns = ref<any[]>([])

  const getColumns = () => {
    return [
      {
        title: t('data_standard.name'),
        key: 'name',
        align: 'left',
        ellipsis: { tooltip: true }
      },
      {
        title: t('data_standard.code'),
        key: 'code',
        align: 'left',
        ellipsis: { tooltip: true }
      },
      {
        title: t('data_standard.type'),
        key: 'type',
        align: 'left',
        render: (row: any) => {
          const typeMap: Record<string, string> = {
            GB: t('data_standard.type_national'),
            HB: t('data_standard.type_industry'),
            DB: t('data_standard.type_regional'),
            T: t('data_standard.type_group'),
            Q: t('data_standard.type_enterprise'),
            FG: t('data_standard.type_regulation'),
            CUSTOM: t('data_standard.type_custom')
          }
          return h(NTag, { type: 'info', size: 'small' }, { default: () => typeMap[row.type] || row.type })
        }
      },
      {
        title: t('data_standard.status'),
        key: 'status',
        align: 'center',
        width: 100,
        render: (row: any) => {
          return h(
            NTag,
            { type: row.status === 1 ? 'success' : 'warning', size: 'small' },
            { default: () => row.status === 1 ? t('data_standard.status_enabled') : t('data_standard.status_disabled') }
          )
        }
      },
      {
        title: t('data_standard.description'),
        key: 'description',
        align: 'left',
        ellipsis: { tooltip: true }
      },
      {
        title: t('data_standard.create_time'),
        key: 'createTime',
        width: 170
      },
      useTableOperation({
        title: t('data_standard.operation'),
        key: 'operation',
        width: 280,
        buttons: [
          {
            text: t('data_standard.edit'),
            icon: h(EditOutlined),
            onClick: (rowData) => void onCallback(rowData.id, 'edit')
          },
          {
            text: t('data_standard.version_manage'),
            icon: h(BranchesOutlined),
            onClick: (rowData) => void onCallback(rowData.id, 'version')
          },
          {
            text: t('data_standard.copy'),
            icon: h(CopyOutlined),
            onClick: (rowData) => void onCallback(rowData.id, 'copy')
          },
          {
            text: t('data_standard.enable'),
            icon: h(CheckCircleOutlined),
            show: (rowData: any) => rowData.status === 0,
            onClick: (rowData) => void onCallback(rowData.id, 'enable')
          },
          {
            text: t('data_standard.disable'),
            icon: h(PauseCircleOutlined),
            show: (rowData: any) => rowData.status === 1,
            onClick: (rowData) => void onCallback(rowData.id, 'disable')
          },
          {
            isDelete: true,
            text: t('data_standard.delete'),
            onPositiveClick: (rowData) => void onCallback(rowData.id, 'delete'),
            negativeText: t('data_standard.cancel'),
            positiveText: t('data_standard.confirm'),
            popTips: t('data_standard.delete_confirm')
          }
        ]
      })
    ]
  }

  watch(useI18n().locale, () => {
    columns.value = getColumns()
  })

  onMounted(() => {
    columns.value = getColumns()
  })

  return {
    columns
  }
}
