import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount
} from 'vue'
import { useMessage } from 'naive-ui'
import {
  Plus,
  Trash2,
  Download,
  ArrowLeftRight,
  RefreshCw
} from 'lucide-vue-next'
import { importTags, readTagValues } from '@/service/data-source'
import type { ReadValuesResponse } from '@/service/data-source'

interface PointRow {
  key: number
  pointCode: string
  pointName: string
  unitId: number
  functionCode: number
  address: string
  offset: number
  dataType: string
  byteOrder: string
  writable: boolean
  /** 32/64 位测点的第 2/3/4 个寄存器行：置灰展示，不读取也不导入 */
  continuation: boolean
  value: string
  error: string
}

interface FcMeta {
  label: string
  chip: string
  prefix: string
  base: number
  writable: boolean
  namePrefix: string
}

const FC_META: Record<number, FcMeta> = {
  1: {
    label: 'FC1 线圈',
    chip: '01',
    prefix: '0',
    base: 1,
    writable: true,
    namePrefix: 'CO'
  },
  2: {
    label: 'FC2 离散输入',
    chip: '02',
    prefix: '1',
    base: 10001,
    writable: false,
    namePrefix: 'DI'
  },
  3: {
    label: 'FC3 保持寄存器',
    chip: '03',
    prefix: '4',
    base: 40001,
    writable: true,
    namePrefix: 'HR'
  },
  4: {
    label: 'FC4 输入寄存器',
    chip: '04',
    prefix: '3',
    base: 30001,
    writable: false,
    namePrefix: 'IR'
  }
}

const FC_ORDER = [3, 4, 1, 2]

const REG_TYPES = [
  { label: 'u16', dt: 'UINT16' },
  { label: 'i16', dt: 'INT16' },
  { label: 'u32', dt: 'UINT32' },
  { label: 'i32', dt: 'INT32' },
  { label: 'i64', dt: 'INT64' },
  { label: 'f32', dt: 'FLOAT32' },
  { label: 'f64', dt: 'FLOAT64' }
]

const MULTI_BYTE = new Set(['INT32', 'UINT32', 'INT64', 'FLOAT32', 'FLOAT64'])

// 每个测点占用的寄存器数：32 位占 2 个，64 位占 4 个
const WORD_COUNT: Record<string, number> = {
  BOOL: 1,
  INT16: 1,
  UINT16: 1,
  INT32: 2,
  UINT32: 2,
  FLOAT32: 2,
  INT64: 4,
  FLOAT64: 4
}

function notationOf(fc: number, offset: number): string {
  return String(FC_META[fc].base + offset).padStart(5, '0')
}

function byteOrderOf(be: boolean, swap: boolean): string {
  if (be) return swap ? 'CDAB' : 'ABCD'
  return swap ? 'BADC' : 'DCBA'
}

function displayValue(row: PointRow): string {
  if (!row.value) return '—'
  if (row.value === 'true') return '1'
  if (row.value === 'false') return '0'
  return row.value
}

let rowSeq = 1

const chipCls = (active: boolean) =>
  `px-2 py-1 rounded-tide text-xs font-medium min-w-[34px] text-center transition-colors ${
    active
      ? 'bg-tide-primary text-white'
      : 'bg-white border border-tide-outline-variant text-tide-on-surface-variant hover:border-tide-primary hover:text-tide-primary'
  }`

const inputCls =
  'w-full px-2 py-1 bg-white border border-tide-outline-variant rounded-tide font-tide-body-sm text-tide-body-sm focus:outline-none focus:border-tide-primary placeholder:text-tide-outline'

export const ManualPointEntry = defineComponent({
  props: {
    datasourceId: { type: String, required: true },
    groupPath: { type: String, default: '' }
  },
  emits: ['imported'],
  setup(props, { emit }) {
    const message = useMessage()
    const rows = ref<PointRow[]>([])
    const checked = ref(new Set<number>())
    const importing = ref(false)
    const reading = ref(false)
    const live = ref(true)
    let pollTimer: number | null = null

    // generation parameters
    const unitId = ref('1')
    const selFc = ref(3)
    const addrBase = ref(0)
    const startAddr = ref('0')
    const count = ref('3')
    const selType = ref('UINT16')
    const be = ref(true)
    const wordSwap = ref(false)

    const isBitFc = computed(() => selFc.value === 1 || selFc.value === 2)
    const typeOptions = computed(() =>
      isBitFc.value ? [{ label: 'BOOL', dt: 'BOOL' }] : REG_TYPES
    )
    const byteOrder = computed(() => byteOrderOf(be.value, wordSwap.value))

    const startOffset = computed(() => {
      const n = Number(startAddr.value)
      if (!Number.isInteger(n) || n < 0) return null
      const offset = addrBase.value === 1 ? n - 1 : n
      // 基地址为 1（手册地址）时最小值为 1
      return offset < 0 ? null : offset
    })

    const previewAddress = computed(() => {
      const off = startOffset.value
      if (off === null || off < 0) return '—'
      return notationOf(selFc.value, off)
    })

    const unitIdNumber = computed(() => {
      const u = Number(unitId.value)
      return Number.isInteger(u) && u >= 1 && u <= 247 ? u : null
    })

    const countNumber = computed(() => {
      const n = Number(count.value)
      return Number.isInteger(n) && n >= 1 && n <= 500 ? n : null
    })

    // 参数非法时给出提示，不再用 toast（输入过程中会连续触发）
    const paramHint = computed(() => {
      if (unitIdNumber.value === null) return '从站号范围 1-247'
      if (startOffset.value === null)
        return addrBase.value === 1
          ? '起始地址必须为 ≥1 的整数'
          : '起始地址必须为 ≥0 的整数'
      if (countNumber.value === null) return '数量范围 1-500'
      return ''
    })

    const handleFcChange = (fc: number) => {
      selFc.value = fc
      if (fc === 1 || fc === 2) selType.value = 'BOOL'
      else if (selType.value === 'BOOL') selType.value = 'UINT16'
    }

    const handleRead = async (auto = false) => {
      if (importableRows.value.length === 0 || reading.value) return
      reading.value = true
      const snapshot = [...importableRows.value]
      try {
        const points = snapshot.map((r) => ({
          unitId: r.unitId,
          functionCode: r.functionCode,
          offset: r.offset,
          dataType: r.dataType,
          byteOrder: r.byteOrder
        }))
        const res: ReadValuesResponse = await readTagValues({
          datasourceId: props.datasourceId,
          points
        })
        const list = Array.isArray(res?.values) ? res.values : []
        let failed = 0
        for (const item of list) {
          const r = snapshot[item.index]
          if (!r) continue
          r.value = item.value || ''
          r.error = item.error || ''
          if (item.error) failed++
        }
        if (!auto && failed > 0) {
          message.warning(`${failed} 个测点读取失败`)
        }
      } catch (e: any) {
        if (!auto && e?.message && e.message !== 'Error') {
          message.error(e.message)
        }
      } finally {
        reading.value = false
      }
    }

    // 参数驱动：左侧任一参数变化即重建右侧测点列表
    // 手动删除的地址记录在 removedKeys 中，参数变化后仍保持删除状态
    const removedKeys = ref(new Set<string>())
    const rangeHint = ref('')
    const rowIdentity = (r: PointRow) =>
      `${r.unitId}|${r.functionCode}|${r.offset}`

    const regenerate = () => {
      checked.value = new Set()
      const u = unitIdNumber.value
      const start = startOffset.value
      const n = countNumber.value
      const prev = new Map<string, PointRow>()
      for (const r of rows.value) prev.set(rowIdentity(r), r)
      if (u === null || start === null || n === null) {
        rows.value = []
        return
      }
      const fc = selFc.value
      const meta = FC_META[fc]
      const dt = isBitFc.value ? 'BOOL' : selType.value
      const bo = MULTI_BYTE.has(dt) ? byteOrder.value : 'ABCD'
      const removed = removedKeys.value
      const words = WORD_COUNT[dt] ?? 1
      const next: PointRow[] = []
      let lastPoint = start - words
      for (let i = 0; i < n; i++) {
        // 地址列按寄存器密集排列（40001、40002、40003…）
        const offset = start + i
        if (offset > 65535) break
        // 32/64 位的第 2/3/4 个寄存器属于上一个测点：置灰展示，不读取不导入
        const continuation = i % words !== 0
        if (!continuation && offset + words - 1 > 65535) break
        if (continuation && removed.has(`${u}|${fc}|${offset - 1}`)) continue
        if (removed.has(`${u}|${fc}|${offset}`)) continue
        const notation = notationOf(fc, offset)
        if (!continuation) lastPoint = offset
        // 同一地址的旧行保留已填写的测点名称与最近一次读取结果
        const old = prev.get(`${u}|${fc}|${offset}`)
        next.push({
          key: old ? old.key : rowSeq++,
          pointCode: `U${u}_${notation}`,
          pointName: continuation ? '' : old ? old.pointName : '',
          unitId: u,
          functionCode: fc,
          address: notation,
          offset,
          dataType: dt,
          byteOrder: bo,
          writable: meta.writable,
          continuation,
          value: continuation ? '' : old ? old.value : '',
          error: old ? old.error : ''
        })
      }
      rows.value = next
      rangeHint.value =
        next.length > 0
          ? `${FC_META[fc].label.replace(/^FC\d+\s/, '')} ${notationOf(
              fc,
              start
            )}~${notationOf(fc, lastPoint + words - 1)}`
          : ''
      // 实时模式下由轮询填充值；非实时时按需读一次
      if (next.length > 0 && !live.value) void handleRead(true)
    }

    watch(
      [unitId, selFc, addrBase, startAddr, count, selType, be, wordSwap],
      () => regenerate(),
      { immediate: true }
    )

    // 可导入测点：排除 32/64 位的续行（灰色行）
    const importableRows = computed(() =>
      rows.value.filter((r) => !r.continuation)
    )

    const toggleCheck = (key: number) => {
      const next = new Set(checked.value)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      checked.value = next
    }

    const allChecked = computed(
      () =>
        importableRows.value.length > 0 &&
        importableRows.value.every((r) => checked.value.has(r.key))
    )

    const toggleCheckAll = () => {
      if (allChecked.value) checked.value = new Set()
      else checked.value = new Set(importableRows.value.map((r) => r.key))
    }

    const removeRows = (keys: number[]) => {
      if (keys.length === 0) return
      const del = new Set(keys)
      const removed = new Set(removedKeys.value)
      for (const r of rows.value)
        if (del.has(r.key)) removed.add(rowIdentity(r))
      removedKeys.value = removed
      regenerate()
    }

    const handleClear = () => {
      const removed = new Set(removedKeys.value)
      for (const r of rows.value) removed.add(rowIdentity(r))
      removedKeys.value = removed
      regenerate()
    }

    const handleImport = async () => {
      if (importableRows.value.length === 0 || importing.value) return
      // 测点必须归属设备层级节点
      if (!props.groupPath) {
        message.warning('请先在设备层级中选择设备节点')
        return
      }
      importing.value = true
      try {
        const tags = importableRows.value.map((r, idx) => ({
          nativeId: r.pointCode,
          tagAddress: r.address,
          tagName:
            r.pointName.trim() ||
            `${FC_META[r.functionCode].namePrefix}_${r.offset}`,
          source: 'import',
          groupPath: props.groupPath,
          sortOrder: idx,
          enabled: true,
          readOnly: !r.writable,
          properties: {
            dataType: r.dataType,
            functionCode: r.functionCode,
            registerOffset: r.offset,
            unitId: r.unitId,
            byteOrder: r.byteOrder,
            scale: 1,
            offsetValue: 0
          }
        }))
        await importTags(props.datasourceId, { tags })
        handleClear()
        emit('imported')
      } catch (e: any) {
        message.error(e?.message || '导入失败')
      } finally {
        importing.value = false
      }
    }

    // ModScan 式周期刷新：每 1 秒轮询一次；关闭「实时」后停止。
    // 组件随弹窗关闭卸载（NModal display-directive 默认 'if'），定时器随之清理。
    onMounted(() => {
      // 打开即按当前参数试读一次，之后每 1 秒轮询
      if (importableRows.value.length > 0) void handleRead(true)
      pollTimer = window.setInterval(() => {
        if (live.value) void handleRead(true)
      }, 1000)
    })
    onBeforeUnmount(() => {
      if (pollTimer !== null) {
        window.clearInterval(pollTimer)
        pollTimer = null
      }
    })

    return () => (
      <div class='flex flex-row gap-tide-gap-lg flex-1 h-full overflow-hidden'>
        {/* Left: parameters */}
        <div class='lg:w-1/4 w-full bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden flex-shrink-0'>
          <div class='p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface'>
            <h3 class='font-tide-label-md text-tide-label-md text-tide-on-surface'>
              采集参数
            </h3>
          </div>
          <div class='p-3 flex flex-col gap-3 overflow-auto text-tide-body-sm text-tide-body-sm'>
            {/* unit id */}
            <div class='flex items-center justify-between gap-2'>
              <span class='text-tide-on-surface-variant flex-shrink-0'>
                从站号
              </span>
              <input
                class={`${inputCls} w-20`}
                value={unitId.value}
                onInput={(e: any) => (unitId.value = e.target.value)}
              />
            </div>

            {/* function code */}
            <div class='flex flex-col gap-1.5'>
              <span class='text-tide-on-surface-variant'>功能码</span>
              <div class='flex gap-1.5'>
                {FC_ORDER.map((fc) => (
                  <button
                    class={chipCls(selFc.value === fc)}
                    title={FC_META[fc].label}
                    onClick={() => handleFcChange(fc)}
                  >
                    {FC_META[fc].chip}
                  </button>
                ))}
              </div>
            </div>

            {/* address base */}
            <div class='flex items-center justify-between gap-2'>
              <span class='text-tide-on-surface-variant flex-shrink-0'>
                基地址
              </span>
              <div class='flex gap-1.5'>
                <button
                  class={chipCls(addrBase.value === 0)}
                  onClick={() => (addrBase.value = 0)}
                >
                  0
                </button>
                <button
                  class={chipCls(addrBase.value === 1)}
                  onClick={() => (addrBase.value = 1)}
                >
                  1
                </button>
              </div>
            </div>

            {/* start & count */}
            <div class='flex items-center gap-2'>
              <div class='flex flex-col gap-1 flex-1'>
                <span class='text-tide-on-surface-variant'>起始地址</span>
                <input
                  class={inputCls}
                  value={startAddr.value}
                  onInput={(e: any) => (startAddr.value = e.target.value)}
                />
              </div>
              <div class='flex flex-col gap-1 flex-1'>
                <span class='text-tide-on-surface-variant'>数量</span>
                <input
                  class={inputCls}
                  value={count.value}
                  onInput={(e: any) => (count.value = e.target.value)}
                />
              </div>
            </div>

            <div class='text-tide-on-surface-variant text-xs'>
              {paramHint.value ? (
                <span class='text-tide-error'>{paramHint.value}</span>
              ) : (
                <span>
                  已生成 {importableRows.value.length} 个测点
                  {rangeHint.value ? ` · ${rangeHint.value}` : ''}
                </span>
              )}
            </div>

            <div class='border-t border-tide-outline-variant pt-3 flex flex-col gap-1.5'>
              <span class='text-tide-on-surface-variant'>类型</span>
              <div class='flex flex-wrap gap-1.5'>
                {typeOptions.value.map((t) => (
                  <button
                    class={chipCls(selType.value === t.dt)}
                    onClick={() => (selType.value = t.dt)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div class='flex items-center justify-between gap-2'>
              <span class='text-tide-on-surface-variant flex-shrink-0'>
                端序
              </span>
              <div class='flex gap-1.5'>
                <button
                  class={chipCls(be.value)}
                  title='Big Endian'
                  onClick={() => (be.value = true)}
                >
                  BE
                </button>
                <button
                  class={chipCls(!be.value)}
                  title='Little Endian'
                  onClick={() => (be.value = false)}
                >
                  LE
                </button>
              </div>
            </div>

            <div class='flex items-center justify-between gap-2'>
              <span class='text-tide-on-surface-variant flex-shrink-0'>
                字序
              </span>
              <button
                class={`${chipCls(wordSwap.value)} flex items-center gap-1`}
                title='交换 16 位字顺序（BE:ABCD↔CDAB / LE:DCBA↔BADC）'
                onClick={() => (wordSwap.value = !wordSwap.value)}
              >
                <ArrowLeftRight size={12} />
                {wordSwap.value ? '交换' : '顺序'}
              </button>
            </div>

            {/* live hints */}
            <div class='text-[11px] leading-relaxed text-tide-outline bg-tide-surface-container rounded-tide p-2'>
              <div>
                起始 {startAddr.value || '0'} → 手册地址{' '}
                <span class='font-tide-mono-data text-tide-on-surface-variant'>
                  {previewAddress.value}
                </span>
              </div>
              <div>
                字节序{' '}
                <span class='font-tide-mono-data text-tide-on-surface-variant'>
                  {isBitFc.value || !MULTI_BYTE.has(selType.value)
                    ? 'ABCD（固定）'
                    : byteOrder.value}
                </span>
              </div>
              <div class='mt-1'>参数仅作用于新生成的测点</div>
            </div>
          </div>
        </div>

        {/* Right: points */}
        <div class='lg:w-3/4 w-full min-w-0 bg-tide-surface-container-lowest rounded-tide-xl border border-tide-outline-variant flex flex-col overflow-hidden'>
          <div class='p-tide-gap-md border-b border-tide-outline-variant bg-tide-surface flex items-center justify-between gap-2 flex-shrink-0'>
            <div class='flex items-center gap-2 text-sm text-tide-on-surface-variant'>
              <span class='font-tide-label-md text-tide-label-md text-tide-on-surface'>
                点位列表
              </span>
              <span class='text-tide-outline'>共 {rows.value.length} 个</span>
            </div>
            <div class='flex items-center gap-2'>
              <button
                class={`px-3 py-1.5 rounded-tide font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs border transition-colors ${
                  live.value
                    ? 'bg-tide-primary text-white border-tide-primary hover:bg-tide-primary-container'
                    : 'bg-white text-tide-on-surface border-tide-outline-variant hover:bg-tide-surface-container'
                }`}
                title='每 1 秒自动刷新全部测点值'
                onClick={() => (live.value = !live.value)}
              >
                <span
                  class={`w-1.5 h-1.5 rounded-full ${
                    live.value ? 'bg-white animate-pulse' : 'bg-tide-outline'
                  }`}
                />
                实时
              </button>
              <button
                class='bg-white text-tide-on-surface border border-tide-outline-variant px-3 py-1.5 rounded-tide hover:bg-tide-surface-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed'
                disabled={rows.value.length === 0}
                onClick={() => handleRead(false)}
              >
                <RefreshCw
                  size={14}
                  class={reading.value && !live.value ? 'animate-spin' : ''}
                />
                {reading.value && !live.value ? '读取中...' : '读取'}
              </button>
              <button
                class='bg-white text-tide-on-surface border border-tide-outline-variant px-3 py-1.5 rounded-tide hover:bg-tide-surface-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed'
                disabled={checked.value.size === 0}
                onClick={() => removeRows([...checked.value])}
              >
                <Trash2 size={14} />
                删除选中
                {checked.value.size > 0 ? ` (${checked.value.size})` : ''}
              </button>
              <button
                class='bg-white text-tide-on-surface border border-tide-outline-variant px-3 py-1.5 rounded-tide hover:bg-tide-surface-container transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs'
                disabled={rows.value.length === 0}
                onClick={handleClear}
              >
                清空
              </button>
              <button
                class={`px-3 py-1.5 rounded-tide transition-colors font-tide-label-md text-tide-label-md flex items-center gap-1 text-xs ${
                  rows.value.length > 0 && !importing.value
                    ? 'bg-tide-primary text-white hover:bg-tide-primary-container'
                    : 'bg-tide-outline/20 text-tide-outline cursor-not-allowed'
                }`}
                disabled={rows.value.length === 0 || importing.value}
                onClick={handleImport}
              >
                <Download size={14} />
                {importing.value
                  ? '导入中...'
                  : `导入全部 (${importableRows.value.length})`}
              </button>
            </div>
          </div>

          <div class='flex-1 overflow-auto bg-tide-surface-container-lowest'>
            {rows.value.length === 0 ? (
              <div class='h-full flex flex-col items-center justify-center text-tide-outline gap-2'>
                <Plus size={32} />
                <span class='font-tide-body-sm'>
                  在左侧设置从站号、功能码、起始地址与数量
                </span>
              </div>
            ) : (
              <table class='w-full text-left border-collapse'>
                <thead class='sticky top-0 bg-tide-surface-bright border-b border-tide-outline-variant font-tide-label-caps text-tide-label-caps text-tide-on-surface uppercase tracking-wider z-10'>
                  <tr>
                    <th class='p-tide-gap-sm pl-tide-gap-md w-8'>
                      <span
                        class={`w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${
                          allChecked.value
                            ? 'bg-tide-primary border-tide-primary text-white'
                            : 'border-tide-outline-variant hover:border-tide-primary bg-white'
                        }`}
                        onClick={toggleCheckAll}
                      >
                        {allChecked.value && (
                          <svg
                            width='10'
                            height='10'
                            viewBox='0 0 10 10'
                            fill='none'
                          >
                            <path
                              d='M1.5 5L4 7.5L8.5 2.5'
                              stroke='currentColor'
                              stroke-width='1.5'
                              stroke-linecap='round'
                              stroke-linejoin='round'
                            />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th class='p-tide-gap-sm font-bold'>地址</th>
                    <th class='p-tide-gap-sm font-bold'>手册地址</th>
                    <th class='p-tide-gap-sm font-bold'>值</th>
                    <th class='p-tide-gap-sm font-bold'>TAG 名称</th>
                    <th class='p-tide-gap-sm pr-tide-gap-md font-bold text-right'>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody class='font-tide-body-sm text-tide-body-sm text-tide-on-surface divide-y divide-tide-outline-variant/30'>
                  {rows.value.map((row, rowIdx) => {
                    const ck = checked.value.has(row.key)
                    return (
                      <tr
                        class={`group/row transition-colors ${
                          row.continuation
                            ? 'bg-tide-surface-container-lowest text-tide-outline'
                            : 'hover:bg-tide-surface-container-low'
                        }`}
                      >
                        <td class='p-tide-gap-sm pl-tide-gap-md w-8'>
                          {row.continuation ? (
                            <span class='block w-4 h-4' />
                          ) : (
                            <span
                              class={`w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${
                                ck
                                  ? 'bg-tide-primary border-tide-primary text-white'
                                  : 'border-tide-outline-variant hover:border-tide-primary bg-white'
                              }`}
                              onClick={() => toggleCheck(row.key)}
                            >
                              {ck && (
                                <svg
                                  width='10'
                                  height='10'
                                  viewBox='0 0 10 10'
                                  fill='none'
                                >
                                  <path
                                    d='M1.5 5L4 7.5L8.5 2.5'
                                    stroke='currentColor'
                                    stroke-width='1.5'
                                    stroke-linecap='round'
                                    stroke-linejoin='round'
                                  />
                                </svg>
                              )}
                            </span>
                          )}
                        </td>
                        <td
                          class={`p-tide-gap-sm font-tide-mono-data text-tide-mono-data ${
                            row.continuation
                              ? 'text-tide-outline'
                              : 'text-tide-on-surface-variant'
                          }`}
                        >
                          {row.offset}
                        </td>
                        <td class='p-tide-gap-sm font-tide-mono-data text-tide-mono-data'>
                          {row.address}
                        </td>
                        <td class='p-tide-gap-sm font-tide-mono-data text-tide-mono-data'>
                          {row.continuation ? (
                            <span class='text-tide-outline'>—</span>
                          ) : row.error ? (
                            <span
                              class='text-tide-error max-w-[180px] truncate inline-block align-bottom'
                              title={row.error}
                            >
                              {row.error}
                            </span>
                          ) : (
                            <span
                              class={
                                row.value
                                  ? 'text-tide-on-surface'
                                  : 'text-tide-outline'
                              }
                            >
                              {displayValue(row)}
                            </span>
                          )}
                        </td>
                        <td class='p-tide-gap-sm'>
                          {row.continuation ? (
                            <span class='text-tide-outline text-xs'>
                              上一个测点的第{' '}
                              {(rowIdx % (WORD_COUNT[row.dataType] ?? 1)) + 1}{' '}
                              个寄存器
                            </span>
                          ) : (
                            <input
                              class={`${inputCls} max-w-[220px]`}
                              placeholder={`${
                                FC_META[row.functionCode].namePrefix
                              }_${row.offset}`}
                              value={row.pointName}
                              onInput={(e: any) =>
                                (row.pointName = e.target.value)
                              }
                            />
                          )}
                        </td>
                        <td class='p-tide-gap-sm pr-tide-gap-md text-right'>
                          <button
                            class='p-1 rounded-tide text-tide-outline hover:text-tide-error hover:bg-tide-surface-container transition-colors opacity-0 group-hover/row:opacity-100'
                            title='删除该行'
                            onClick={() => removeRows([row.key])}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }
})
