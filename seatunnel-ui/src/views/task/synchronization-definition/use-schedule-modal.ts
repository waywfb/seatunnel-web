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

import { useI18n } from 'vue-i18n'
import { computed, reactive, ref, SetupContext, watch } from 'vue'
import { useMessage, type FormItemRule } from 'naive-ui'
import {
  queryJobSchedulePaging,
  createJobSchedule,
  updateJobSchedule,
  deleteJobSchedule,
  enableJobSchedule,
  disableJobSchedule,
  triggerJobSchedule,
  previewCronExecution
} from '@/service/sync-task-definition'

const DEFAULT_TIMEZONE = 'Asia/Shanghai'

export const TIMEZONE_OPTIONS = [
  { label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Asia/Hong_Kong (UTC+8)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'Asia/Singapore (UTC+8)', value: 'Asia/Singapore' },
  { label: 'Asia/Seoul (UTC+9)', value: 'Asia/Seoul' },
  { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
  { label: 'Europe/Paris (UTC+1)', value: 'Europe/Paris' },
  { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (UTC-8)', value: 'America/Los_Angeles' },
  { label: 'UTC (UTC+0)', value: 'UTC' },
  { label: 'Australia/Sydney (UTC+10)', value: 'Australia/Sydney' }
]

export const CONCURRENT_POLICY_OPTIONS = [
  { label: 'skip', value: 0 },
  { label: 'parallel', value: 1 }
]

export const MISFIRE_POLICY_OPTIONS = [
  { label: 'ignore', value: 0 },
  { label: 'fire one', value: 1 }
]

/** 可视化调度频率类型：仅允许以下 5 种，禁止手填 cron */
export type ScheduleFrequencyType = 'minute' | 'hour' | 'day' | 'week' | 'month'

export interface ScheduleFrequency {
  type: ScheduleFrequencyType
  minuteInterval: number
  hourInterval: number
  minuteOfHour: number
  hour: number
  minute: number
  /** 1=周一 ... 7=周日（UI 视角，与 Quartz 的 1=周日 相反） */
  weekday: number
  dayOfMonth: number
}

export const DEFAULT_FREQUENCY: ScheduleFrequency = {
  type: 'day',
  minuteInterval: 5,
  hourInterval: 1,
  minuteOfHour: 0,
  hour: 0,
  minute: 0,
  weekday: 1,
  dayOfMonth: 1
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(n) ? n : min))

/**
 * 由可视化频率生成 Quartz 7 段 cron 表达式（秒 分 时 日 月 周 [年]）
 * minute:  每 N 分钟执行一次
 * hour:    每 N 小时的第 M 分钟执行
 * day:     每天 HH:mm 执行
 * week:    每周周X 的 HH:mm 执行（Quartz 周日=1，故 UI 周一(1) -> Quartz 2）
 * month:   每月 D 日的 HH:mm 执行
 */
export function buildCronExpression(f: ScheduleFrequency): string {
  switch (f.type) {
    case 'minute':
      return `0 */${clamp(f.minuteInterval, 1, 59)} * * * ?`
    case 'hour':
      return `0 ${clamp(f.minuteOfHour, 0, 59)} */${clamp(f.hourInterval, 1, 23)} * * ?`
    case 'day':
      return `0 ${pad2(clamp(f.minute, 0, 59))} ${pad2(clamp(f.hour, 0, 23))} * * ?`
    case 'week': {
      // UI 1=周一..7=周日 -> Quartz 1=周日..7=周六
      const quartzWeekday = clamp(f.weekday, 1, 7) % 7 + 1
      return `0 ${pad2(clamp(f.minute, 0, 59))} ${pad2(clamp(f.hour, 0, 23))} ? * ${quartzWeekday}`
    }
    case 'month':
      return `0 ${pad2(clamp(f.minute, 0, 59))} ${pad2(clamp(f.hour, 0, 23))} ${clamp(f.dayOfMonth, 1, 31)} * ?`
  }
}

/**
 * 将已有 cron 表达式反解析为可视化频率配置。
 * 无法识别的表达式（超出 5 种频率形态）回退为「每天 00:00」，保证编辑不丢入口。
 */
export function parseCronExpression(cron: string): ScheduleFrequency {
  const fallback: ScheduleFrequency = { ...DEFAULT_FREQUENCY }
  if (!cron) return fallback
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 6) return fallback
  const [sec, min, hour, dom, mon, dow] = parts
  const isNum = (s: string) => /^\d+$/.test(s)

  // 0 */N * * * ?
  if (sec === '0' && min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '?') {
    const n = parseInt(min.slice(2), 10)
    if (n >= 1 && n <= 59) return { ...fallback, type: 'minute', minuteInterval: n }
  }
  // 0 M */N * * ?
  if (sec === '0' && isNum(min) && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '?') {
    const n = parseInt(hour.slice(2), 10)
    const m = parseInt(min, 10)
    if (n >= 1 && n <= 23 && m >= 0 && m <= 59)
      return { ...fallback, type: 'hour', hourInterval: n, minuteOfHour: m }
  }
  // 0 mm HH * * ?
  if (sec === '0' && isNum(min) && isNum(hour) && dom === '*' && mon === '*' && dow === '?') {
    return {
      ...fallback,
      type: 'day',
      hour: parseInt(hour, 10),
      minute: parseInt(min, 10)
    }
  }
  // 0 mm HH ? * 1-7  （Quartz 周）
  if (sec === '0' && isNum(min) && isNum(hour) && dom === '?' && mon === '*' && isNum(dow)) {
    const quartzWeekday = parseInt(dow, 10)
    if (quartzWeekday >= 1 && quartzWeekday <= 7) {
      // Quartz 1=周日 -> UI 1=周一：uiWeekday = quartzWeekday - 1 || 7
      const uiWeekday = quartzWeekday === 1 ? 7 : quartzWeekday - 1
      return {
        ...fallback,
        type: 'week',
        weekday: uiWeekday,
        hour: parseInt(hour, 10),
        minute: parseInt(min, 10)
      }
    }
  }
  // 0 mm HH D * ?
  if (sec === '0' && isNum(min) && isNum(hour) && isNum(dom) && mon === '*' && dow === '?') {
    const d = parseInt(dom, 10)
    if (d >= 1 && d <= 31) {
      return {
        ...fallback,
        type: 'month',
        dayOfMonth: d,
        hour: parseInt(hour, 10),
        minute: parseInt(min, 10)
      }
    }
  }
  return fallback
}

export function useScheduleModal(
  props: any,
  ctx: SetupContext<('cancelModal' | 'confirmModal')[]>
) {
  const { t } = useI18n()
  const message = useMessage()

  const variables = reactive({
    scheduleFormRef: ref(),
    saving: false,
    editing: false,
    scheduleId: null,
    scheduleStatus: 0,
    previewLoading: false,
    previewTimes: [] as string[],
    frequency: ref<ScheduleFrequency>({ ...DEFAULT_FREQUENCY }),
    model: {
      cronExpression: ref(''),
      timezone: ref(DEFAULT_TIMEZONE),
      retryTimes: ref(0),
      retryInterval: ref(0),
      activeStartTime: ref<string | null>(null),
      activeEndTime: ref<string | null>(null),
      concurrentPolicy: ref(0),
      misfirePolicy: ref(0)
    },
    rules: {
      cronExpression: {
        required: true,
        trigger: ['input', 'blur'],
        validator: (rule: FormItemRule, value: string) => {
          if (!value) {
            return Error(t('project.synchronization_definition.cron_invalid'))
          }
        }
      },
      timezone: {
        required: true,
        trigger: ['change']
      }
    }
  })

  const generatedCronExpression = computed(() =>
    buildCronExpression(variables.frequency)
  )

  const frequencyTime = computed(
    () => `${pad2(variables.frequency.hour)}:${pad2(variables.frequency.minute)}:00`
  )

  const handleFrequencyTimeChange = (val: string | number | null) => {
    if (val === null || val === undefined) return
    const parts = String(val).split(':').map(Number)
    if (parts.length >= 2) {
      variables.frequency.hour = parts[0] || 0
      variables.frequency.minute = parts[1] || 0
    }
  }

  watch(
    () => variables.frequency,
    () => {
      variables.model.cronExpression = generatedCronExpression.value
    },
    { deep: true }
  )

  const resetModel = () => {
    variables.editing = false
    variables.scheduleId = null
    variables.scheduleStatus = 0
    variables.previewTimes = []
    variables.frequency = { ...DEFAULT_FREQUENCY }
    variables.model.cronExpression = buildCronExpression(variables.frequency)
    variables.model.timezone = DEFAULT_TIMEZONE
    variables.model.retryTimes = 0
    variables.model.retryInterval = 0
    variables.model.activeStartTime = null
    variables.model.activeEndTime = null
    variables.model.concurrentPolicy = 0
    variables.model.misfirePolicy = 0
  }

  const loadSchedule = () => {
    const row = props.row || {}
    queryJobSchedulePaging({ pageNo: 1, pageSize: 1000 })
      .then((res: any) => {
        const list = res?.totalList || []
        const found = list.find((s: any) => s.jobDefinitionId === row.id)
        if (!found) return
        variables.editing = true
        variables.scheduleId = found.id
        variables.scheduleStatus = found.status
        variables.frequency = parseCronExpression(found.cronExpression || '')
        variables.model.timezone = found.timezone || DEFAULT_TIMEZONE
        variables.model.retryTimes = found.retryTimes ?? 0
        variables.model.retryInterval = found.retryInterval ?? 0
        variables.model.activeStartTime = found.activeStartTime || null
        variables.model.activeEndTime = found.activeEndTime || null
        variables.model.concurrentPolicy = found.concurrentPolicy ?? 0
        variables.model.misfirePolicy = found.misfirePolicy ?? 0
      })
      .catch(() => {})
  }

  watch(
    () => props.showModalRef,
    (val) => {
      if (!val) return
      resetModel()
      loadSchedule()
    }
  )

  const handlePreview = () => {
    if (!variables.model.cronExpression) {
      message.warning(t('project.synchronization_definition.cron_invalid'))
      return
    }
    variables.previewLoading = true
    previewCronExecution({
      cronExpression: variables.model.cronExpression,
      timezone: variables.model.timezone || DEFAULT_TIMEZONE,
      count: 5
    })
      .then((res: any) => {
        variables.previewTimes = res || []
      })
      .catch(() => {
        variables.previewTimes = []
      })
      .finally(() => {
        variables.previewLoading = false
      })
  }

  const handleValidate = async () => {
    await variables.scheduleFormRef.validate()

    if (variables.saving) return
    variables.saving = true

    const payload = {
      jobDefinitionId: props.row?.id,
      cronExpression: variables.model.cronExpression,
      timezone: variables.model.timezone || DEFAULT_TIMEZONE,
      retryTimes: variables.model.retryTimes,
      retryInterval: variables.model.retryInterval,
      activeStartTime: variables.model.activeStartTime,
      activeEndTime: variables.model.activeEndTime,
      concurrentPolicy: variables.model.concurrentPolicy,
      misfirePolicy: variables.model.misfirePolicy
    }

    try {
      if (variables.editing && variables.scheduleId) {
        await updateJobSchedule(variables.scheduleId, payload)
      } else {
        await createJobSchedule(payload)
      }
      message.success(t('project.synchronization_definition.save_success'))
      variables.saving = false
      ctx.emit('confirmModal', props.showModalRef)
    } catch (err) {
      variables.saving = false
    }
  }

  const handleToggleStatus = async (value: number) => {
    if (!variables.scheduleId) return
    try {
      if (value === 1) {
        await enableJobSchedule(variables.scheduleId)
        message.success(t('project.synchronization_definition.enable_success'))
      } else {
        await disableJobSchedule(variables.scheduleId)
        message.success(t('project.synchronization_definition.disable_success'))
      }
      variables.scheduleStatus = value
    } catch (err) {
      variables.scheduleStatus = value === 1 ? 0 : 1
    }
  }

  const handleTrigger = async () => {
    if (!variables.scheduleId) return
    try {
      await triggerJobSchedule(variables.scheduleId)
      message.success(t('project.synchronization_definition.trigger_success'))
    } catch (err) {
      message.error(t('project.synchronization_definition.trigger_failed'))
    }
  }

  const handleDelete = async () => {
    if (!variables.scheduleId) return
    try {
      await deleteJobSchedule(variables.scheduleId)
      message.success(t('project.synchronization_definition.delete_success'))
      ctx.emit('confirmModal', props.showModalRef)
    } catch (err) {
      message.error(t('project.synchronization_definition.delete_failed'))
    }
  }

  return {
    variables,
    generatedCronExpression,
    frequencyTime,
    handleFrequencyTimeChange,
    handleValidate,
    handlePreview,
    handleToggleStatus,
    handleTrigger,
    handleDelete
  }
}
