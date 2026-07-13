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
import { defineComponent, ref, computed } from 'vue'
import {
  NSpace,
  NButton,
  NText,
  NIcon,
  NModal,
  NInput,
  useDialog
} from 'naive-ui'
import STabs from '@/components/tabs'
import PageLayout from '@/components/page-layout'
import StepOneForm from './step-one-form'
import StepTwoForm from './step-two-form'
import StepTwoTable from './step-two-table'
import StepThreeParams from './step-three-params'
import { PlusOutlined, SyncOutlined } from '@vicons/antd'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDetail } from './use-detail'
import styles from './index.module.scss'

const VirtualTablesDetail = defineComponent({
  name: 'VirtualTablesDetail',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const dialog = useDialog()
    const activeTab = ref('configure')
    const {
      state,
      stepOneFormRef,
      stepTwoFormRef,
      onAddRecord,
      createOrUpdate,
      onDeriveSchema,
      onPasteDerive,
      onPreviewUse,
      onPreviewFetchNext,
      onPreviewClose
    } = useDetail(route.params.id as string)
    console.log('create')

    // 根据源类型动态设置tab页
    const tabConfig = computed(() => {
      const pluginName = state.stepOne.pluginName
      const tabs = [
        { name: 'configure', label: t('virtual_tables.configure') },
        { name: 'model', label: t('virtual_tables.model') },
        { name: 'complete', label: t('virtual_tables.complete') }
      ]
      return tabs
    })

    // 源类型是否支持schema推导
    const canDeriveSchema = computed(() => {
      const pluginName = state.stepOne.pluginName
      return ['Http', 'Kafka'].includes(pluginName || '')
    })

    const onClose = () => {
      dialog.warning({
        title: t('virtual_tables.warning'),
        content: t('virtual_tables.close_confirm_tips'),
        onPositiveClick: () => {
          router.push({
            name: 'virtual-tables-list',
            query: { tab: 'virtual-tables' }
          })
        },
        positiveText: t('virtual_tables.confirm'),
        negativeText: t('virtual_tables.cancel')
      })
    }

    return () => (
      <PageLayout
        title={t(
          route.params.id
            ? t('virtual_tables.edit_virtual_tables')
            : t('virtual_tables.create_virtual_tables')
        )}
      >
        {{
          tabs: () => (
            <STabs
              value={activeTab.value}
              onUpdate:value={(val: string) => activeTab.value = val}
              tabs={tabConfig.value}
            />
          ),
          default: () => (
            <>
              <div class={styles['detail-content']}>
                <div class={styles['width-100']} v-show={activeTab.value === 'configure'}>
                  <NSpace justify='center'>
                    <StepOneForm params={state.stepOne} ref={stepOneFormRef} />
                  </NSpace>
                </div>
                <div class={styles['detail-step-two']} v-show={activeTab.value === 'model'}>
                  <StepTwoForm ref={stepTwoFormRef} />
                  <div class={styles['detail-table-header']}>
                    <NText class={styles['detail-table-title']}>
                      {t('virtual_tables.table_structure')}
                    </NText>
                    <NButton text type='primary' onClick={onAddRecord}>
                      {{
                        icon: () => (
                          <NIcon>
                            <PlusOutlined />
                          </NIcon>
                        ),
                        default: () => t('virtual_tables.add')
                      }}
                    </NButton>
                    {canDeriveSchema.value && (
                      <NButton text type='primary' onClick={onDeriveSchema}>
                        {{
                          icon: () => (
                            <NIcon>
                              <SyncOutlined />
                            </NIcon>
                          ),
                          default: () => t('virtual_tables.derive_schema')
                        }}
                      </NButton>
                    )}
                  </div>
                  <StepTwoTable
                    list={state.stepTwo.list}
                    fieldTypes={state.fieldTypes}
                  />
                </div>
                <div
                  class={styles['detail-step-three']}
                  v-show={activeTab.value === 'complete'}
                >
                  <div class={styles['detail-step-three-params']}>
                    <StepThreeParams
                      class={styles['detail-step-three-left']}
                      params={[
                        {
                          label: t('virtual_tables.source_type'),
                          value: state.stepOne.pluginName || ''
                        },
                        {
                          label: t('virtual_tables.source_name'),
                          value: state.stepOne.datasourceName || ''
                        },
                        {
                          label: t('virtual_tables.virtual_tables_name'),
                          value: state.stepOne.tableName || ''
                        }
                      ]}
                    />
                    <StepThreeParams
                      class={styles['detail-step-three-right']}
                      params={state.stepTwo.config}
                      cols={3}
                    />
                  </div>
                  <StepTwoTable
                    class={styles['width-100']}
                    list={state.stepTwo.list}
                    plain
                    fieldTypes={state.fieldTypes}
                  />
                </div>
              </div>
              <NSpace justify='end'>
                <NButton onClick={onClose}>{t('virtual_tables.cancel')}</NButton>
                <NButton
                  onClick={createOrUpdate}
                  loading={state.saving}
                  type='primary'
                >
                  {t('virtual_tables.confirm')}
                </NButton>
              </NSpace>
              <NModal
          show={state.previewModal.show}
          preset='card'
          title={
            state.previewModal.mode === 'paste'
              ? t('virtual_tables.derive_schema_paste_title')
              : t('virtual_tables.preview_message_title')
          }
          style={{ width: '640px' }}
          loading={state.previewModal.deriving}
          onUpdateShow={(val: boolean) => {
            if (!val) onPreviewClose()
          }}
        >
          {state.previewModal.mode === 'paste' ? (
            <NSpace vertical>
              <NInput
                type='textarea'
                rows={10}
                placeholder={t(
                  'virtual_tables.derive_schema_paste_placeholder'
                )}
                value={state.previewModal.value}
                onUpdateValue={(val: string) => {
                  state.previewModal.value = val
                }}
                style={{
                  maxHeight: '360px',
                  overflowY: 'auto'
                }}
              />
              <NSpace justify='end'>
                <NButton
                  type='primary'
                  onClick={onPasteDerive}
                  loading={state.previewModal.deriving}
                  disabled={!state.previewModal.value}
                >
                  {t('virtual_tables.derive_schema_paste_derive')}
                </NButton>
              </NSpace>
            </NSpace>
          ) : (
            <NSpace vertical>
              <NText depth='3'>
                {t('virtual_tables.preview_message_offset', {
                  offset: state.previewModal.offset
                })}
              </NText>
              <NText>
                <pre
                  style={{
                    background: 'var(--color-surface)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'auto',
                    maxHeight: '320px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {state.previewModal.loading
                    ? t('virtual_tables.preview_message_loading')
                    : state.previewModal.value ||
                      t('virtual_tables.preview_message_empty')}
                </pre>
              </NText>
              <NSpace justify='end'>
                <NButton
                  onClick={onPreviewFetchNext}
                  loading={state.previewModal.loading}
                  disabled={state.previewModal.deriving}
                >
                  {t('virtual_tables.preview_fetch_next')}
                </NButton>
                <NButton
                  type='primary'
                  onClick={onPreviewUse}
                  loading={state.previewModal.deriving}
                  disabled={
                    state.previewModal.loading || !state.previewModal.value
                  }
                >
                  {t('virtual_tables.preview_use')}
                </NButton>
              </NSpace>
            </NSpace>
          )}
        </NModal>
            </>
          )
        }}
      </PageLayout>
    )
  }
})

export default VirtualTablesDetail
