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

import { defineComponent, ref, watch, h } from 'vue'
import { NLayoutSider, NMenu, NIcon, NEllipsis } from 'naive-ui'
import { useThemeStore } from '@/store/theme'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  AppstoreOutlined,
  DatabaseOutlined,
  PartitionOutlined,
  TableOutlined,
  TeamOutlined
} from '@vicons/antd'

const Sidebar = defineComponent({
  name: 'Sidebar',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    const collapsedRef = ref(false)
    const themeStore = useThemeStore()

    const sideMenuOptions = [
      {
        type: 'group',
        label: () => h('span', { class: 'sidebar-section-label' }, t('menu.section_overview')),
        key: 'section-overview',
        children: [
          {
            label: () => h(NEllipsis, null, { default: () => t('menu.dashboard') }),
            key: 'dashboard',
            icon: () => h(NIcon, null, { default: () => h(AppstoreOutlined) })
          }
        ]
      },
      {
        type: 'group',
        label: () => h('span', { class: 'sidebar-section-label' }, t('menu.section_pipeline')),
        key: 'section-pipeline',
        children: [
          {
            label: () => h(NEllipsis, null, { default: () => t('menu.tasks') }),
            key: 'tasks',
            icon: () => h(NIcon, null, { default: () => h(PartitionOutlined) }),
            children: [
              {
                label: () => h(NEllipsis, null, { default: () => t('menu.sync_task_definition') }),
                key: 'synchronization-definition'
              },
              {
                label: () => h(NEllipsis, null, { default: () => t('menu.sync_task_instance') }),
                key: 'synchronization-instance'
              }
            ]
          }
        ]
      },
      {
        type: 'group',
        label: () => h('span', { class: 'sidebar-section-label' }, t('menu.section_resources')),
        key: 'section-resources',
        children: [
          {
            label: () => h(NEllipsis, null, { default: () => t('menu.datasource') }),
            key: 'datasource',
            icon: () => h(NIcon, null, { default: () => h(DatabaseOutlined) })
          },
          {
            label: () => h(NEllipsis, null, { default: () => t('menu.virtual_tables') }),
            key: 'virtual-tables',
            icon: () => h(NIcon, null, { default: () => h(TableOutlined) })
          }
        ]
      },
      {
        type: 'group',
        label: () => h('span', { class: 'sidebar-section-label' }, t('menu.section_admin')),
        key: 'section-admin',
        children: [
          {
            label: () => h(NEllipsis, null, { default: () => t('menu.user_manage') }),
            key: 'user-manage',
            icon: () => h(NIcon, null, { default: () => h(TeamOutlined) })
          }
        ]
      }
    ]

    const activeKey = ref((route.meta.activeSide || route.meta.activeMenu) as string || '')
    const expandedKeys = ref<string[]>([])

    watch(() => route.path, () => {
      activeKey.value = (route.meta.activeSide || route.meta.activeMenu) as string || ''
      if (route.meta.activeMenu === 'tasks') {
        expandedKeys.value = ['tasks']
      }
    }, { immediate: true })

    const handleMenuClick = (key: string) => {
      if (key === 'dashboard') {
        router.push({ path: '/tasks' })
      } else if (key === 'synchronization-definition') {
        router.push({ path: '/task/synchronization-definition' })
      } else if (key === 'synchronization-instance') {
        router.push({ path: '/task/synchronization-instance' })
      } else if (key !== 'tasks') {
        router.push({ path: `/${key}` })
      }
    }

    const handleExpandedKeys = (keys: string[]) => {
      expandedKeys.value = keys
    }

    return {
      collapsedRef,
      sideMenuOptions,
      activeKey,
      expandedKeys,
      handleMenuClick,
      handleExpandedKeys,
      themeStore
    }
  },
  render() {
    return (
      <NLayoutSider
        bordered
        nativeScrollbar={false}
        show-trigger='bar'
        collapse-mode='width'
        collapsed={this.collapsedRef}
        onCollapse={() => (this.collapsedRef = true)}
        onExpand={() => (this.collapsedRef = false)}
        width={196}
      >
        <NMenu
          class='tab-vertical'
          value={this.activeKey}
          options={this.sideMenuOptions}
          expandedKeys={this.expandedKeys}
          onUpdateValue={this.handleMenuClick}
          onUpdateExpandedKeys={this.handleExpandedKeys}
        />
      </NLayoutSider>
    )
  }
})

export default Sidebar
