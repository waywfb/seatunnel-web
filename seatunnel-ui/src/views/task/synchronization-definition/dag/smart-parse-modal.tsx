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

import { defineComponent, PropType, ref } from 'vue'
import {
  NForm,
  NFormItem,
  NRadioGroup,
  NRadio,
  NSpace,
  NDataTable,
  NAlert
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

interface FlattenedField {
  path: string
  destField: string
  destType: string
}

const SmartParseModal = defineComponent({
  name: 'SmartParseModal',
  props: {
    fields: {
      type: Array as PropType<FlattenedField[]>,
      default: () => []
    },
    hasMessage: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    loading: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  },
  emits: ['update:strategy', 'update:fields'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const strategyRef = ref('SMART')

    const onStrategyChange = (val: string) => {
      strategyRef.value = val
      emit('update:strategy', val)
    }

    const columns = [
      {
        title: t('project.synchronization_definition.field_name'),
        key: 'destField',
        width: 180
      },
      {
        title: 'JSONPath',
        key: 'path',
        width: 280
      },
      {
        title: t('project.synchronization_definition.field_type'),
        key: 'destType',
        width: 100
      }
    ]

    const strategyOptions = [
      {
        value: 'SMART',
        label: t('project.synchronization_definition.smart_parse_smart')
      },
      {
        value: 'FLAT_ALL',
        label: t('project.synchronization_definition.smart_parse_flat_all')
      },
      {
        value: 'KEEP_JSON',
        label: t('project.synchronization_definition.smart_parse_keep_json')
      }
    ]

    return () => (
      <NForm>
        <NFormItem
          label={t('project.synchronization_definition.smart_parse_strategy')}
        >
          <NRadioGroup
            value={strategyRef.value}
            onUpdateValue={onStrategyChange}
          >
            <NSpace vertical>
              {strategyOptions.map((opt) => (
                <NRadio key={opt.value} value={opt.value}>
                  {opt.label}
                </NRadio>
              ))}
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        {!props.hasMessage && !props.loading && (
          <NAlert type='warning' closable={false}>
            {t('project.synchronization_definition.smart_parse_no_cache')}
          </NAlert>
        )}
        {props.hasMessage && props.fields.length > 0 && (
          <NFormItem
            label={t('project.synchronization_definition.smart_parse_preview')}
          >
            <NDataTable
              columns={columns}
              data={props.fields}
              striped
              size='small'
              maxHeight={300}
            />
          </NFormItem>
        )}
      </NForm>
    )
  }
})

export default SmartParseModal
