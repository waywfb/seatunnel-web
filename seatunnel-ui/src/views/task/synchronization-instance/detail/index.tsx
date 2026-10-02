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
import { RunningInstance } from './running-instance'
import { TaskDefinition } from './task-definition'
import { TaskMetrics } from './task-metrics'
import { NBreadcrumb, NBreadcrumbItem, NCard } from 'naive-ui'
import STabs from '@/components/tabs'
import PageLayout from '@/components/page-layout'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import type { Router } from 'vue-router'

const SynchronizationInstanceDetail = defineComponent({
  name: 'SynchronizationInstanceDetail',
  setup() {
    const { t } = useI18n()
    const router: Router = useRouter()
    const route = useRoute()
    const activeTab = ref('task-definition')

    const tabs = [
      {
        name: 'task-definition',
        label: t('project.synchronization_instance.sync_task_definition')
      },
      {
        name: 'running-instance',
        label: t(
          'project.synchronization_instance.data_pipeline_running_instance'
        )
      },
      {
        name: 'task-metrics',
        label: t('project.synchronization_instance.task_metrics')
      }
    ]

    return () => (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <NCard style={{ marginBottom: '8px' }}>
          <NBreadcrumb>
            <NBreadcrumbItem>
              <span
                onClick={() =>
                  router.push({
                    name:
                      (route.query.syncTaskType as string) === 'STREAMING'
                        ? 'synchronization-instance-realtime'
                        : 'synchronization-instance-offline',
                    params: { projectCode: route.params.projectCode },
                    query: {
                      project: route.query.project,
                      global: route.query.global
                    }
                  })
                }
              >
                {t(
                  (route.query.syncTaskType as string) === 'STREAMING'
                    ? 'menu.sync_task_instance_realtime'
                    : 'menu.sync_task_instance_offline'
                )}
              </span>
            </NBreadcrumbItem>
            <NBreadcrumbItem>{route.query.taskName}</NBreadcrumbItem>
          </NBreadcrumb>
        </NCard>
        <PageLayout>
          {{
            tabs: () => (
              <STabs
                value={activeTab.value}
                onUpdate:value={(val: string) => (activeTab.value = val)}
                tabs={tabs}
              >
                {{
                  'pane:task-definition': () => <TaskDefinition />,
                  'pane:running-instance': () => <RunningInstance />,
                  'pane:task-metrics': () => <TaskMetrics />
                }}
              </STabs>
            )
          }}
        </PageLayout>
      </div>
    )
  }
})

export default SynchronizationInstanceDetail
