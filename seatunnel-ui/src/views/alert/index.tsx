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

import { defineComponent, ref } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import Rules from './rules'
import Events from './events'

const AlertPage = defineComponent({
  setup() {
    const { t } = useI18n()
    const activeTab = ref('rules')
    return { t, activeTab }
  },
  render() {
    return (
      <div class='p-4'>
        <NTabs v-model:value={this.activeTab}>
          <NTabPane name='rules' tab={this.t('alert.rule_tab')}>
            <Rules />
          </NTabPane>
          <NTabPane name='events' tab={this.t('alert.event_tab')}>
            <Events />
          </NTabPane>
          <NTabPane name='history' tab={this.t('alert.history_tab')}>
            <Events history />
          </NTabPane>
        </NTabs>
      </div>
    )
  }
})

export default AlertPage
