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
  /** 收到推送后若返回 true，则彻底停止监控（关闭 SSE、停止轮询、不再重连） */
  stopWhen?: (data: any) => boolean
  /** 是否在挂载后自动建立连接，默认 true；false 时由调用方在适当时机手动 connect() */
  autoConnect?: boolean
}

/**
 * 订阅后端 SSE 推送的 Vue 组合式封装。
 * 组件挂载时建立连接，卸载时关闭；断线自动重连，连续失败后降级为轮询兜底。
 * stopWhen 用于任务进入终态后不再监控的场景：命中后彻底停止，避免已完成任务仍持续占用连接。
 */
export function useSse(path: string, params: Record<string, string | number>, options: UseSseOptions) {
  const {
    onMessage,
    retryDelayMs = 3000,
    fallback,
    fallbackIntervalMs = 5000,
    fallbackThreshold = 3,
    stopWhen,
    autoConnect = true
  } = options

  let eventSource: EventSource | null = null
  let retryTimer: number | null = null
  let fallbackTimer: number | null = null
  let consecutiveErrors = 0
  let stopped = false

  const stopPollingFallback = () => {
    if (fallbackTimer !== null) {
      window.clearInterval(fallbackTimer)
      fallbackTimer = null
    }
  }

  const startPollingFallback = () => {
    if (stopped) return
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

  /** 彻底停止监控：关闭 SSE、停止轮询兜底、清除重连定时器，后续不再恢复 */
  const stop = () => {
    stopped = true
    closeEventSource()
    stopPollingFallback()
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  const connect = () => {
    if (stopped) return
    closeEventSource()
    eventSource = createEventSource(path, params)
    eventSource.onmessage = (event: MessageEvent) => {
      consecutiveErrors = 0
      stopPollingFallback()
      let data: any
      try {
        data = JSON.parse(event.data)
      } catch {
        data = event.data
      }
      onMessage(data)
      if (stopWhen && stopWhen(data)) {
        stop()
      }
    }
    eventSource.onerror = () => {
      if (stopped) return
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
    if (autoConnect) connect()
  })

  onUnmounted(() => {
    stop()
  })

  return { connect, close: stop, stop }
}
