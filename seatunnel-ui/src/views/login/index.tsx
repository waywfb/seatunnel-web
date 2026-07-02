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

import { defineComponent, toRefs, withKeys, getCurrentInstance } from 'vue'
import {
  NSpace,
  NLayout,
  NLayoutContent,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCheckbox,
  NSelect,
  useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useForm } from './use-form'

const Login = defineComponent({
  setup() {
    window.$message = useMessage()
    const { t } = useI18n()
    const { state, handleLogin } = useForm()
    const trim = getCurrentInstance()?.appContext.config.globalProperties.trim

    return {
      t,
      ...toRefs(state),
      trim,
      handleLogin
    }
  },
  render() {
    return (
      <NLayout>
        <NLayoutContent>
          <NSpace
            justify='center'
            align='center'
            class='w-full h-screen login-bg'
          >
            <div class='w-96' style={{
              background: 'var(--color-card)',
              padding: 'var(--space-12) var(--space-12)',
              borderRadius: 'var(--card-radius)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: 'var(--space-8)'
              }}>
                <svg width='48' height='48' viewBox='0 0 32 32' fill='none'>
                  <rect width='32' height='32' rx='8' fill='var(--color-primary)'/>
                  <text x='16' y='21' text-anchor='middle' fill='white' font-size='15' font-weight='700' font-family='Inter, sans-serif'>ST</text>
                </svg>
                <h2 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-foreground)',
                  marginTop: 'var(--space-4)'
                }}>
                  {this.t('login.login_to_sea_tunnel')}
                </h2>
              </div>
              <NForm rules={this.rules} ref='loginFormRef' class='mb-4'>
                <NFormItem
                  label={this.t('login.username')}
                  label-style={{ color: 'var(--color-foreground)' }}
                  path='userName'
                >
                  <NInput
                    clearable
                    allowInput={this.trim}
                    type='text'
                    v-model={[this.loginForm.username, 'value']}
                    placeholder={this.t('login.username_tips')}
                    autofocus
                    onKeydown={withKeys(this.handleLogin, ['enter'])}
                  />
                </NFormItem>
                <NFormItem
                  label={this.t('login.password')}
                  label-style={{ color: 'var(--color-foreground)' }}
                  path='userPassword'
                >
                  <NInput
                    clearable
                    allowInput={this.trim}
                    type='password'
                    v-model={[this.loginForm.password, 'value']}
                    placeholder={this.t('login.password_tips')}
                    onKeydown={withKeys(this.handleLogin, ['enter'])}
                  />
                </NFormItem>
                <NFormItem
                    label={this.t('login.select_workspace')}
                    label-style={{ color: 'var(--color-foreground)' }}
                    path='selectedWorkspace'
                >
                  <NSelect
                      options={this.workspaces.map(workspace => ({ label: workspace, value: workspace }))}
                      v-model={[this.loginForm.selectedWorkspace, 'value']}
                      placeholder={this.t('login.select_workspace_tips')}
                  />
                </NFormItem>
                <NFormItem>
                  <NCheckbox v-model={this.loginForm.useLdap} onUpdateChecked={(value) => this.loginForm.useLdap = value} >
                    {this.t('login.use_ldap')}
                  </NCheckbox>
                </NFormItem>
              </NForm>
              <NButton
                type='info'
                disabled={!this.loginForm.username || !this.loginForm.password || !this.loginForm.selectedWorkspace}
                style={{ width: '100%' }}
                onClick={this.handleLogin}
              >
                {this.t('login.login')}
              </NButton>
            </div>
          </NSpace>
        </NLayoutContent>
      </NLayout>
    )
  }
})

export default Login