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
  NRadioGroup,
  NRadio,
  NTimePicker,
  NSpace,
  NButton,
  NIcon,
  NDatePicker,
  NSwitch,
  NPopconfirm,
  NSpin,
  NDivider,
  NTag
} from 'naive-ui'
import {
  ThunderboltOutlined,
  DeleteOutlined,
  ClockCircleOutlined
} from '@vicons/antd'
import { useScheduleModal, TIMEZONE_OPTIONS } from './use-schedule-modal'
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
      handleDelete
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
      handleDelete
    }
  },
  render() {
    const { t, showModalRef, cancelModal, confirmModal } = this
    const editing = this.editing
    const cronOptions: Array<{ label: string; value: string }> =
      TIMEZONE_OPTIONS

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
      >
        <NForm
          model={this.model}
          rules={this.rules}
          ref='scheduleFormRef'
          labelPlacement='left'
          labelWidth={140}
          requireMarkPlacement='right-hanging'
        >
          <NFormItem
            label={t('project.synchronization_definition.schedule_frequency')}
            path='cronExpression'
          >
            <NSpace vertical size={12} style={{ width: '100%' }}>
              <NRadioGroup v-model={[this.frequency.type, 'value']}>
                <NSpace>
                  <NRadio value='minute'>
                    {t('project.synchronization_definition.frequency_minute')}
                  </NRadio>
                  <NRadio value='hour'>
                    {t('project.synchronization_definition.frequency_hour')}
                  </NRadio>
                  <NRadio value='day'>
                    {t('project.synchronization_definition.frequency_day')}
                  </NRadio>
                  <NRadio value='week'>
                    {t('project.synchronization_definition.frequency_week')}
                  </NRadio>
                  <NRadio value='month'>
                    {t('project.synchronization_definition.frequency_month')}
                  </NRadio>
                </NSpace>
              </NRadioGroup>
              {this.frequency.type === 'minute' && (
                <NSpace align='center'>
                  <span>
                    {t('project.synchronization_definition.frequency_every')}
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
                </NSpace>
              )}
              {this.frequency.type === 'hour' && (
                <NSpace align='center'>
                  <span>
                    {t('project.synchronization_definition.frequency_every')}
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
                </NSpace>
              )}
              {this.frequency.type === 'day' && (
                <NSpace align='center'>
                  <span>
                    {t(
                      'project.synchronization_definition.frequency_day_prefix'
                    )}
                  </span>
                  <NTimePicker
                    format='HH:mm'
                    valueFormat='HH:mm:ss'
                    formattedValue={this.frequencyTime}
                    onUpdateFormattedValue={this.handleFrequencyTimeChange}
                    style={{ width: '110px' }}
                  />
                </NSpace>
              )}
              {this.frequency.type === 'week' && (
                <NSpace align='center'>
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
                    onUpdateFormattedValue={this.handleFrequencyTimeChange}
                    style={{ width: '110px' }}
                  />
                </NSpace>
              )}
              {this.frequency.type === 'month' && (
                <NSpace align='center'>
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
                    onUpdateFormattedValue={this.handleFrequencyTimeChange}
                    style={{ width: '110px' }}
                  />
                </NSpace>
              )}
              <NSpace align='center'>
                <NInput
                  readonly
                  value={this.generatedCronExpression}
                  placeholder={t(
                    'project.synchronization_definition.generated_cron'
                  )}
                  style={{ width: '260px' }}
                />
                <NButton
                  size='small'
                  type='info'
                  ghost
                  loading={this.previewLoading}
                  onClick={this.handlePreview}
                >
                  <NIcon>
                    <ClockCircleOutlined />
                  </NIcon>
                  {t('project.synchronization_definition.cron_preview')}
                </NButton>
              </NSpace>
            </NSpace>
          </NFormItem>
          {this.previewTimes.length > 0 && (
            <NFormItem
              label={t('project.synchronization_definition.cron_preview_times')}
            >
              <NSpin show={this.previewLoading}>
                <NSpace vertical size={4}>
                  {this.previewTimes.map((time: string) => (
                    <NTag size='small' bordered={false} type='info'>
                      {time}
                    </NTag>
                  ))}
                </NSpace>
              </NSpin>
            </NFormItem>
          )}
          <NFormItem
            label={t('project.synchronization_definition.timezone')}
            path='timezone'
          >
            <NSelect
              v-model={[this.model.timezone, 'value']}
              options={cronOptions}
              style={{ width: '260px' }}
            />
          </NFormItem>
          <NFormItem
            label={t('project.synchronization_definition.retry_times')}
          >
            <NInputNumber
              v-model={[this.model.retryTimes, 'value']}
              min={0}
              max={100}
              style={{ width: '160px' }}
            />
          </NFormItem>
          <NFormItem
            label={t('project.synchronization_definition.retry_interval')}
          >
            <NInputNumber
              v-model={[this.model.retryInterval, 'value']}
              min={0}
              max={86400}
              style={{ width: '160px' }}
            />
          </NFormItem>
          <NFormItem
            label={t('project.synchronization_definition.active_start_time')}
          >
            <NDatePicker
              v-model={[this.model.activeStartTime, 'value']}
              type='datetime'
              clearable
              value-format='yyyy-MM-dd HH:mm:ss'
              style={{ width: '260px' }}
            />
          </NFormItem>
          <NFormItem
            label={t('project.synchronization_definition.active_end_time')}
          >
            <NDatePicker
              v-model={[this.model.activeEndTime, 'value']}
              type='datetime'
              clearable
              value-format='yyyy-MM-dd HH:mm:ss'
              style={{ width: '260px' }}
            />
          </NFormItem>
          <NFormItem
            label={t('project.synchronization_definition.concurrent_policy')}
          >
            <NRadioGroup v-model={[this.model.concurrentPolicy, 'value']}>
              <NSpace>
                <NRadio value={0}>
                  {t(
                    'project.synchronization_definition.concurrent_policy_skip'
                  )}
                </NRadio>
                <NRadio value={1}>
                  {t(
                    'project.synchronization_definition.concurrent_policy_parallel'
                  )}
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <NFormItem
            label={t('project.synchronization_definition.misfire_policy')}
          >
            <NRadioGroup v-model={[this.model.misfirePolicy, 'value']}>
              <NSpace>
                <NRadio value={0}>
                  {t(
                    'project.synchronization_definition.misfire_policy_ignore'
                  )}
                </NRadio>
                <NRadio value={1}>
                  {t(
                    'project.synchronization_definition.misfire_policy_fire_one'
                  )}
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
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
