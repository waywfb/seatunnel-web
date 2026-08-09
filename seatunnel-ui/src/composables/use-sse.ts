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

import { onMounted, onUnmounted } from 'vue'
import { createEventSource } from '@/service/stream/sse'

interface UseSseOptions {
  onMessage: (data: any) => void
  /** 断线重连延迟，默认 3000ms */
  retryDelayMs?: number
  /** SSE 连续失败达到阈值后的轮询兜底函数 */
  fallback?: () => void
  /** 兜底轮询间隔，默认 5000ms */
  fallbackIntervalMs?: number
  /** 触发兜底前的连续失败次数，默认 3 */
  fallbackThreshold?: number
}

/**
 * 订阅后端 SSE 推送的 Vue 组合式封装。
 * 组件挂载时建立连接，卸载时关闭；断线自动重连，连续失败后降级为轮询兜底。
 */
export function useSse(path: string, params: Record<string, string | number>, options: UseSseOptions) {
  const {
    onMessage,
    retryDelayMs = 3000,
    fallback,
    fallbackIntervalMs = 5000,
    fallbackThreshold = 3
  } = options

  let eventSource: EventSource | null = null
  let retryTimer: number | null = null
  let fallbackTimer: number | null = null
  let consecutiveErrors = 0

  const stopPollingFallback = () => {
    if (fallbackTimer !== null) {
      window.clearInterval(fallbackTimer)
      fallbackTimer = null
    }
  }

  const startPollingFallback = () => {
    if (fallback && fallbackTimer === null) {
      fallback()
      fallbackTimer = window.setInterval(fallback, fallbackIntervalMs)
    }
  }

  const closeEventSource = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  const connect = () => {
    closeEventSource()
    eventSource = createEventSource(path, params)
    eventSource.onmessage = (event: MessageEvent) => {
      consecutiveErrors = 0
      stopPollingFallback()
      try {
        onMessage(JSON.parse(event.data))
      } catch {
        onMessage(event.data)
      }
    }
    eventSource.onerror = () => {
      consecutiveErrors++
      if (eventSource?.readyState === EventSource.CLOSED) {
        closeEventSource()
        if (consecutiveErrors >= fallbackThreshold) {
          startPollingFallback()
          return
        }
        retryTimer = window.setTimeout(connect, retryDelayMs)
      }
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    closeEventSource()
    stopPollingFallback()
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer)
      retryTimer = null
    }
  })

  return { close: closeEventSource }
}
