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

import utils from '@/utils'
import type { Component } from 'vue'

const modules = import.meta.glob('/src/views/**/**.tsx')
const components: { [key: string]: Component } = utils.mapping(modules)

export default {
  path: '/data-standard',
  name: 'data-standard',
  meta: {
    title: 'data-standard'
  },
  redirect: { name: 'data-standard-list' },
  component: () => import('@/layouts/dashboard'),
  children: [
    {
      path: '/data-standard/list',
      name: 'data-standard-list',
      component: components['data-standard-list'],
      meta: {
        title: 'data-standard-list',
        activeMenu: 'data-standard',
        breadcrumb: [{ label: '数据标准', path: '/data-standard/list' }]
      }
    },
    {
      path: '/data-standard/create',
      name: 'data-standard-create',
      component: components['data-standard-detail'],
      meta: {
        title: 'data-standard-create',
        activeMenu: 'data-standard',
        breadcrumb: [
          { label: '数据标准', path: '/data-standard/list' },
          { label: '新建标准' }
        ]
      }
    },
    {
      path: '/data-standard/:id',
      name: 'data-standard-detail',
      component: components['data-standard-detail'],
      meta: {
        title: 'data-standard-detail',
        activeMenu: 'data-standard',
        breadcrumb: [
          { label: '数据标准', path: '/data-standard/list' },
          { label: '标准详情' }
        ]
      }
    },
    {
      path: '/data-standard/:id/edit',
      name: 'data-standard-edit',
      component: components['data-standard-detail'],
      meta: {
        title: 'data-standard-edit',
        activeMenu: 'data-standard',
        breadcrumb: [
          { label: '数据标准', path: '/data-standard/list' },
          { label: '编辑标准' }
        ]
      }
    }
  ]
}
