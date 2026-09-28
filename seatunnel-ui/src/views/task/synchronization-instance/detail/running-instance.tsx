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

import { defineComponent, onMounted, toRefs, watch } from 'vue'
import { NSpace, NCard, NDataTable } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRunningInstance } from './use-running-instance'
import { useSse } from '@/composables/use-sse'
import { isMetricsAllEnd } from '@/common/common'

const RunningInstance = defineComponent({
  name: 'RunningInstance',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const { variables, getTableData, createColumns } = useRunningInstance()

    const { connect, stop } = useSse(
      'job-instance/metrics',
      { jobInstanceId: String(route.query.jobInstanceId) },
      {
        autoConnect: false,
        // 各 pipeline 指标全部为终态时任务已结束，无需继续实时监控
        stopWhen: (data: any) => isMetricsAllEnd(data),
        onMessage: (data: any) => {
          variables.tableData = data
        },
        fallback: () => {
          getTableData(true).then((res: any) => {
            // 轮询兜底同样遵守终态判定：任务已结束后停止轮询
            if (isMetricsAllEnd(res)) stop()
          })
        }
      }
    )

    onMounted(async () => {
      createColumns(variables)
      const res = await getTableData()
      // 已完成（终态）的任务实例不再建立 SSE 监控，仅展示静态数据
      if (!isMetricsAllEnd(res)) {
        connect()
      }
    })

    watch(useI18n().locale, () => {
      createColumns(variables)
    })

    return {
      t,
      ...toRefs(variables)
    }
  },
  render() {
    return (
      <NSpace vertical>
        <NCard>
          <NSpace vertical>
            <NDataTable
              loading={this.loadingRef}
              columns={this.columns}
              data={this.tableData}
            />
          </NSpace>
        </NCard>
      </NSpace>
    )
  }
})

export { RunningInstance }
