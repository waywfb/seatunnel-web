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

import { defineComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import STabs from '@/components/tabs'
import PageLayout from '@/components/page-layout'
import { useI18n } from 'vue-i18n'
import { SyncTask } from './sync-task'

const SynchronizationInstance = defineComponent({
  name: 'SynchronizationInstance',
  setup() {
    const route = useRoute()
    const { t } = useI18n()
    const syncTaskType = ref((route.query.syncTaskType as string) || 'BATCH')

    const tabs = [
      {
        name: 'BATCH',
        label: t('project.synchronization_instance.offline_sync')
      },
      {
        name: 'STREAMING',
        label: t('project.synchronization_instance.real_time_sync')
      }
    ]

    return () => (
      <PageLayout>
        {{
          tabs: () => (
            <STabs
              value={syncTaskType.value}
              onUpdate:value={(val: string) => (syncTaskType.value = val)}
              tabs={tabs}
            >
              {{
                'pane:BATCH': () => <SyncTask syncTaskType='BATCH' />,
                'pane:STREAMING': () => <SyncTask syncTaskType='STREAMING' />
              }}
            </STabs>
          )
        }}
      </PageLayout>
    )
  }
})

export default SynchronizationInstance
