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

import {
  defineComponent,
  PropType,
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  computed
} from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NButton,
  NEmpty,
  NAlert,
  NSwitch,
  NInput,
  NTag,
  NIcon
} from 'naive-ui'
import { SearchOutlined, CopyOutlined } from '@vicons/antd'
import { getLogNodes, getLogContent } from '@/service/log'
import styles from './log-viewer-modal.module.scss'

const LogViewerModal = defineComponent({
  name: 'LogViewerModal',
  props: {
    show: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    jobId: {
      type: [String, Number] as PropType<string | number>,
      default: ''
    },
    jobName: {
      type: String as PropType<string>,
      default: ''
    }
  },
  emits: ['update:show'],
  setup(props) {
    const { t } = useI18n()

    const logNodes = ref<any[]>([])
    const selectedLogNode = ref('')
    const logContent = ref('')
    const loading = ref(false)
    const loadingLogs = ref(false)
    const refreshInterval = ref(5)
    const autoScroll = ref(true)
    const logContentRef = ref<HTMLElement | null>(null)
    const error = ref('')
    const refreshTimerId = ref<number | null>(null)
    const userScrolled = ref(false)
    const searchQuery = ref('')
    const logStats = ref({ total: 0, error: 0, warn: 0 })

    const refreshIntervalOptions = [
      { label: t('project.synchronization_instance.refresh_off'), value: 0 },
      { label: t('project.synchronization_instance.refresh_1s'), value: 1 },
      { label: t('project.synchronization_instance.refresh_5s'), value: 5 },
      { label: t('project.synchronization_instance.refresh_10s'), value: 10 },
      { label: t('project.synchronization_instance.refresh_30s'), value: 30 },
      { label: t('project.synchronization_instance.refresh_60s'), value: 60 }
    ]

    const filteredLogLines = computed(() => {
      if (!logContent.value) return []
      const lines = logContent.value.split('\n')
      if (!searchQuery.value) {
        return lines
      }
      const q = searchQuery.value.toLowerCase()
      return lines.filter((l) => l.toLowerCase().includes(q))
    })

    function countLogLevels(content: string) {
      const lines = content.split('\n')
      let err = 0,
        warn = 0
      for (const l of lines) {
        if (/\bERROR\b/.test(l)) err++
        else if (/\bWARN\b/.test(l)) warn++
      }
      return { total: lines.length, error: err, warn }
    }

    function getLineClass(line: string): string {
      if (/\bERROR\b/.test(line)) return styles['line-error']
      if (/\bWARN\b/.test(line)) return styles['line-warn']
      return ''
    }

    const fetchLogNodes = async () => {
      if (!props.jobId) return

      loading.value = true
      error.value = ''

      try {
        const response = await getLogNodes(props.jobId)
        if (Array.isArray(response.data)) {
          logNodes.value = response.data
        }

        if (logNodes.value.length > 0) {
          selectedLogNode.value = logNodes.value[0].logLink
          fetchLogContent()
        } else {
          loading.value = false
          logContent.value = ''
        }
      } catch (err: any) {
        error.value =
          err.message || t('project.synchronization_instance.fetch_logs_error')
        loading.value = false
      }
    }

    const fetchLogContent = async () => {
      if (!selectedLogNode.value) return

      if (logContent.value === '') {
        loadingLogs.value = true
      }
      error.value = ''

      try {
        const response = await getLogContent(selectedLogNode.value)

        if (response && response.data !== undefined) {
          let newContent = ''
          if (typeof response.data === 'string') {
            newContent = response.data
          } else if (typeof response.data === 'object') {
            newContent = JSON.stringify(response.data, null, 2)
          } else {
            newContent = String(response.data)
          }

          if (newContent !== logContent.value) {
            logContent.value = newContent
            logStats.value = countLogLevels(newContent)

            if (autoScroll.value && !userScrolled.value) {
              scrollToBottom()
            }
          }
        }

        loading.value = false
        loadingLogs.value = false
      } catch (err: any) {
        error.value =
          err.message ||
          t('project.synchronization_instance.fetch_log_content_error')
        loading.value = false
        loadingLogs.value = false
      }
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (logContentRef.value) {
          logContentRef.value.scrollTop = logContentRef.value.scrollHeight
        }
      })
    }

    const setupRefreshInterval = () => {
      clearRefreshTimer()

      if (refreshInterval.value > 0) {
        refreshTimerId.value = window.setInterval(() => {
          fetchLogContent()
        }, refreshInterval.value * 1000)
      }
    }

    const clearRefreshTimer = () => {
      if (refreshTimerId.value !== null) {
        clearInterval(refreshTimerId.value)
        refreshTimerId.value = null
      }
    }

    const handleRefresh = () => {
      fetchLogContent()
    }

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      const isAtBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 10
      userScrolled.value = !isAtBottom
    }

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(logContent.value)
        window.$message.success(
          t('project.synchronization_instance.copy_success')
        )
      } catch {
        window.$message.error(t('project.synchronization_instance.copy_failed'))
      }
    }

    watch(
      () => selectedLogNode.value,
      () => {
        logContent.value = ''
        fetchLogContent()
      }
    )

    watch(
      () => refreshInterval.value,
      () => {
        setupRefreshInterval()
      }
    )

    watch(
      () => props.show,
      (newVal) => {
        if (newVal) {
          fetchLogNodes()
          setupRefreshInterval()
        } else {
          clearRefreshTimer()
        }
      }
    )

    onMounted(() => {
      if (props.show) {
        fetchLogNodes()
        setupRefreshInterval()
      }
    })

    onUnmounted(() => {
      clearRefreshTimer()
    })

    return {
      t,
      logNodes,
      selectedLogNode,
      logContent,
      loading,
      loadingLogs,
      refreshInterval,
      autoScroll,
      logContentRef,
      error,
      refreshIntervalOptions,
      userScrolled,
      searchQuery,
      filteredLogLines,
      logStats,
      handleRefresh,
      handleScroll,
      scrollToBottom,
      handleCopy,
      getLineClass
    }
  },
  render() {
    const { t } = this

    return (
      <NModal
        show={this.show}
        onUpdateShow={(v: boolean) => this.$emit('update:show', v)}
        title={
          t('project.synchronization_instance.view_log') +
          (this.jobName ? `: ${this.jobName}` : '')
        }
        style='width: 90%; max-width: 1600px;'
        preset='card'
      >
        <NSpace vertical size='small'>
          {this.error && (
            <NAlert type='error' closable>
              {this.error}
            </NAlert>
          )}

          <div class={styles['control-panel']}>
            <div class={styles['control-group']}>
              <label class={styles['control-label']}>
                {t('project.synchronization_instance.log_node')}:
              </label>
              <NSelect
                v-model:value={this.selectedLogNode}
                options={this.logNodes.map((node) => ({
                  label: node.node + ' - ' + node.logName,
                  value: node.logLink
                }))}
                style='min-width: 300px;'
                loading={this.loading}
                disabled={this.loading || this.logNodes.length === 0}
              />
            </div>

            <div class={styles['control-group']}>
              <div class={styles['control-item']}>
                <label class={styles['control-label']}>
                  {t('project.synchronization_instance.auto_scroll')}:
                </label>
                <NSwitch v-model:value={this.autoScroll} />
              </div>
              <div class={styles['control-item']}>
                <label class={styles['control-label']}>
                  {t('project.synchronization_instance.auto_refresh')}:
                </label>
                <NSelect
                  v-model:value={this.refreshInterval}
                  options={this.refreshIntervalOptions}
                  style='min-width: 120px;'
                />
              </div>
              <NButton
                onClick={this.handleRefresh}
                loading={this.loadingLogs}
                class={styles['refresh-button']}
              >
                {t('project.synchronization_instance.refresh')}
              </NButton>
              <NButton
                onClick={this.handleCopy}
                class={styles['refresh-button']}
              >
                <NIcon>
                  <CopyOutlined />
                </NIcon>
              </NButton>
            </div>
          </div>

          <div class={styles['toolbar-panel']}>
            <NInput
              v-model:value={this.searchQuery}
              placeholder={t('project.synchronization_instance.search_logs')}
              clearable
              style='width: 300px;'
            >
              {{
                prefix: () => (
                  <NIcon>
                    <SearchOutlined />
                  </NIcon>
                )
              }}
            </NInput>
            <NSpace size='small'>
              {this.logStats.total > 0 && (
                <>
                  <NTag size='small'>
                    {this.logStats.total +
                      ' ' +
                      t('project.synchronization_instance.lines')}
                  </NTag>
                  {this.logStats.error > 0 && (
                    <NTag type='error' size='small'>
                      {'ERROR ' + this.logStats.error}
                    </NTag>
                  )}
                  {this.logStats.warn > 0 && (
                    <NTag type='warning' size='small'>
                      {'WARN ' + this.logStats.warn}
                    </NTag>
                  )}
                </>
              )}
            </NSpace>
          </div>

          <div class={styles['log-content-container']}>
            {this.loading ? (
              <div class={styles['loading-container']}>
                <NSpin size='large' />
              </div>
            ) : this.logNodes.length === 0 ? (
              <NEmpty
                description={t(
                  'project.synchronization_instance.no_logs_available'
                )}
              />
            ) : (
              <div
                class={styles['log-content']}
                ref='logContentRef'
                onScroll={this.handleScroll}
              >
                {this.loadingLogs ? (
                  <NSpin size='small' />
                ) : (
                  <pre>
                    {this.filteredLogLines.map((line, i) => (
                      <span key={i} class={this.getLineClass(line)}>
                        {line}
                        {'\n'}
                      </span>
                    ))}
                  </pre>
                )}
                {this.userScrolled && this.autoScroll && (
                  <div
                    style='position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;'
                    onClick={this.scrollToBottom}
                  >
                    {t('project.synchronization_instance.scroll_to_bottom')}
                  </div>
                )}
              </div>
            )}
          </div>
        </NSpace>
      </NModal>
    )
  }
})

export default LogViewerModal
