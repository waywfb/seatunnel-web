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

import { defineComponent } from 'vue'
import { NSpace } from 'naive-ui'

const Logo = defineComponent({
  setup() { },
  render() {
    return (
      <NSpace justify='start' align='center' class='h-16 ml-12'>
        <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
          <rect width='32' height='32' rx='8' fill='var(--color-primary)' />
          <text x='16' y='21' text-anchor='middle' fill='white' font-size='15' font-weight='700' font-family='Inter, sans-serif'>ST</text>
        </svg>
        <span class='text-xl font-bold'>数据接入平台</span>
      </NSpace>
    )
  }
})

export default Logo
