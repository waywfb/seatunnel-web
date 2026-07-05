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

import { defineComponent, ref, nextTick, onMounted } from 'vue'
import {
  NButton,
  NInput,
  NSpace,
  NCard,
  NScrollbar,
  NSpin,
  NTag,
  useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { actionStream } from '@/service/ai'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  loading?: boolean
  error?: boolean
}

const AiChat = defineComponent({
  name: 'AiChat',
  setup() {
    const { t } = useI18n()
    const message = useMessage()

    const messages = ref<ChatMessage[]>([
      {
        role: 'assistant',
        content: '你好！我是 SeaTunnel Web 智能助手。你可以告诉我你想连接什么数据源，例如："帮我接 MQTT"，我会帮你完成配置。'
      }
    ])
    const inputText = ref('')
    const loading = ref(false)
    const abortController = ref<AbortController | null>(null)
    const scrollbarRef = ref<any>(null)
    const currentAssistantMsg = ref<ChatMessage | null>(null)

    const scrollToBottom = async () => {
      await nextTick()
      setTimeout(() => {
        scrollbarRef.value?.scrollTo?.({
          top: 99999,
          behavior: 'instant'
        } as any)
      }, 50)
    }

    const sendMessage = async () => {
      const text = inputText.value.trim()
      if (!text || loading.value) return

      inputText.value = ''
      messages.value.push({ role: 'user', content: text })
      await scrollToBottom()

      loading.value = true
      abortController.value = new AbortController()

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        loading: true
      }
      messages.value.push(assistantMsg)
      currentAssistantMsg.value = assistantMsg

      const chatMessages = messages.value
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      await actionStream(
        chatMessages,
        (chunk) => {
          assistantMsg.content += chunk
          assistantMsg.loading = true
          messages.value = [...messages.value]
          scrollToBottom()
        },
        () => {
          assistantMsg.loading = false
          loading.value = false
          abortController.value = null
          currentAssistantMsg.value = null
          messages.value = [...messages.value]
          scrollToBottom()
        },
        (err) => {
          assistantMsg.content = err || 'AI 服务连接失败，请稍后重试。'
          assistantMsg.loading = false
          assistantMsg.error = true
          loading.value = false
          abortController.value = null
          currentAssistantMsg.value = null
          messages.value = [...messages.value]
          scrollToBottom()
        },
        abortController.value?.signal
      )
    }

    const stopGeneration = () => {
      abortController.value?.abort()
      loading.value = false
      if (currentAssistantMsg.value) {
        currentAssistantMsg.value.loading = false
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }

    const renderMarkdown = (content: string) => {
      const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      const withCode = escaped.replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) => {
          return `<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px;margin:8px 0"><code>${code.trim()}</code></pre>`
        }
      )

      const withBold = withCode.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

      const withInline = withBold.replace(
        /`([^`]+)`/g,
        '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:0.9em">$1</code>'
      )

      const withNewlines = withInline.replace(/\n/g, '<br/>')

      return withNewlines
    }

    return {
      t,
      message,
      messages,
      inputText,
      loading,
      sendMessage,
      stopGeneration,
      handleKeydown,
      renderMarkdown,
      scrollbarRef
    }
  },
  render() {
    return (
      <NCard
        title={this.t('menu.ai_assistant') || 'AI 助手'}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        contentStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}
        bordered={false}
      >
        <NScrollbar
          ref="scrollbarRef"
          style={{ flex: 1, padding: '16px 20px' }}
          trigger="none"
        >
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {this.messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  marginBottom: '16px',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? '#2080f0' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.loading && !msg.content ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ animation: 'pulse 1.2s infinite' }}>●</span>
                      <span style={{ animation: 'pulse 1.2s infinite 0.2s' }}>●</span>
                      <span style={{ animation: 'pulse 1.2s infinite 0.4s' }}>●</span>
                    </span>
                  ) : msg.role === 'assistant' ? (
                    <span domPropsInnerHTML={this.renderMarkdown(msg.content)} />
                  ) : (
                    <span>{msg.content}</span>
                  )}
                  {msg.error && (
                    <NTag type="error" size="small" style={{ marginTop: 8 }}>
                      连接失败
                    </NTag>
                  )}
                </div>
              </div>
            ))}
            {this.loading && (
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <NSpin size="small" />
              </div>
            )}
          </div>
        </NScrollbar>

        <div
          style={{
            borderTop: '1px solid #eee',
            padding: '12px 20px',
            background: '#fff'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', maxWidth: 720, margin: '0 auto' }}>
            <NInput
              value={this.inputText}
              onUpdateValue={(val: string) => (this.inputText = val)}
              placeholder="输入消息，例如「帮我接 MQTT」..."
              onKeydown={this.handleKeydown}
              disabled={this.loading}
              autosize={{ minRows: 1, maxRows: 4 }}
              type="textarea"
              style={{ flex: 1 }}
            />
            {this.loading ? (
              <NButton onClick={this.stopGeneration} type="warning">
                停止
              </NButton>
            ) : (
              <NButton onClick={this.sendMessage} type="primary" disabled={!this.inputText.trim()}>
                发送
              </NButton>
            )}
          </div>
        </div>
      </NCard>
    )
  }
})

export default AiChat
