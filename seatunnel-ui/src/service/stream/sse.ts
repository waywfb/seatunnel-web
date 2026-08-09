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

import { useUserStore } from '@/store/user'
import type { UserDetail } from '@/service/user/types'

const SSE_BASE_PATH = '/seatunnel/api/v1/sse'

/**
 * 创建指向后端 SSE 端点的 EventSource。
 * EventSource 无法携带自定义 header，token 通过 query 参数传递，由后端认证拦截器兜底校验。
 */
export function createEventSource(
  path: string,
  params: Record<string, string | number> = {}
): EventSource {
  const userStore = useUserStore()
  const userInfo = userStore.getUserInfo as UserDetail
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)))
  if (userInfo.token) {
    query.set('token', userInfo.token)
  }
  return new EventSource(`${SSE_BASE_PATH}/${path}?${query.toString()}`)
}
