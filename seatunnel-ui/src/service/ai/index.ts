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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function getAuthHeaders(): Record<string, string> {
  const userStore = (window as any).__user_store__
  const token = userStore?.getState?.()?.token || userStore?.userInfo?.token
  if (token) return { token }
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const t = JSON.parse(stored)?.userInfo?.token
      if (t) return { token: t }
    }
  } catch {}
  return {}
}

export async function chatStream(
  messages: ChatMessage[],
  onMessage: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/seatunnel/api/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ messages }),
      signal: abortSignal
    })

    if (!response.ok) {
      onError(`AI 服务响应异常 (${response.status})`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('AI 服务返回空响应')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const eventBody = trimmed.slice(5).trim()
        if (eventBody === '[DONE]') {
          onDone()
          return
        }

        try {
          const parsed = JSON.parse(eventBody)
          const text = parsed?.content || parsed?.message?.content
          if (text) {
            onMessage(text)
          }
        } catch {
          if (eventBody) {
            onMessage(eventBody)
          }
        }
      }
    }

    onDone()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone()
      return
    }
    onError(String(err?.message || 'AI 服务连接失败'))
  }
}

export async function actionStream(
  messages: ChatMessage[],
  onMessage: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/seatunnel/api/v1/ai/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ messages }),
      signal: abortSignal
    })

    if (!response.ok) {
      onError(`AI 服务响应异常 (${response.status})`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('AI 服务返回空响应')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Split by blank lines (SSE event boundary), keep incomplete tail
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''

      for (const part of parts) {
        const dataLines: string[] = []
        for (const line of part.split('\n')) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5))
          }
        }

        let raw = dataLines.join('\n').trim()

        if (raw === '[DONE]') {
          onDone()
          return
        }

        // Try JSON envelope, fall back to raw text
        let text = raw
        try {
          const parsed = JSON.parse(raw)
          if (parsed?.content) text = parsed.content
          else if (parsed?.message?.content) text = parsed.message.content
        } catch {
          // not JSON, use raw
        }

        if (text && !text.startsWith('🤔') && !text.startsWith('🔧')) {
          onMessage(text)
        }
      }
    }

    onDone()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone()
      return
    }
    onError(String(err?.message || 'AI 服务连接失败'))
  }
}
