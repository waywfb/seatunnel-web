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
import { onMounted, reactive, watch } from 'vue'
import { getDatasourceType } from '@/service/data-source'
import { useI18n } from 'vue-i18n'
import type { SelectOption } from 'naive-ui'
import type { ResponseBasic } from '@/service/types'
import type { DatasourceTypeList } from '@/service/data-source/types'
import {
  getDatasourceIcon,
  getDatasourceIconColor,
  datasourceIconSvg
} from '../datasource-icons'

type Key = '1' | '2' | '3' | '4' | '5'
type IType = {
  type: string
  label: string
  key: string
  children: (SelectOption & {
    icon: string
    iconColor: string
    iconSvg: string
  })[]
}

export const useSource = (showVirtualDataSource = false) => {
  const i18n = useI18n()
  const TYPE_MAP = {
    1: 'database',
    2: 'file',
    3: 'no_structured',
    4: 'storage',
    5: 'remote_connection',
    6: 'fake_connection'
  }
  const state = reactive({
    types: [] as IType[]
  })

  const querySource = () => {
    getDatasourceType({
      showVirtualDataSource,
      source: 'WT'
    }).then((res: ResponseBasic<Array<DatasourceTypeList> | Array<any>>) => {
      const locales = {
        zh_CN: {} as { [key: string]: string },
        en_US: {} as { [key: string]: string }
      }

      state.types = Object.entries(res).map(([key, value]) => {
        const filtered = (value as any[]).filter(
          (item: any) => !['MySQL-CDC', 'SqlServer-CDC'].includes(item.name)
        )
        return {
          type: 'group',
          label: i18n.t(`datasource.${TYPE_MAP[key as Key]}`),
          key: TYPE_MAP[key as Key],
          children: filtered.map((item: any) => {
            const label = item.name === 'JDBC-Mysql' ? 'MySQL' : item.name
            locales.zh_CN[item.name] = item.chineseName || label
            locales.en_US[item.name] = item.name
            return {
              label: label,
              value: label,
              icon: getDatasourceIcon(item.name),
              iconColor: getDatasourceIconColor(item.name),
              iconSvg: datasourceIconSvg(item.name)
            }
          })
        }
      })

      i18n.mergeLocaleMessage('zh_CN', locales.zh_CN)
      i18n.mergeLocaleMessage('en_US', locales.en_US)
    })
  }

  onMounted(() => {
    querySource()
  })

  watch(useI18n().locale, () => {
    querySource()
  })

  return { state }
}
