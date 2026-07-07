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

import { defineComponent, ref, watch } from 'vue'
import { NLayoutSider } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

interface NavItem {
  key: string
  icon?: string
  route?: string
  labelKey?: string
  children?: NavItem[]
}

interface NavGroup {
  sectionKey: string
  sectionLabelKey: string
  items: NavItem[]
}

const ICON_PATHS: Record<string, string> = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  account_tree: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z',
  database: 'M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z',
  sell: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
  table: 'M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H4V5h16zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm-6 6h4v4H4v-4zm6 0h4v4h-4v-4zm6-6h4v4h-4v-4zm0 6h4v4h-4v-4z',
  smart_toy: 'M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z',
  people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  chevron_right: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
}

const SidebarIcon = ({ name, size = 20, fill = 'currentColor' }: { name: string; size?: number; fill?: string }) => {
  const path = ICON_PATHS[name]
  if (!path) return null
  return (
    <svg viewBox='0 0 24 24' width={size} height={size} fill={fill} style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

const NAV_GROUPS: NavGroup[] = [
  {
    sectionKey: 'section-overview', sectionLabelKey: 'section_overview',
    items: [
      { key: 'dashboard', icon: 'dashboard', route: '/tasks' },
    ]
  },
  {
    sectionKey: 'section-resources', sectionLabelKey: 'section_resources',
    items: [
      { key: 'datasource', icon: 'database', route: '/datasource' },
      { key: 'tag_manage', icon: 'sell', route: '/datasource/tags' },
      { key: 'virtual_tables', icon: 'table', route: '/virtual-tables' },
    ]
  },
  {
    sectionKey: 'section-pipeline', sectionLabelKey: 'section_pipeline',
    items: [
      { key: 'synchronization-definition', icon: 'account_tree', route: '/task/synchronization-definition', labelKey: 'sync_task_definition' },
      { key: 'synchronization-instance', icon: 'account_tree', route: '/task/synchronization-instance', labelKey: 'sync_task_instance' },
    ]
  },
  {
    sectionKey: 'section-ai', sectionLabelKey: 'section_ai',
    items: [
      { key: 'ai_assistant', icon: 'smart_toy', route: '/ai/chat' },
    ]
  },
  {
    sectionKey: 'section-admin', sectionLabelKey: 'section_admin',
    items: [
      { key: 'user_manage', icon: 'people', route: '/user-manage' },
    ]
  },
]

const Sidebar = defineComponent({
  name: 'Sidebar',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    const collapsed = ref(false)
    const activeKey = ref((route.meta.activeSide || route.meta.activeMenu) as string || '')
    const expandedKeys = ref<string[]>([])

    watch(() => route.path, () => {
      activeKey.value = (route.meta.activeSide || route.meta.activeMenu) as string || ''
    }, { immediate: true })

    const toggleExpand = (key: string) => {
      if (expandedKeys.value.includes(key)) {
        expandedKeys.value = expandedKeys.value.filter(k => k !== key)
      } else {
        expandedKeys.value = [...expandedKeys.value, key]
      }
    }

    const handleNavClick = (item: NavItem) => {
      if (item.children) {
        toggleExpand(item.key)
        return
      }
      activeKey.value = item.key
      if (item.route) {
        router.push({ path: item.route })
      }
    }

    const renderNavItem = (item: NavItem) => {
      const active = activeKey.value === item.key ||
        (item.children && item.children.some(c => activeKey.value === c.key))
      const expanded = expandedKeys.value.includes(item.key)
      const hasChildren = item.children && item.children.length > 0

      return (
        <div key={item.key}>
          <div
            class={[
              'flex items-center gap-tide-gap-md px-tide-gap-md py-2 mx-2 rounded-tide-lg cursor-pointer transition-all duration-fast',
              active
                ? 'bg-[#645efb] text-[#fffbff] font-semibold'
                : 'text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#89f5e7]',
              { 'justify-center': collapsed.value }
            ]}
            onClick={() => handleNavClick(item)}
            title={collapsed.value ? t(`menu.${item.labelKey || item.key}`) : undefined}
          >
            <SidebarIcon
              name={item.icon || ''}
              size={20}
              fill={active ? '#fffbff' : 'currentColor'}
            />
            {!collapsed.value && (
              <>
                <span class="flex-1 font-tide-label-md text-tide-label-md truncate">
                  {t(`menu.${item.labelKey || item.key}`)}
                </span>
                {hasChildren && (
                  <span class="transition-transform duration-fast"
                    style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'flex' }}>
                    <SidebarIcon name="chevron_right" size={18} />
                  </span>
                )}
              </>
            )}
          </div>
          {hasChildren && expanded && !collapsed.value && (
            <div class="ml-2">
              {item.children.map(child => renderNavItem(child))}
            </div>
          )}
        </div>
      )
    }

    return () => (
      <NLayoutSider
        bordered
        nativeScrollbar={false}
        showTrigger='bar'
        collapseMode='width'
        collapsed={collapsed.value}
        onCollapse={() => { collapsed.value = true }}
        onExpand={() => { collapsed.value = false }}
        width={256}
        collapsedWidth={64}
        style={{
          backgroundColor: '#0B0F19',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
        }}
      >
        <div class="flex flex-col h-full" style={{ backgroundColor: '#0B0F19' }}>
          {/* Brand area */}
          <div style={{
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: collapsed.value ? '16px' : '16px',
            paddingBottom: collapsed.value ? '16px' : '24px',
            display: collapsed.value ? 'flex' : undefined,
            justifyContent: collapsed.value ? 'center' : undefined,
          }}>
            <div class={[
              'flex items-center',
              { 'gap-tide-gap-sm': !collapsed.value }
            ]}>
              <div class="w-8 h-8 rounded-tide-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#00685f' }}>
                <SidebarIcon name="database" size={18} fill="#ffffff" />
              </div>
              {!collapsed.value && (
                <div class="min-w-0">
                  <h1 class="font-tide-headline-md text-tide-headline-md text-[#89f5e7] tracking-tight truncate">Yeacen DI</h1>
                  <p class="font-tide-body-sm text-tide-body-sm text-[rgba(255,255,255,0.4)] truncate">数据集成平台</p>
                </div>
              )}
            </div>
          </div>

          {/* Nav items */}
          <div class="flex-1 overflow-y-auto px-tide-gap-xs space-y-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#334155 #0B0F19',
            }}>
            {NAV_GROUPS.map(group => (
              <div key={group.sectionKey}>
                {!collapsed.value && (
                  <div class="px-tide-gap-md pt-tide-gap-md pb-1">
                    <span style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      fontWeight: 800,
                      textTransform: 'uppercase' as any,
                    }}>
                      {t(`menu.${group.sectionLabelKey}`)}
                    </span>
                  </div>
                )}
                {group.items.map(item => renderNavItem(item))}
              </div>
            ))}
          </div>
        </div>
      </NLayoutSider>
    )
  }
})

export default Sidebar
