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

import { defineComponent, PropType, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NButton,
  NIcon,
  NSwitch,
  NPopconfirm,
  NSpin,
  NDivider,
  NTag,
  NTimePicker
} from 'naive-ui'
import {
  ThunderboltOutlined,
  DeleteOutlined,
  ClockCircleOutlined
} from '@vicons/antd'
import { useScheduleModal } from './use-schedule-modal'
import Modal from '@/components/modal'

const props = {
  showModalRef: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  row: {
    type: Object as PropType<any>,
    default: {}
  }
}

const ScheduleModal = defineComponent({
  name: 'ScheduleModal',
  props,
  emits: ['cancelModal', 'confirmModal'],
  setup(props, ctx) {
    const { t, tm } = useI18n()
    const weekdays = tm(
      'project.synchronization_definition.frequency_weekdays'
    ) as unknown as string[]
    const weekdayOptions = weekdays.map((label, index) => ({
      label,
      value: index + 1
    }))
    const {
      variables,
      generatedCronExpression,
      frequencyTime,
      handleFrequencyTimeChange,
      handleValidate,
      handlePreview,
      handleToggleStatus,
      handleTrigger,
      handleDelete,
      summaryText,
      validateCronExpression
    } = useScheduleModal(props, ctx)

    const cancelModal = () => {
      ctx.emit('cancelModal', props.showModalRef)
    }

    const confirmModal = () => {
      handleValidate()
    }

    return {
      t,
      ...toRefs(variables),
      generatedCronExpression,
      frequencyTime,
      handleFrequencyTimeChange,
      weekdayOptions,
      cancelModal,
      confirmModal,
      handlePreview,
      handleToggleStatus,
      handleTrigger,
      handleDelete,
      summaryText,
      validateCronExpression
    }
  },
  render() {
    const { t, showModalRef, cancelModal, confirmModal } = this
    const editing = this.editing

    const freqTabs = [
      {
        key: 'minute',
        label: t('project.synchronization_definition.frequency_minute')
      },
      {
        key: 'hour',
        label: t('project.synchronization_definition.frequency_hour')
      },
      {
        key: 'day',
        label: t('project.synchronization_definition.frequency_day')
      },
      {
        key: 'week',
        label: t('project.synchronization_definition.frequency_week')
      },
      {
        key: 'month',
        label: t('project.synchronization_definition.frequency_month')
      }
    ]

    return (
      <Modal
        title={t(
          editing
            ? 'project.synchronization_definition.schedule_edit'
            : 'project.synchronization_definition.schedule_create'
        )}
        show={showModalRef}
        closable
        onCancel={cancelModal}
        onConfirm={confirmModal}
        confirmLoading={this.saving}
        confirmText={t('project.synchronization_definition.save')}
        width='900px'
      >
        <NForm
          model={this.model}
          rules={this.rules}
          ref='scheduleFormRef'
          labelPlacement='left'
          labelWidth={140}
          requireMarkPlacement='right-hanging'
        >
          {/* Mode Switcher */}
          <div class='flex items-center justify-between pb-4 border-b border-slate-200'>
            <div>
              <h1 class='text-xl font-bold text-slate-900'>
                {t('project.synchronization_definition.schedule')}
              </h1>
              <p class='text-xs text-slate-500 mt-0.5'>
                {t('project.synchronization_definition.schedule_desc')}
              </p>
            </div>
            <div class='flex items-center bg-slate-200 p-0.5 rounded-md text-xs font-medium text-slate-600'>
              <button
                type='button'
                class={{
                  'px-3 py-1.5 rounded-sm transition': true,
                  'bg-white text-emerald-700 shadow-sm font-bold':
                    this.mode === 'friendly',
                  'hover:text-slate-900': this.mode !== 'friendly'
                }}
                onClick={() => (this.mode = 'friendly')}
              >
                {t('project.synchronization_definition.schedule_mode_friendly')}
              </button>
              <button
                type='button'
                class={{
                  'px-3 py-1.5 rounded-sm transition': true,
                  'bg-white text-emerald-700 shadow-sm font-bold':
                    this.mode === 'cron',
                  'hover:text-slate-900': this.mode !== 'cron'
                }}
                onClick={() => (this.mode = 'cron')}
              >
                {t('project.synchronization_definition.schedule_mode_cron')}
              </button>
            </div>
          </div>

          {/* Summary Banner */}
          <div class='my-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-3 text-sm text-emerald-900'>
            <div class='p-1.5 bg-emerald-100 rounded-md text-emerald-600 mt-0.5'>
              <NIcon size={20}>
                <ClockCircleOutlined />
              </NIcon>
            </div>
            <div class='flex-1'>
              <div class='font-semibold text-xs text-emerald-700 uppercase tracking-wider'>
                {t('project.synchronization_definition.schedule_summary_title')}
              </div>
              <div class='font-bold text-base text-emerald-950 mt-0.5'>
                {this.summaryText}
              </div>
            </div>
          </div>

          {/* Frequency Section */}
          <NFormItem
            label={t('project.synchronization_definition.schedule_frequency')}
            path='cronExpression'
          >
            {/* Friendly Mode View */}
            {this.mode === 'friendly' && (
              <NSpace vertical size={12} style={{ width: '100%' }}>
                {/* Segmented Frequency Tab */}
                <div class='grid grid-cols-5 gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-medium text-slate-600'>
                  {freqTabs.map((tab) => (
                    <button
                      type='button'
                      key={tab.key}
                      class={{
                        'py-2 rounded-md text-center transition': true,
                        'bg-white text-emerald-700 font-bold shadow-sm':
                          this.frequency.type === tab.key,
                        'hover:bg-white/60': this.frequency.type !== tab.key
                      }}
                      onClick={() => (this.frequency.type = tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Time Detail Config Sub-panel */}
                <div class='p-3.5 bg-white border border-slate-200 rounded-lg space-y-3'>
                  <div class='flex flex-wrap items-center gap-3 text-sm'>
                    {this.frequency.type === 'minute' && (
                      <>
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_every'
                          )}
                        </span>
                        <NInputNumber
                          v-model={[this.frequency.minuteInterval, 'value']}
                          min={1}
                          max={59}
                          style={{ width: '90px' }}
                        />
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_minute_unit'
                          )}
                        </span>
                      </>
                    )}
                    {this.frequency.type === 'hour' && (
                      <>
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_every'
                          )}
                        </span>
                        <NInputNumber
                          v-model={[this.frequency.hourInterval, 'value']}
                          min={1}
                          max={23}
                          style={{ width: '90px' }}
                        />
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_hour_unit'
                          )}
                        </span>
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_minute_of_hour'
                          )}
                        </span>
                        <NInputNumber
                          v-model={[this.frequency.minuteOfHour, 'value']}
                          min={0}
                          max={59}
                          style={{ width: '90px' }}
                        />
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_minute_unit'
                          )}
                        </span>
                      </>
                    )}
                    {this.frequency.type === 'day' && (
                      <>
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_day_prefix'
                          )}
                        </span>
                        <NTimePicker
                          format='HH:mm'
                          valueFormat='HH:mm:ss'
                          formattedValue={this.frequencyTime}
                          onUpdateFormattedValue={
                            this.handleFrequencyTimeChange
                          }
                          style={{ width: '110px' }}
                        />
                      </>
                    )}
                    {this.frequency.type === 'week' && (
                      <>
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_week_prefix'
                          )}
                        </span>
                        <NSelect
                          v-model={[this.frequency.weekday, 'value']}
                          options={this.weekdayOptions}
                          style={{ width: '90px' }}
                        />
                        <NTimePicker
                          format='HH:mm'
                          valueFormat='HH:mm:ss'
                          formattedValue={this.frequencyTime}
                          onUpdateFormattedValue={
                            this.handleFrequencyTimeChange
                          }
                          style={{ width: '110px' }}
                        />
                      </>
                    )}
                    {this.frequency.type === 'month' && (
                      <>
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_month_prefix'
                          )}
                        </span>
                        <NInputNumber
                          v-model={[this.frequency.dayOfMonth, 'value']}
                          min={1}
                          max={31}
                          style={{ width: '90px' }}
                        />
                        <span>
                          {t(
                            'project.synchronization_definition.frequency_month_suffix'
                          )}
                        </span>
                        <NTimePicker
                          format='HH:mm'
                          valueFormat='HH:mm:ss'
                          formattedValue={this.frequencyTime}
                          onUpdateFormattedValue={
                            this.handleFrequencyTimeChange
                          }
                          style={{ width: '110px' }}
                        />
                      </>
                    )}
                  </div>

                  {/* Generated Cron Expression */}
                  <NSpace align='center'>
                    <NInput
                      readonly
                      value={this.generatedCronExpression}
                      placeholder={t(
                        'project.synchronization_definition.generated_cron'
                      )}
                      style={{ width: '260px' }}
                    />
                  </NSpace>

                  {/* Execution Time Preview */}
                  <div class='pt-2 border-t border-slate-100'>
                    <div class='text-xs text-slate-400 mb-1 flex items-center justify-between'>
                      <span>
                        💡{' '}
                        {t(
                          'project.synchronization_definition.execution_time_tip'
                        )}
                        ：
                      </span>
                      <span class='text-slate-400 font-mono'>
                        {t('project.synchronization_definition.timezone_fixed')}
                      </span>
                    </div>
                    <NSpin show={this.previewLoading}>
                      <div class='flex flex-wrap gap-2 text-xs font-mono text-slate-600'>
                        {this.previewTimes.map((time: string) => (
                          <span class='bg-slate-100 px-2 py-1 rounded'>
                            {time}
                          </span>
                        ))}
                      </div>
                    </NSpin>
                  </div>
                </div>
              </NSpace>
            )}

            {/* Cron Expert Mode View */}
            {this.mode === 'cron' && (
              <NSpace vertical size={12} style={{ width: '100%' }}>
                <div class='flex items-center space-x-2'>
                  <NInput
                    v-model={[this.model.cronExpression, 'value']}
                    placeholder={t(
                      'project.synchronization_definition.cron_expression_placeholder'
                    )}
                    style={{ flex: 1 }}
                  />
                  <NButton
                    size='small'
                    type='info'
                    ghost
                    onClick={() => {
                      if (
                        this.validateCronExpression(this.model.cronExpression)
                      ) {
                        this.handlePreview()
                      } else {
                        this.$message?.error?.(
                          t('project.synchronization_definition.cron_invalid')
                        )
                      }
                    }}
                  >
                    {t('project.synchronization_definition.cron_validate')}
                  </NButton>
                </div>
                <p class='text-xs text-slate-500'>
                  {t('project.synchronization_definition.cron_format_tip')}
                </p>

                {/* Execution Time Preview */}
                <div class='pt-2 border-t border-slate-100'>
                  <div class='text-xs text-slate-400 mb-1 flex items-center justify-between'>
                    <span>
                      💡{' '}
                      {t(
                        'project.synchronization_definition.execution_time_tip'
                      )}
                      ：
                    </span>
                    <span class='text-slate-400 font-mono'>
                      {t('project.synchronization_definition.timezone_fixed')}
                    </span>
                  </div>
                  <NSpin show={this.previewLoading}>
                    <div class='flex flex-wrap gap-2 text-xs font-mono text-slate-600'>
                      {this.previewTimes.map((time: string) => (
                        <span class='bg-slate-100 px-2 py-1 rounded'>
                          {time}
                        </span>
                      ))}
                    </div>
                  </NSpin>
                </div>
              </NSpace>
            )}
          </NFormItem>

          {/* Concurrency Control */}
          <NFormItem
            label={t('project.synchronization_definition.concurrent_policy')}
          >
            <div class='grid grid-cols-2 gap-3'>
              <label
                class={{
                  'relative flex items-start p-3 border rounded-lg cursor-pointer transition':
                    true,
                  'border-emerald-500 bg-emerald-50/40':
                    this.model.concurrentPolicy === 0,
                  'border-slate-200 bg-white hover:border-slate-300':
                    this.model.concurrentPolicy !== 0
                }}
              >
                <input
                  type='radio'
                  name='concurrency'
                  value={0}
                  checked={this.model.concurrentPolicy === 0}
                  onChange={() => (this.model.concurrentPolicy = 0)}
                  class='mt-0.5 text-emerald-600 focus:ring-emerald-500'
                />
                <div class='ml-2.5'>
                  <span class='block text-xs font-bold text-slate-900'>
                    {t(
                      'project.synchronization_definition.concurrent_policy_skip'
                    )}{' '}
                    <span class='text-emerald-700 text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded ml-1'>
                      {t('project.synchronization_definition.recommended')}
                    </span>
                  </span>
                </div>
              </label>

              <label
                class={{
                  'relative flex items-start p-3 border rounded-lg cursor-pointer transition':
                    true,
                  'border-emerald-500 bg-emerald-50/40':
                    this.model.concurrentPolicy === 1,
                  'border-slate-200 bg-white hover:border-slate-300':
                    this.model.concurrentPolicy !== 1
                }}
              >
                <input
                  type='radio'
                  name='concurrency'
                  value={1}
                  checked={this.model.concurrentPolicy === 1}
                  onChange={() => (this.model.concurrentPolicy = 1)}
                  class='mt-0.5 text-emerald-600 focus:ring-emerald-500'
                />
                <div class='ml-2.5'>
                  <span class='block text-xs font-bold text-slate-900'>
                    {t(
                      'project.synchronization_definition.concurrent_policy_parallel'
                    )}
                  </span>
                </div>
              </label>
            </div>
          </NFormItem>

          {/* Misfire Strategy */}
          <NFormItem
            label={t('project.synchronization_definition.misfire_policy')}
          >
            <div class='grid grid-cols-2 gap-3'>
              <label
                class={{
                  'relative flex items-start p-3 border rounded-lg cursor-pointer transition':
                    true,
                  'border-emerald-500 bg-emerald-50/40':
                    this.model.misfirePolicy === 0,
                  'border-slate-200 bg-white hover:border-slate-300':
                    this.model.misfirePolicy !== 0
                }}
              >
                <input
                  type='radio'
                  name='misfire'
                  value={0}
                  checked={this.model.misfirePolicy === 0}
                  onChange={() => (this.model.misfirePolicy = 0)}
                  class='mt-0.5 text-emerald-600 focus:ring-emerald-500'
                />
                <div class='ml-2.5'>
                  <span class='block text-xs font-bold text-slate-900'>
                    {t(
                      'project.synchronization_definition.misfire_policy_ignore'
                    )}{' '}
                    <span class='text-emerald-700 text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded ml-1'>
                      {t('project.synchronization_definition.recommended')}
                    </span>
                  </span>
                </div>
              </label>

              <label
                class={{
                  'relative flex items-start p-3 border rounded-lg cursor-pointer transition':
                    true,
                  'border-emerald-500 bg-emerald-50/40':
                    this.model.misfirePolicy === 1,
                  'border-slate-200 bg-white hover:border-slate-300':
                    this.model.misfirePolicy !== 1
                }}
              >
                <input
                  type='radio'
                  name='misfire'
                  value={1}
                  checked={this.model.misfirePolicy === 1}
                  onChange={() => (this.model.misfirePolicy = 1)}
                  class='mt-0.5 text-emerald-600 focus:ring-emerald-500'
                />
                <div class='ml-2.5'>
                  <span class='block text-xs font-bold text-slate-900'>
                    {t(
                      'project.synchronization_definition.misfire_policy_fire_one'
                    )}
                  </span>
                </div>
              </label>
            </div>
          </NFormItem>

          {/* Failure Retry */}
          <NFormItem
            label={t('project.synchronization_definition.retry_times')}
          >
            <div class='p-3 bg-slate-100/70 rounded-lg'>
              <div class='grid grid-cols-2 gap-3 text-xs'>
                <div>
                  <label class='text-slate-600 block mb-1'>
                    {t('project.synchronization_definition.retry_times')}
                  </label>
                  <NInputNumber
                    v-model={[this.model.retryTimes, 'value']}
                    min={0}
                    max={10}
                    style={{ width: '100%' }}
                  />
                  <span class='text-[10px] text-slate-400'>
                    {t('project.synchronization_definition.retry_times_tip')}
                  </span>
                </div>
                <div>
                  <label class='text-slate-600 block mb-1'>
                    {t('project.synchronization_definition.retry_interval')}
                  </label>
                  <NInputNumber
                    v-model={[this.model.retryInterval, 'value']}
                    min={1}
                    style={{ width: '100%' }}
                  />
                  <span class='text-[10px] text-slate-400'>
                    {t(
                      'project.synchronization_definition.retry_interval_minutes_tip'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </NFormItem>

          {/* Editing Mode Operations */}
          {editing && (
            <>
              <NDivider style={{ margin: '8px 0' }} />
              <NFormItem
                label={t('project.synchronization_definition.schedule_status')}
              >
                <NSpace align='center'>
                  <NSwitch
                    value={this.scheduleStatus}
                    checkedValue={1}
                    uncheckedValue={0}
                    onUpdateValue={(value: number) =>
                      this.handleToggleStatus(value)
                    }
                  />
                  <NTag
                    size='small'
                    bordered={false}
                    type={this.scheduleStatus === 1 ? 'success' : 'warning'}
                  >
                    {t(
                      this.scheduleStatus === 1
                        ? 'project.synchronization_definition.schedule_enabled'
                        : 'project.synchronization_definition.schedule_disabled'
                    )}
                  </NTag>
                  <NButton
                    size='small'
                    type='primary'
                    ghost
                    onClick={this.handleTrigger}
                  >
                    <NIcon>
                      <ThunderboltOutlined />
                    </NIcon>
                    {t('project.synchronization_definition.trigger_now')}
                  </NButton>
                  <NPopconfirm
                    onPositiveClick={this.handleDelete}
                    positiveText={t(
                      'project.synchronization_definition.confirm'
                    )}
                    negativeText={t(
                      'project.synchronization_definition.cancel'
                    )}
                  >
                    {{
                      trigger: () => (
                        <NButton size='small' type='error' ghost>
                          <NIcon>
                            <DeleteOutlined />
                          </NIcon>
                          {t('project.synchronization_definition.delete')}
                        </NButton>
                      ),
                      default: () =>
                        t('project.synchronization_definition.delete_confirm')
                    }}
                  </NPopconfirm>
                </NSpace>
              </NFormItem>
            </>
          )}
        </NForm>
      </Modal>
    )
  }
})

export { ScheduleModal }
