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

import { defineComponent, reactive, toRefs, watch, PropType } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NRadioGroup,
  NRadio,
  NInputNumber
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/modal'
import { alertRuleCreate, alertRuleUpdate } from '@/service/alert'
import type { AlertRule } from '@/service/alert'

interface FormState {
  model: AlertRule
  rules: any
}

const props = {
  showModal: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  status: {
    type: Number as PropType<number>,
    default: 0
  },
  row: {
    type: Object as PropType<AlertRule>,
    default: () => ({})
  }
}

const RuleFormModal = defineComponent({
  props,
  emits: ['cancelModal', 'confirmModal'],
  setup(props, ctx) {
    const { t } = useI18n()

    const state = reactive<FormState>({
      model: {
        name: '',
        webhookUrl: '',
        webhookHeaders: '',
        webhookTemplate: '',
        status: 1,
        cooldownSeconds: 300
      },
      rules: {}
    })

    const clearForm = () => {
      state.model = {
        name: '',
        webhookUrl: '',
        webhookHeaders: '',
        webhookTemplate: '',
        status: 1,
        cooldownSeconds: 300
      }
      state.rules.name = {
        required: true,
        message: t('alert.rule_name_required'),
        trigger: ['input', 'blur']
      }
      state.rules.webhookUrl = {
        required: true,
        validator: (_rule: any, value: string) => {
          if (!value) {
            return new Error(t('alert.webhook_url_required'))
          }
          if (!/^https?:\/\//i.test(value)) {
            return new Error(t('alert.webhook_url_required'))
          }
          return true
        },
        trigger: ['input', 'blur']
      }
    }

    const handleValidate = () => {
      const headers = state.model.webhookHeaders?.trim()
      if (headers) {
        try {
          const parsed = JSON.parse(headers)
          if (
            typeof parsed !== 'object' ||
            Array.isArray(parsed) ||
            parsed === null
          ) {
            throw new Error('not an object')
          }
        } catch (e) {
          window.$message.error(t('alert.headers_invalid'))
          return
        }
      }

      const req =
        props.status === 0
          ? alertRuleCreate(state.model)
          : alertRuleUpdate(state.model.id as number, state.model)

      req.then(() => {
        window.$message.success(t('common.success_tips'))
        ctx.emit('confirmModal', props.showModal)
      })
    }

    watch(
      () => props.showModal,
      (val) => {
        if (!val) return
        clearForm()
        if (props.status === 1) {
          state.model = {
            id: props.row.id,
            name: props.row.name,
            webhookUrl: props.row.webhookUrl,
            webhookHeaders: props.row.webhookHeaders || '',
            webhookTemplate: props.row.webhookTemplate || '',
            status: props.row.status,
            cooldownSeconds: props.row.cooldownSeconds
          }
        }
      }
    )

    return {
      t,
      ...toRefs(state),
      handleCancel: () => ctx.emit('cancelModal', props.showModal),
      handleConfirm: handleValidate
    }
  },
  render() {
    return (
      <Modal
        title={
          this.status === 0
            ? this.t('alert.create_rule')
            : this.t('alert.edit_rule')
        }
        show={this.showModal}
        onCancel={this.handleCancel}
        onConfirm={this.handleConfirm}
      >
        <NForm
          model={this.model}
          rules={this.rules}
          labelPlacement='left'
          labelWidth={140}
          requireMarkPlacement={true}
        >
          <NFormItem label={this.t('alert.rule_name')} path='name'>
            <NInput
              v-model={[this.model.name, 'value']}
              placeholder={this.t('alert.rule_name')}
              clearable
            />
          </NFormItem>
          <NFormItem label={this.t('alert.event_type')}>
            <span class='text-tide-text-secondary'>
              {this.t('alert.event_type_task_failed')}
            </span>
          </NFormItem>
          <NFormItem label={this.t('alert.webhook_url')} path='webhookUrl'>
            <NInput
              v-model={[this.model.webhookUrl, 'value']}
              placeholder='https://hooks.example.com/...'
              clearable
            />
          </NFormItem>
          <NFormItem
            label={this.t('alert.webhook_headers')}
            path='webhookHeaders'
          >
            <NInput
              v-model={[this.model.webhookHeaders, 'value']}
              type='textarea'
              placeholder={this.t('alert.webhook_headers_tips')}
              rows={3}
            />
          </NFormItem>
          <NFormItem
            label={this.t('alert.webhook_template')}
            path='webhookTemplate'
          >
            <NInput
              v-model={[this.model.webhookTemplate, 'value']}
              type='textarea'
              placeholder={this.t('alert.webhook_template_tips')}
              rows={4}
            />
          </NFormItem>
          <NFormItem label={this.t('alert.cooldown_seconds')}>
            <NInputNumber
              v-model={[this.model.cooldownSeconds, 'value']}
              min={1}
              max={86400}
              class='w-full'
            />
            <span class='ml-2 text-xs text-tide-text-secondary'>
              {this.t('alert.cooldown_tips')}
            </span>
          </NFormItem>
          <NFormItem label={this.t('alert.status')}>
            <NRadioGroup v-model={[this.model.status, 'value']}>
              <NRadio value={1}>{this.t('alert.status_enabled')}</NRadio>
              <NRadio value={0}>{this.t('alert.status_disabled')}</NRadio>
            </NRadioGroup>
          </NFormItem>
        </NForm>
      </Modal>
    )
  }
})

export default RuleFormModal
