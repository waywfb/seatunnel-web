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

import { defineComponent, watch, computed, ref } from 'vue'
import {
  NFormItemGi,
  NGrid,
  NInput,
  NSelect,
  NCheckboxGroup,
  NSpace,
  NCheckbox,
  NTooltip,
  NIcon,
  NCollapse,
  NCollapseItem
} from 'naive-ui'
import { QuestionCircleOutlined } from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import type { PropType } from 'vue'
import type { SelectOption } from 'naive-ui'

const props = {
  formStructure: {
    type: Object as PropType<Array<object>>
  },
  model: {
    type: Object as PropType<object>
  },
  name: {
    type: String as PropType<string>,
    default: ''
  },
  locales: {
    type: Object as PropType<object>
  },
  advancedLabel: {
    type: String as PropType<string>,
    default: ''
  }
}

const descriptionTranslations: Record<string, string> = {
  'The encoding of the file, e.g. UTF-8, ISO-8859-1....': '文件的编码格式，例如 UTF-8、ISO-8859-1 等',
  'The row delimiter of the file': '文件的行分隔符',
  'The field delimiter of the file': '文件的字段分隔符',
  'The schema of the data': '数据的结构定义',
}

const DynamicFormItem = defineComponent({
  name: 'DynamicFormItem',
  props,
  setup(props) {
    const { t, te, locale } = useI18n()

    const formLocales = ref<Record<string, Record<string, string>>>({})

    const mergeFormLocales = (locales: any) => {
      formLocales.value = {
        zh_CN: locales?.zh_CN || {},
        en_US: locales?.en_US || {}
      }
    }

    mergeFormLocales(props.locales)

    watch(
      () => props.locales,
      (newLocales) => {
        mergeFormLocales(newLocales)
      },
      { deep: true }
    )

    const formatClass = (name: string, modelField: string) => {
      return name.indexOf('[') >= 0
        ? name.split('[')[0].toLowerCase() + name.split('[')[1].split(']')[0]
        : name.toLowerCase() + '-' + modelField.toLowerCase()
    }

    const formItemDisabled = (field: string, value: Array<any>) => {
      return value.map((v) => field === v).indexOf(false) < 0
    }

    const isTranslationKey = (key: string) => /^[\w.-]+$/.test(key)

    const safeTranslate = (key: string) => {
      if (!key) return ''
      if (locale.value === 'zh_CN' && descriptionTranslations[key]) {
        return descriptionTranslations[key]
      }
      if (/^i18n\./.test(key)) {
        const lang = locale.value as string
        const msgs = formLocales.value[lang]
        if (msgs) {
          const localeKey = key.replace(/^i18n\./, '')
          if (msgs[localeKey]) return msgs[localeKey]
        }
      }
      if (!isTranslationKey(key)) return key
      try {
        return t(key)
      } catch {
        return key
      }
    }

    const getTranslation = (name: string, label: string, suffix: string) => {
      const normalizedName = name.indexOf('[') >= 0
        ? name.split('[')[0].toLowerCase()
        : name.toLowerCase()
      const key = `transforms.${normalizedName}.${label}_${suffix}`
      return te(key) ? t(key) : ''
    }

    const basicFields = computed(() => {
      if (!props.advancedLabel) return props.formStructure as Array<any>
      return (props.formStructure as Array<any>).filter((f) => f.required)
    })

    const advancedFields = computed(() => {
      if (!props.advancedLabel) return []
      return (props.formStructure as Array<any>).filter((f) => !f.required)
    })

    const renderFormField = (f: any) => {
      const visible = f.show
        ? formItemDisabled((props.model as any)[f.show.field], f.show.value)
        : true
      if (!visible) return null

      const labelText = getTranslation(props.name, f.label, 'value') || safeTranslate(f.label)
      const helpText =
        getTranslation(props.name, f.label, 'description') ||
        safeTranslate(f.description || '') ||
        getTranslation(props.name, f.label, 'placeholder') ||
        safeTranslate(f.placeholder || '')

      return (
        <NFormItemGi
          v-slots={{
            label: () => (
              <span>
                {labelText}
                {helpText && (
                  <NTooltip trigger='hover' placement='right'>
                    {{
                      trigger: () => (
                        <NIcon
                          size={16}
                          style={{
                            marginLeft: '4px',
                            cursor: 'help',
                            verticalAlign: 'middle'
                          }}
                        >
                          <QuestionCircleOutlined />
                        </NIcon>
                      ),
                      default: () => helpText
                    }}
                  </NTooltip>
                )}
              </span>
            )
          }}
          path={f.field}
          span={f.span || 24}
        >
          {f.type === 'input' && (
            <NInput
              class={`dynamic-form_${formatClass(props.name, f.field)}`}
              v-model={[(props.model as any)[f.field], 'value']}
              clearable={f.clearable}
              type={f.inputType}
              rows={f.row ? f.row : 4}
            />
          )}
          {f.type === 'select' && (
            <NSelect
              class={`dynamic-form_${formatClass(props.name, f.field)}`}
              v-model={[(props.model as any)[f.field], 'value']}
              options={(f.options || []).map((o: SelectOption) => ({
                label: safeTranslate(o.label as string),
                value: o.value
              }))}
            />
          )}
          {f.type === 'checkbox' && (
            <NCheckboxGroup
              class={`dynamic-form_${formatClass(props.name, f.field)}`}
              v-model={[(props.model as any)[f.field], 'value']}
            >
              <NSpace vertical={f.vertical}>
                  {(f.options || []).map((o: any) => (
                  <NCheckbox label={safeTranslate(o.label as string)} value={o.value} />
                ))}
              </NSpace>
            </NCheckboxGroup>
          )}
        </NFormItemGi>
      )
    }

    return {
      t,
      te,
      getTranslation,
      formatClass,
      formItemDisabled,
      basicFields,
      advancedFields,
      renderFormField
    }
  },
  render() {
    const allFields = this.formStructure as Array<any>

    if ((this.advancedFields as Array<any>).length > 0) {
      const renderGrid = (fields: Array<any>) => (
        <NGrid xGap={10}>
          {fields.map((f) => (this.renderFormField as Function)(f))}
        </NGrid>
      )
      return (
        <>
          {renderGrid(this.basicFields as Array<any>)}
          <NCollapse>
            <NCollapseItem title={this.advancedLabel} name='advanced'>
              {renderGrid(this.advancedFields as Array<any>)}
            </NCollapseItem>
          </NCollapse>
        </>
      )
    }

    return (
      <NGrid xGap={10}>
        {allFields.map((f) => (this.renderFormField as Function)(f))}
      </NGrid>
    )
  }
})

export { DynamicFormItem }
