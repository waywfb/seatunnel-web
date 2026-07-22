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

import { defineComponent, ref, watch } from 'vue'
import { NModal, NCard, NSpace, NInput, NButton, NAlert } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { parseCurl, curlParseResultToFormValues } from './curl-parser'
import type { CurlParseResult } from './curl-parser'

const CurlImportModal = defineComponent({
  name: 'CurlImportModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'import'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const curlInput = ref('')
    const parseError = ref('')

    const handleClose = () => {
      curlInput.value = ''
      parseError.value = ''
      emit('close')
    }

    const handleParse = () => {
      parseError.value = ''
      const trimmed = curlInput.value.trim()
      if (!trimmed) {
        parseError.value = t('datasource.curl_input_empty')
        return
      }

      try {
        const result: CurlParseResult = parseCurl(trimmed)
        if (!result.url) {
          parseError.value = t('datasource.curl_parse_failed')
          return
        }
        const formValues = curlParseResultToFormValues(result)
        emit('import', formValues)
        handleClose()
      } catch (e) {
        parseError.value = t('datasource.curl_parse_failed')
      }
    }

    watch(
      () => props.show,
      (val) => {
        if (val) {
          curlInput.value = ''
          parseError.value = ''
        }
      }
    )

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(val: boolean) => {
          if (!val) handleClose()
        }}
      >
        <NCard
          title={t('datasource.import_curl')}
          style={{ width: '640px' }}
          bordered={false}
          role='dialog'
        >
          {{
            default: () => (
              <NSpace vertical>
                <NInput
                  type='textarea'
                  rows={10}
                  placeholder={t('datasource.curl_placeholder')}
                  v-model={[curlInput.value, 'value']}
                />
                {parseError.value && (
                  <NAlert type='error'>{parseError.value}</NAlert>
                )}
              </NSpace>
            ),
            footer: () => (
              <NSpace justify='end'>
                <NButton onClick={handleClose}>
                  {t('datasource.cancel')}
                </NButton>
                <NButton type='primary' onClick={handleParse}>
                  {t('datasource.curl_parse')}
                </NButton>
              </NSpace>
            )
          }}
        </NCard>
      </NModal>
    )
  }
})

export { CurlImportModal }
