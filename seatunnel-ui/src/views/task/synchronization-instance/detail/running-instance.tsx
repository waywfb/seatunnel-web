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

const RunningInstance = defineComponent({
  name: 'RunningInstance',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const { variables, getTableData, createColumns } = useRunningInstance()

    useSse(
      'job-instance/metrics',
      { jobInstanceId: String(route.query.jobInstanceId) },
      {
        onMessage: (data: any) => {
          variables.tableData = data
        },
        fallback: () => getTableData(true)
      }
    )

    onMounted(() => {
      createColumns(variables)
      getTableData()
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
