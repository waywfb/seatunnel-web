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

import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import User from './user'

const Header = defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    return { route, router }
  },
  render() {
    const breadcrumbItems =
      (this.route.meta?.breadcrumb as Array<{
        label: string
        path?: string
      }>) || []

    return (
      <div
        class='h-14 flex items-center justify-between px-6 border-b border-gray-100 bg-white'
        style='width: 100%;'
      >
        <NBreadcrumb>
          <NBreadcrumbItem onClick={() => this.router.push('/')}>
            首页
          </NBreadcrumbItem>
          {breadcrumbItems.map((item, index) => (
            <NBreadcrumbItem
              key={index}
              onClick={() => item.path && this.router.push(item.path)}
              style={{ cursor: item.path ? 'pointer' : 'default' }}
            >
              {item.label}
            </NBreadcrumbItem>
          ))}
        </NBreadcrumb>
        <User />
      </div>
    )
  }
})

export default Header
