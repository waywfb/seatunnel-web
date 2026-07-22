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

import {
  defineComponent,
  toRefs,
  withKeys,
  getCurrentInstance,
  h,
  ref
} from 'vue'
import {
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
import {
  Network,
  GitBranch,
  ShieldCheck,
  Activity,
  Waves,
  Eye,
  EyeOff,
  User,
  Lock,
  Building2,
  ChevronDown,
  ExternalLink
} from 'lucide-vue-next'
import backgroundImage from '@/assets/background.png'

const Login = defineComponent({
  setup() {
    window.$message = useMessage()
    const { t } = useI18n()
    const { state, handleLogin } = useForm()
    const trim = getCurrentInstance()?.appContext.config.globalProperties.trim
    const showPassword = ref(false)

    return {
      t,
      ...toRefs(state),
      trim,
      handleLogin,
      showPassword
    }
  },
  render() {
    return (
      <div class='flex min-h-screen'>
        {/* Left Side: Brand & Visuals */}
        <section class='hidden lg:flex lg:w-7/12 relative overflow-hidden login-brand-section'>
          {/* Background Image */}
          <div class='absolute inset-0 z-0'>
            <div
              class='w-full h-full bg-cover bg-center'
              style={{
                backgroundImage: `url("${backgroundImage}")`
              }}
            />
            <div class='absolute inset-0 login-brand-overlay' />
          </div>

          {/* Content Overlay */}
          <div class='relative z-10 flex flex-col justify-between p-16 w-full'>
            {/* Brand Anchor */}
            <div class='flex items-center gap-3'>
              <div class='w-10 h-10 bg-primary flex items-center justify-center rounded-lg shadow-lg'>
                <Waves class='text-white' size={24} />
              </div>
              <div class='flex flex-col'>
                <span class='font-tide-headline-lg text-tide-headline-lg text-white font-bold tracking-tight'>
                  Data Fusion Studio
                </span>
                <span class='text-tide-primary-fixed-dim text-xs font-medium tracking-widest uppercase'>
                  {this.t('login.brand_subtitle')}
                </span>
              </div>
            </div>

            {/* Center Messaging */}
            <div class='max-w-2xl'>
              <h1 class='font-tide-headline-lg text-tide-headline-lg text-white mb-6 leading-tight text-4xl'>
                {this.t('login.hero_title')}
              </h1>
              <p class='font-tide-body-md text-lg text-slate-300 leading-relaxed opacity-90 mb-10'>
                {this.t('login.hero_description')}
              </p>

              {/* Feature Cards */}
              <div class='grid grid-cols-4 gap-4 mb-10 relative'>
                <div class='absolute inset-0 top-1/2 h-0.5 login-data-flow opacity-40' />
                <div class='bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 z-10'>
                  <Network class='text-tide-primary-fixed-dim' size={32} />
                  <span class='text-white text-[11px] font-medium tracking-wider uppercase'>
                    {this.t('login.feature_multi_source')}
                  </span>
                  <span class='text-slate-400 text-[10px]'>
                    {this.t('login.feature_multi_source_desc')}
                  </span>
                </div>
                <div class='bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 z-10'>
                  <GitBranch class='text-tide-primary-fixed-dim' size={32} />
                  <span class='text-white text-[11px] font-medium tracking-wider uppercase'>
                    {this.t('login.feature_visual')}
                  </span>
                  <span class='text-slate-400 text-[10px]'>
                    {this.t('login.feature_visual_desc')}
                  </span>
                </div>
                <div class='bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 z-10'>
                  <ShieldCheck class='text-tide-primary-fixed-dim' size={32} />
                  <span class='text-white text-[11px] font-medium tracking-wider uppercase'>
                    {this.t('login.feature_reliable')}
                  </span>
                  <span class='text-slate-400 text-[10px]'>
                    {this.t('login.feature_reliable_desc')}
                  </span>
                </div>
                <div class='bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 z-10'>
                  <Activity class='text-tide-primary-fixed-dim' size={32} />
                  <span class='text-white text-[11px] font-medium tracking-wider uppercase'>
                    {this.t('login.feature_monitoring')}
                  </span>
                  <span class='text-slate-400 text-[10px]'>
                    {this.t('login.feature_monitoring_desc')}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div class='flex gap-12 items-center'>
                <div class='flex flex-col'>
                  <span class='text-white font-bold font-tide-headline-md text-tide-headline-md'>
                    10GB+
                  </span>
                  <span class='text-slate-400 font-tide-label-md text-tide-label-md'>
                    {this.t('login.stat_throughput')}
                  </span>
                </div>
                <div class='flex flex-col'>
                  <span class='text-white font-bold font-tide-headline-md text-tide-headline-md'>
                    50+
                  </span>
                  <span class='text-slate-400 font-tide-label-md text-tide-label-md'>
                    {this.t('login.stat_connectors')}
                  </span>
                </div>
                <div class='flex flex-col'>
                  <span class='text-white font-bold font-tide-headline-md text-tide-headline-md'>
                    99.99%
                  </span>
                  <span class='text-slate-400 font-tide-label-md text-tide-label-md'>
                    {this.t('login.stat_uptime')}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer (Left) */}
            <div class='flex items-center gap-4'>
              <div class='flex -space-x-2'>
                <div class='w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white'>
                  王
                </div>
                <div class='w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white'>
                  李
                </div>
                <div class='w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white'>
                  张
                </div>
              </div>
              <p class='text-slate-400 font-tide-label-md text-tide-label-md'>
                {this.t('login.footer_tagline')}
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Login Panel */}
        <section class='flex-1 flex flex-col bg-slate-50 relative'>
          {/* Mobile Header */}
          <div class='lg:hidden p-6 flex items-center gap-3'>
            <div class='w-8 h-8 bg-primary flex items-center justify-center rounded'>
              <Waves class='text-white' size={20} />
            </div>
            <span class='font-tide-headline-md text-tide-headline-md text-primary font-bold'>
              SeaTunnel
            </span>
          </div>

          <div class='flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto'>
            <div class='w-full max-w-[440px] bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 md:p-10 border border-slate-100'>
              {/* Login Header */}
              <div class='mb-8'>
                <h2 class='font-tide-headline-lg text-2xl text-tide-on-surface mb-2'>
                  {this.t('login.welcome_back')}
                </h2>
                <p class='font-tide-body-md text-tide-on-secondary-container'>
                  {this.t('login.login_subtitle')}
                </p>
              </div>

              {/* Login Form */}
              <NForm rules={this.rules} ref='loginFormRef' class='space-y-6'>
                {/* Username Field */}
                <div class='space-y-2'>
                  <label
                    class='block font-tide-label-md text-tide-label-md text-tide-on-surface-variant'
                    for='username'
                  >
                    {this.t('login.username')}
                  </label>
                  <div class='relative'>
                    <span class='absolute left-3 top-1/2 -translate-y-1/2 text-tide-outline group-focus-within:text-primary transition-colors text-[20px]'>
                      <User size={20} />
                    </span>
                    {/* Visual Shell (Tailwind) + NInput core */}
                    <div class='w-full pl-10 pr-4 py-2.5 bg-white border border-tide-outline-variant rounded-lg transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'>
                      <NInput
                        ref='usernameInput'
                        clearable
                        allowInput={this.trim}
                        type='text'
                        v-model={[this.loginForm.username, 'value']}
                        placeholder={this.t('login.username_tips')}
                        autofocus
                        onKeydown={withKeys(this.handleLogin, ['enter'])}
                        bordered={false}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: 'var(--color-foreground)',
                          fontFamily: 'var(--font-sans)',
                          padding: '0'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div class='space-y-2'>
                  <label
                    class='block font-tide-label-md text-tide-label-md text-tide-on-surface-variant'
                    for='password'
                  >
                    {this.t('login.password')}
                  </label>
                  <div class='relative'>
                    <span class='absolute left-3 top-1/2 -translate-y-1/2 text-tide-outline group-focus-within:text-primary transition-colors text-[20px]'>
                      <Lock size={20} />
                    </span>
                    {/* Visual Shell (Tailwind) + NInput core */}
                    <div class='w-full pl-10 pr-12 py-2.5 bg-white border border-tide-outline-variant rounded-lg transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'>
                      <NInput
                        ref='passwordInput'
                        clearable
                        allowInput={this.trim}
                        type={this.showPassword ? 'text' : 'password'}
                        v-model={[this.loginForm.password, 'value']}
                        placeholder={this.t('login.password_tips')}
                        onKeydown={withKeys(this.handleLogin, ['enter'])}
                        bordered={false}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: 'var(--color-foreground)',
                          fontFamily: 'var(--font-sans)',
                          padding: '0'
                        }}
                      />
                      <button
                        type='button'
                        class='absolute right-3 top-1/2 -translate-y-1/2 text-tide-outline-variant hover:text-tide-outline transition-colors'
                        onClick={() => {
                          this.showPassword = !this.showPassword
                        }}
                      >
                        {this.showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workspace Select */}
                <div class='space-y-2'>
                  <label
                    class='block font-tide-label-md text-tide-label-md text-tide-on-surface-variant'
                    for='workspace'
                  >
                    {this.t('login.select_workspace')}
                  </label>
                  <div class='relative'>
                    <span class='absolute left-3 top-1/2 -translate-y-1/2 text-tide-outline group-focus-within:text-primary transition-colors text-[20px]'>
                      <Folder size={20} />
                    </span>
                    {/* Visual Shell (Tailwind) + NSelect core */}
                    <div class='w-full pl-10 pr-4 py-2.5 bg-white border border-tide-outline-variant rounded-lg transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'>
                      <NSelect
                        ref='workspaceSelect'
                        options={this.workspaces.map((workspace: string) => ({
                          label: workspace,
                          value: workspace
                        }))}
                        v-model={[this.loginForm.selectedWorkspace, 'value']}
                        placeholder={this.t('login.select_workspace_tips')}
                        bordered={false}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: 'var(--color-foreground)',
                          fontFamily: 'var(--font-sans)',
                          padding: '0'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Remember + LDAP */}
                <div class='flex items-center justify-between'>
                  <div class='flex items-center'>
                    <NCheckbox
                      ref='rememberCheckbox'
                      v-model={this.loginForm.remember}
                      onUpdateChecked={(value: boolean) =>
                        (this.loginForm.remember = value)
                      }
                    >
                      <span class='text-sm text-tide-on-secondary-container'>
                        {this.t('login.remember_device')}
                      </span>
                    </NCheckbox>
                  </div>
                  <div class='flex items-center'>
                    <NCheckbox
                      v-model={this.loginForm.useLdap}
                      onUpdateChecked={(value: boolean) =>
                        (this.loginForm.useLdap = value)
                      }
                    >
                      <span class='text-sm text-tide-on-secondary-container'>
                        {this.t('login.use_ldap')}
                      </span>
                    </NCheckbox>
                  </div>
                </div>

                {/* Login Button */}
                <NButton
                  type='primary'
                  disabled={
                    !this.loginForm.username ||
                    !this.loginForm.password ||
                    !this.loginForm.selectedWorkspace
                  }
                  class='w-full'
                  size='large'
                  onClick={this.handleLogin}
                >
                  <span class='flex items-center justify-center gap-2'>
                    {this.t('login.login')}
                    <ArrowRight size={18} />
                  </span>
                </NButton>

                {/* Divider */}
                <div class='mt-8 mb-6 flex items-center'>
                  <div class='flex-1 h-px bg-tide-outline-variant' />
                  <span class='px-4 font-tide-label-caps text-[10px] text-tide-outline uppercase tracking-widest'>
                    {this.t('login.sso_divider')}
                  </span>
                  <div class='flex-1 h-px bg-tide-outline-variant' />
                </div>

                {/* Alternate Logins */}
                <div class='grid grid-cols-2 gap-3'>
                  <button class='flex items-center justify-center gap-2 py-2.5 border border-tide-outline-variant rounded-lg hover:bg-tide-surface-container-low transition-colors font-tide-label-md text-tide-label-md text-tide-on-surface'>
                    <Building2 size={18} />
                    {this.t('login.enterprise_account')}
                  </button>
                  <button class='flex items-center justify-center gap-2 py-2.5 border border-tide-outline-variant rounded-lg hover:bg-tide-surface-container-low transition-colors font-tide-label-md text-tide-label-md text-tide-on-surface'>
                    <KeyRound size={18} />
                    {this.t('login.saml_login')}
                  </button>
                </div>
              </NForm>
            </div>
          </div>

          {/* Footer */}
          <footer class='p-8 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm'>
            <div class='flex flex-col md:flex-row justify-between items-center gap-4 max-w-4xl mx-auto w-full'>
              <p class='font-tide-label-md text-tide-label-md text-tide-outline'>
                © 2024 {this.t('login.footer_brand')}
              </p>
              <div class='flex gap-6'>
                <a
                  class='font-tide-label-md text-tide-label-md text-tide-on-secondary-container hover:text-primary transition-colors'
                  href='#'
                >
                  {this.t('login.footer_privacy')}
                </a>
                <a
                  class='font-tide-label-md text-tide-label-md text-tide-on-secondary-container hover:text-primary transition-colors'
                  href='#'
                >
                  {this.t('login.footer_status')}
                </a>
                <a
                  class='font-tide-label-md text-tide-label-md text-tide-on-secondary-container hover:text-primary transition-colors flex items-center gap-1'
                  href='#'
                >
                  {this.t('login.footer_support')}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </footer>
        </section>
      </div>
    )
  }
})

export default Login
