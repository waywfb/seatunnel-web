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
import { defineComponent, PropType, ref, watch, nextTick } from 'vue'
import { NModal, NForm, NInput } from 'naive-ui'
import { X, Plus, PenLine, Search, Terminal } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { DynamicFormItem } from '@/components/dynamic-form/dynamic-form-item'
import { useSource } from '../components/use-source'
import { useForm } from '../create/use-form'
import {
  checkConnect,
  datasourceDetail,
  datasourceAdd,
  datasourceUpdate
} from '@/service/data-source'

interface ProtocolMeta {
  pluginName: string
  label: string
  iconSvg: string
  categoryLabel: string
}

interface LogLine {
  time: string
  level: 'info' | 'success' | 'error' | 'warn'
  msg: string
}

const props = {
  show: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  editId: {
    type: [Number, String] as PropType<number | string | null>,
    default: null
  },
  initialType: {
    type: String as PropType<string>,
    default: ''
  },
  autoTest: {
    type: Boolean as PropType<boolean>,
    default: false
  }
}

const DatasourceWizardModal = defineComponent({
  name: 'DatasourceWizardModal',
  props,
  emits: ['update:show', 'saved'],
  setup(props, ctx) {
    const { t } = useI18n()
    const { state: sourceState } = useSource(false)

    const activeStep = ref(1)
    const protocolSearch = ref('')
    const selectedPlugin = ref('')
    const selectedMeta = ref<ProtocolMeta | null>(null)
    const formRef = ref<InstanceType<typeof NForm> | null>(null)
    const submitting = ref(false)
    const testing = ref(false)
    const testStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
    const testLatency = ref(0)
    const testTarget = ref('')
    const testLogs = ref<LogLine[]>([])

    const flattened = (): ProtocolMeta[] => {
      const list: ProtocolMeta[] = []
      for (const group of sourceState.types) {
        for (const child of group.children) {
          list.push({
            pluginName: child.value as string,
            label: child.label as string,
            iconSvg: child.iconSvg,
            categoryLabel: group.label
          })
        }
      }
      return list
    }

    const filteredProtocols = (): ProtocolMeta[] => {
      const q = protocolSearch.value.trim().toLowerCase()
      if (!q) return flattened()
      return flattened().filter((p) => p.label.toLowerCase().includes(q))
    }

    const closeModal = () => {
      ctx.emit('update:show', false)
    }

    const resetWizard = () => {
      activeStep.value = 1
      protocolSearch.value = ''
      selectedPlugin.value = ''
      selectedMeta.value = null
      testStatus.value = 'idle'
      testLatency.value = 0
      testTarget.value = ''
      testLogs.value = []
      submitting.value = false
      testing.value = false
    }

    const isEdit = () => props.editId !== null && props.editId !== undefined

    const buildTargetAddress = (): string => {
      const v = formState.detailForm as Record<string, unknown>
      if (typeof v.url === 'string' && v.url) return v.url
      const host =
        typeof v.host === 'string' && v.host
          ? v.host
          : typeof v.hostname === 'string'
            ? v.hostname
            : ''
      const port = typeof v.port === 'number' || typeof v.port === 'string' ? String(v.port) : ''
      const db =
        typeof v.database === 'string' && v.database
          ? v.database
          : typeof v.schema === 'string'
            ? v.schema
            : ''
      return [host, port ? `:${port}` : '', db ? `/${db}` : ''].join('') || '未知地址'
    }

    const startTest = async () => {
      if (testing.value) return
      testing.value = true
      testStatus.value = 'testing'
      const target = buildTargetAddress()
      testTarget.value = target
      testLogs.value = [
        {
          time: nowString(),
          level: 'info',
          msg: `正在连接 ${target} ...`
        }
      ]
      const started = Date.now()
      try {
        const payload = {
          pluginName: selectedPlugin.value,
          datasourceConfig: omitConfig()
        }
        const result: any = await checkConnect(payload)
        const ok = !!result
        testLatency.value = Date.now() - started
        testLogs.value.push({
          time: nowString(),
          level: ok ? 'success' : 'error',
          msg: ok
            ? `连通性检查无误 (网络延时 ${testLatency.value}ms)`
            : '连通失败或凭据无效'
        })
        testStatus.value = ok ? 'success' : 'error'
      } catch (err) {
        testLatency.value = Date.now() - started
        testStatus.value = 'error'
        testLogs.value.push({
          time: nowString(),
          level: 'error',
          msg: '连通测试发生异常，请核对配置后重试'
        })
      } finally {
        testing.value = false
      }
    }

    const goNext = async () => {
      if (activeStep.value === 1) {
        if (!selectedPlugin.value) return
        activeStep.value = 2
        return
      }
      if (activeStep.value === 2) {
        try {
          await formRef.value?.validate()
        } catch (err) {
          return
        }
        activeStep.value = 3
        startTest()
      }
    }

    const goBack = () => {
      if (activeStep.value > 1) activeStep.value--
    }

    const gotoStep = (n: number) => {
      if (n > 1 && !selectedPlugin.value) return
      activeStep.value = n
    }

    const selectProtocol = (p: ProtocolMeta) => {
      selectedPlugin.value = p.pluginName
      selectedMeta.value = p
      setType(p.pluginName)
      activeStep.value = 2
    }

    const changeType = () => {
      activeStep.value = 1
      protocolSearch.value = ''
    }

    const doSave = async () => {
      if (submitting.value) return
      try {
        await formRef.value?.validate()
      } catch (err) {
        return
      }
      submitting.value = true
      try {
        const values = {
          datasourceName: formState.detailForm.datasourceName,
          pluginName: formState.detailForm.pluginName,
          description: formState.detailForm.description,
          datasourceConfig: JSON.stringify(omitConfig())
        }
        if (isEdit() && props.editId != null) {
          await datasourceUpdate(values, String(props.editId))
        } else {
          await datasourceAdd(values)
        }
        ctx.emit('saved')
        ctx.emit('update:show', false)
        resetWizard()
      } finally {
        submitting.value = false
      }
    }

    const { state: formState, setType, setFieldsValue } = useForm('')

    function omitConfig(): Record<string, unknown> {
      const base = ['pluginName', 'datasourceName', 'description']
      const values: Record<string, unknown> = {}
      for (const key of Object.keys(formState.detailForm)) {
        if (!base.includes(key)) {
          values[key] = formState.detailForm[key]
        }
      }
      return values
    }

    const nowString = () => {
      const d = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    }

    const loadEdit = async () => {
      try {
        if (props.autoTest) activeStep.value = 3
        const result: any = await datasourceDetail(String(props.editId))
        const plugin = result.pluginName
        await setType(plugin)
        selectedPlugin.value = plugin
        const meta = flattened().find((p) => p.pluginName === plugin)
        selectedMeta.value = meta || null

        const group = sourceState.types.find((g) =>
          g.children.some((c) => c.value === plugin)
        )
        if (!selectedMeta.value && group) {
          const child = group.children.find((c) => c.value === plugin)
          selectedMeta.value = child
            ? {
                pluginName: plugin,
                label: child.label as string,
                iconSvg: child.iconSvg,
                categoryLabel: group.label
              }
            : null
        }

        const config = result.datasourceConfig || {}
        setFieldsValue({
          datasourceName: result.datasourceName,
          pluginName: plugin,
          description: result.description,
          ...config
        })
        if (props.autoTest) {
          nextTick(() => startTest())
        } else {
          activeStep.value = 2
        }
      } catch (err) {
        ctx.emit('update:show', false)
      }
    }

    watch(
      () => props.show,
      (v) => {
        if (v) {
          resetWizard()
          if (isEdit()) {
            loadEdit()
          } else if (props.initialType) {
            setType(props.initialType)
            selectedPlugin.value = props.initialType
            const meta = flattened().find(
              (p) => p.pluginName === props.initialType
            )
            selectedMeta.value = meta || null
            activeStep.value = 2
          }
        }
      }
    )

    const logColor = (level: string) => {
      const map: Record<string, string> = {
        success: 'text-emerald-400',
        error: 'text-rose-400',
        warn: 'text-amber-300',
        info: 'text-slate-300'
      }
      return map[level] || 'text-slate-300'
    }

    return () => (
      <NModal
        show={props.show}
        onUpdate:show={(v: boolean) => (v ? undefined : closeModal())}
        onMaskClick={closeModal}
      >
        <div class='bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col'>
          {/* Header */}
          <div class='px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50'>
            <div class='flex items-center gap-3'>
              <div class='w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
                {isEdit() ? <PenLine size={16} /> : <Plus size={16} />}
              </div>
              <div>
                <h3 class='font-bold text-slate-800 text-base'>
                  {isEdit() ? '编辑数据源连接' : '新建数据源连接'}
                </h3>
                <p class='text-xs text-slate-400 mt-0.5'>
                  步骤 {activeStep.value} / 3 -{' '}
                  {activeStep.value === 1
                    ? '选择类型'
                    : activeStep.value === 2
                    ? '配置连接参数'
                    : '连通性诊断'}
                </p>
              </div>
            </div>
            <button
              class='w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center'
              onClick={closeModal}
            >
              <X size={16} />
            </button>
          </div>

          {/* Step indicators */}
          <div class='px-8 py-3 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-xs'>
            {[
              { n: 1, label: '选择协议类型' },
              { n: 2, label: '配置连接参数' },
              { n: 3, label: '连通测试与保存' }
            ].map((step, idx) => (
              <div key={step.n} class='flex items-center gap-2'>
                {idx > 0 && <div class='w-8 h-px bg-slate-200' />}
                <div
                  class={`flex items-center gap-2 cursor-pointer select-none ${
                    activeStep.value >= step.n
                      ? 'text-indigo-600 font-bold'
                      : 'text-slate-400'
                  }`}
                  onClick={() => gotoStep(step.n)}
                >
                  <span
                    class={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      activeStep.value >= step.n
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200'
                    }`}
                  >
                    {step.n}
                  </span>
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: select protocol */}
          {activeStep.value === 1 && (
            <div class='p-6 space-y-4 flex-1 overflow-y-auto'>
              <div class='relative'>
                <Search
                  size={14}
                  class='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
                />
                <input
                  value={protocolSearch.value}
                  onInput={(e: InputEvent) => {
                    protocolSearch.value = (e.target as HTMLInputElement).value
                  }}
                  type='text'
                  placeholder='快速过滤数据源类型 (如 MySQL, OPCUA, Kafka...)'
                  class='w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500'
                />
              </div>
              <div class='grid grid-cols-3 gap-3'>
                {filteredProtocols().map((p) => (
                  <div
                    key={p.pluginName}
                    onClick={() => selectProtocol(p)}
                    class={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      selectedPlugin.value === p.pluginName
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div class='w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 overflow-hidden'>
                      <img
                        src={p.iconSvg}
                        width='28'
                        height='28'
                        class='block'
                      />
                    </div>
                    <div class='min-w-0 flex-1'>
                      <h4 class='font-bold text-xs text-slate-800 truncate'>
                        {p.label}
                      </h4>
                      <p class='text-[10px] text-slate-400 truncate'>
                        {p.categoryLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: config params */}
          {activeStep.value === 2 && (
            <div class='p-6 space-y-4 flex-1 overflow-y-auto'>
              <div class='p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between'>
                <div class='flex items-center gap-3'>
                  <div class='w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 overflow-hidden'>
                    {selectedMeta.value && (
                      <img
                        src={selectedMeta.value.iconSvg}
                        width='24'
                        height='24'
                        class='block'
                      />
                    )}
                  </div>
                  <div>
                    <span class='text-xs font-bold text-slate-800'>
                      {selectedMeta.value?.label || selectedPlugin.value}
                    </span>
                    {selectedMeta.value && (
                      <span class='text-[10px] text-slate-400 ml-2'>
                        ({selectedMeta.value.categoryLabel})
                      </span>
                    )}
                  </div>
                </div>
                {!isEdit() && (
                  <button
                    class='text-xs text-indigo-600 hover:underline font-medium'
                    onClick={changeType}
                  >
                    更换类型
                  </button>
                )}
              </div>

              <div class='grid grid-cols-2 gap-4'>
                <div>
                  <label class='block text-xs font-semibold text-slate-700 mb-1'>
                    数据源名称 <span class='text-rose-500'>*</span>
                  </label>
                  <NInput
                    value={formState.detailForm.datasourceName}
                    onUpdate:value={(v: string) =>
                      (formState.detailForm.datasourceName = v)
                    }
                    placeholder='例如：生产核心库_01'
                    maxlength={60}
                  />
                </div>
                <div>
                  <label class='block text-xs font-semibold text-slate-700 mb-1'>
                    描述说明
                  </label>
                  <NInput
                    value={formState.detailForm.description}
                    onUpdate:value={(v: string) =>
                      (formState.detailForm.description = v)
                    }
                    placeholder='请输入业务用途描述...'
                  />
                </div>
              </div>

              <div class='pt-2 border-t border-slate-100 space-y-3'>
                <h4 class='text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                  <Terminal size={14} class='text-indigo-600' /> 专属连接配置
                </h4>
                <NForm ref={formRef} rules={formState.rules}>
                  <DynamicFormItem
                    model={formState.detailForm}
                    formStructure={formState.formStructure}
                    name={formState.formName}
                    locales={formState.locales}
                  />
                </NForm>
              </div>
            </div>
          )}

          {/* Step 3: diagnostics */}
          {activeStep.value === 3 && (
            <div class='p-6 space-y-4 flex-1 overflow-y-auto'>
              <div class='flex items-center justify-between'>
                <h4 class='text-xs font-bold text-slate-800 flex items-center gap-2'>
                  <Terminal size={14} class='text-indigo-600' /> 实时探针诊断日志
                </h4>
                <button
                  class='text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1'
                  onClick={startTest}
                >
                  重新测试
                </button>
              </div>

              <div class='bg-slate-900 p-4 rounded-xl text-xs space-y-2 h-48 overflow-y-auto border border-slate-800 shadow-inner font-mono'>
                {testLogs.value.map((log, idx) => (
                  <div key={idx} class='flex gap-2'>
                    <span class='text-slate-500 shrink-0'>[{log.time}]</span>
                    <span class={logColor(log.level)}>{log.msg}</span>
                  </div>
                ))}
                {testStatus.value === 'testing' && (
                  <div class='flex items-center gap-2 text-indigo-400 font-mono animate-pulse'>
                    正在建立握手通道 {testTarget.value && `(${testTarget.value})`} ...
                  </div>
                )}
              </div>

              {testStatus.value === 'success' && (
                <div class='p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-3'>
                  <div>
                    <p class='font-bold'>
                      连通性检查无误 (网络延时 {testLatency.value}ms)
                    </p>
                    <p class='text-[11px] text-emerald-600'>
                      数据源服务状态良好，可以正常提交保存。
                    </p>
                  </div>
                </div>
              )}
              {testStatus.value === 'error' && (
                <div class='p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-3'>
                  <div>
                    <p class='font-bold'>连通失败或凭据无效</p>
                    <p class='text-[11px] text-rose-600'>
                      建议核对防火墙端口与密码凭据后重试。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div class='px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between'>
            {activeStep.value > 1 ? (
              <button
                class='px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all'
                onClick={goBack}
              >
                上一步
              </button>
            ) : (
              <div />
            )}
            <div class='flex items-center gap-2'>
              <button
                class='px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all'
                onClick={closeModal}
              >
                取消
              </button>
              {activeStep.value < 3 ? (
                <button
                  class='px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5'
                  onClick={goNext}
                >
                  {activeStep.value === 1 ? '下一步：配置参数' : '下一步：测试连接'}
                </button>
              ) : (
                <button
                  class='px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2'
                  disabled={submitting.value}
                  onClick={doSave}
                >
                  {submitting.value && (
                    <span class='inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                  )}
                  {isEdit() ? '保存修改' : '确认创建数据源'}
                </button>
              )}
            </div>
          </div>
        </div>
      </NModal>
    )
  }
})

export default DatasourceWizardModal
