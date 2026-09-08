import { defineComponent, onMounted, ref, watch } from 'vue'
import { NDrawer, NDrawerContent, NButton, NEmpty, NSpin, NModal } from 'naive-ui'
import {
  Plus,
  Pencil,
  Trash2,
  PlugZap,
  X,
  Plug,
  Eye
} from 'lucide-vue-next'
import { datasourceList, datasourceDelete, testDatasourceConnectById } from '@/service/data-source'
import type { DatasourceList } from '@/service/data-source/types'
import JsonHighlight from '../components/json-highlight'

type ConnectionStatus = 'testing' | 'normal' | 'error'

const CHECK_CONCURRENCY = 5

const ConnectionDrawer = defineComponent({
  name: 'ConnectionDrawer',
  props: {
    show: { type: Boolean, default: false },
    pluginName: { type: String, default: '' },
    displayName: { type: String, default: '' },
    color: { type: String, default: '#6B7280' }
  },
  emits: ['update:show', 'editDatasource', 'createDatasource', 'testDatasource'],
  setup(props, { emit }) {
    const loading = ref(false)
    const connections = ref<DatasourceList[]>([])
    const statusMap = ref<Record<string, ConnectionStatus>>({})
    const confirmVisible = ref(false)
    const pendingDelete = ref<DatasourceList | null>(null)
    const viewingParams = ref<DatasourceList | null>(null)

    // Run real connectivity checks per connection with bounded concurrency,
    // refreshing this.statusMap so each row reflects its actual state.
    const checkConnections = async (rows: DatasourceList[]) => {
      let index = 0
      const worker = async () => {
        while (index < rows.length) {
          const row = rows[index++]
          if (!row?.id) continue
          statusMap.value[row.id] = 'testing'
          try {
            const ok = !!(await testDatasourceConnectById(row.id))
            statusMap.value[row.id] = ok ? 'normal' : 'error'
          } catch {
            statusMap.value[row.id] = 'error'
          }
        }
      }
      const workerCount = Math.min(CHECK_CONCURRENCY, rows.length)
      await Promise.all(
        Array.from({ length: workerCount }, () => worker())
      )
    }

    const loadConnections = async () => {
      if (!props.pluginName) return
      loading.value = true
      try {
        const res: any = await datasourceList({
          pageNo: 1,
          pageSize: 999,
          searchVal: '',
          pluginName: props.pluginName
        })
        connections.value = res?.data || []
        checkConnections(connections.value)
      } catch {
        connections.value = []
      } finally {
        loading.value = false
      }
    }

    const close = () => emit('update:show', false)

    const onCreate = () => {
      emit('createDatasource', props.pluginName)
      close()
    }

    const onEdit = (row: DatasourceList) => {
      emit('editDatasource', row.id)
      close()
    }

    const onTest = (row: DatasourceList) => {
      emit('testDatasource', row.id)
      close()
    }

    const askDelete = (row: DatasourceList) => {
      pendingDelete.value = row
      confirmVisible.value = true
    }

    const confirmDelete = async () => {
      if (!pendingDelete.value) return
      await datasourceDelete(pendingDelete.value.id)
      pendingDelete.value = null
      confirmVisible.value = false
      await loadConnections()
    }

    const cancelDelete = () => {
      pendingDelete.value = null
      confirmVisible.value = false
    }

    const onViewParams = (row: DatasourceList) => {
      viewingParams.value = row
    }

    const closeViewParams = () => {
      viewingParams.value = null
    }

    watch(
      () => props.show,
      (val) => {
        if (val) loadConnections()
      }
    )

    onMounted(() => {
      if (props.show) loadConnections()
    })

    return {
      emit,
      loading,
      connections,
      statusMap,
      confirmVisible,
      pendingDelete,
      viewingParams,
      close,
      onCreate,
      onEdit,
      onTest,
      askDelete,
      confirmDelete,
      cancelDelete,
      onViewParams,
      closeViewParams
    }
  },
  render() {
    const {
      emit,
      show,
      pluginName,
      displayName,
      color,
      loading,
      connections,
      statusMap,
      confirmVisible,
      pendingDelete,
      viewingParams,
      close,
      onCreate,
      onEdit,
      onTest,
      askDelete,
      confirmDelete,
      cancelDelete,
      onViewParams,
      closeViewParams
    } = this

    const getParamsPreview = (row: DatasourceList) => {
      const cfg: any = row.datasourceConfig
      if (!cfg) return null
      const entries: { key: string; value: string }[] = []
      if (cfg.host)
        entries.push({ key: 'Host', value: `${cfg.host}:${cfg.port || ''}` })
      if (cfg.database)
        entries.push({ key: 'Database', value: cfg.database })
      if (cfg.endpoint)
        entries.push({ key: 'Endpoint', value: cfg.endpoint })
      if (cfg.bootstrapServers)
        entries.push({ key: 'Servers', value: cfg.bootstrapServers })
      return entries
    }

    return (
      <NDrawer
        show={show}
        onUpdate:show={(v: boolean) => emit('update:show', v)}
        placement='right'
        width={480}
        zIndex={2000}
        closable
      >
        <NDrawerContent bodyScrollable={false}>
          {/* Header */}
          <div class='p-5 border-b border-tide-outline-variant flex items-center justify-between bg-tide-surface-container-lowest'>
            <div class='flex items-center gap-3'>
              <div
                class='w-10 h-10 rounded-tide-lg flex items-center justify-center text-white flex-shrink-0'
                style={{ backgroundColor: color }}
              >
                <PlugZap size={20} />
              </div>
              <div>
                <h3 class='font-tide-label-md text-tide-on-surface text-sm font-bold'>
                  {displayName || pluginName} 已接数据源
                </h3>
                <p class='text-xs text-tide-on-surface-variant'>
                  共计 {connections.length} 个活动连接实例
                </p>
              </div>
            </div>
            <NButton
              text
              title='关闭'
              onClick={() => emit('update:show', false)}
              class='w-8 h-8 rounded-tide-lg flex items-center justify-center'
            >
              <X size={18} />
            </NButton>
          </div>

          {/* Connection list */}
          <div class='flex-1 overflow-y-auto p-5'>
            <NSpin show={loading}>
              {connections.length > 0 ? (
                <div class='flex flex-col gap-3.5'>
                  {connections.map((row) => {
                    const params = getParamsPreview(row)
                    return (
                      <div
                        key={row.id}
                        class='p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-3'
                      >
                        {/* Top row: name + actions */}
                        <div class='flex items-start justify-between'>
                          <div>
                            <h4 class='font-bold text-sm text-slate-800 flex items-center gap-2'>
                              {row.datasourceName}
                              {statusMap[row.id] === 'error' ? (
                                <span class='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-semibold'>
                                  <span class='w-1.5 h-1.5 rounded-full bg-rose-500' />
                                  异常
                                </span>
                              ) : statusMap[row.id] === 'normal' ? (
                                <span class='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold'>
                                  <span class='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                                  正常
                                </span>
                              ) : (
                                <span class='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold'>
                                  <span class='w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse' />
                                  检测中
                                </span>
                              )}
                            </h4>
                            <p class='text-[11px] font-mono text-slate-400 mt-0.5'>
                              ID: {row.id}
                            </p>
                          </div>

                          <div class='flex items-center gap-1'>
                            <button
                              title='测试连接'
                              onClick={() => onTest(row)}
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors flex items-center justify-center'
                            >
                              <Plug size={12} />
                            </button>
                            <button
                              title='编辑'
                              onClick={() => onEdit(row)}
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 transition-colors flex items-center justify-center'
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              title='查看参数'
                              onClick={() => onViewParams(row)}
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center'
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              title='删除'
                              onClick={() => askDelete(row)}
                              class='w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors flex items-center justify-center'
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Params preview */}
                        {params && params.length > 0 ? (
                          <div class='mt-3 p-2.5 bg-tide-surface-container-lowest rounded-tide-lg text-xs space-y-1 font-mono text-tide-on-surface-variant'>
                            {params.map((p) => (
                              <div key={p.key} class='flex justify-between'>
                                <span class='text-tide-on-surface-variant/60'>
                                  {p.key}:
                                </span>
                                <span class='truncate max-w-[200px]'>
                                  {p.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {/* Footer meta */}
                        <div class='flex items-center justify-between text-[11px] text-tide-on-surface-variant pt-1 mt-2 border-t border-tide-outline-variant/50'>
                          <span>修改人: {row.updateUserName || '-'}</span>
                          <span>更新: {row.updateTime || '-'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                !loading && (
                  <div class='py-12'>
                    <NEmpty description='暂无连接'>
                      {{
                        extra: () => (
                          <NButton type='primary' size='small' onClick={onCreate}>
                            新建连接
                          </NButton>
                        )
                      }}
                    </NEmpty>
                  </div>
                )
              )}
            </NSpin>
          </div>

          {/* Footer */}
          <div class='p-4 border-t border-tide-outline-variant bg-tide-surface-container-lowest flex items-center justify-between'>
            <NButton onClick={() => emit('update:show', false)}>关闭</NButton>
            <NButton
              type='primary'
              onClick={onCreate}
              icon={() => <Plus size={14} />}
            >
              新增 {displayName || pluginName} 连接
            </NButton>
          </div>
        </NDrawerContent>

        {/* Delete confirm */}
        <NModal
          show={confirmVisible}
          onUpdate:show={(v: boolean) => (v ? void 0 : cancelDelete())}
          preset='dialog'
          title={`确认删除「${pendingDelete?.datasourceName || ''}」？`}
          content='删除后不可恢复，请确认。'
          positive-text='确认'
          negative-text='取消'
          onPositiveClick={confirmDelete}
          onNegativeClick={cancelDelete}
        />

        {/* View params modal */}
        <NModal
          show={!!viewingParams}
          onUpdate:show={(v: boolean) => (v ? void 0 : closeViewParams())}
          preset='card'
          title='数据源参数明细'
          style={{ width: '520px' }}
        >
          <div class='space-y-2 text-xs'>
            <p>
              <strong class='text-slate-500'>名称:</strong>{' '}
              {viewingParams?.datasourceName}
            </p>
            <p>
              <strong class='text-slate-500'>类型:</strong>{' '}
              {viewingParams?.pluginName}
            </p>
            <p>
              <strong class='text-slate-500'>负责人:</strong>{' '}
              {viewingParams?.createBy || '-'}
            </p>
            <p>
              <strong class='text-slate-500'>配置明细:</strong>
            </p>
            <pre class='bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto'>
              {JSON.stringify(viewingParams?.datasourceConfig, null, 2)}
            </pre>
          </div>
          {{
            footer: () => (
              <div class='flex justify-end gap-2'>
                <NButton onClick={closeViewParams}>关闭</NButton>
                <NButton
                  type='primary'
                  onClick={() => {
                    if (viewingParams) onEdit(viewingParams)
                  }}
                >
                  编辑此数据源
                </NButton>
              </div>
            )
          }}
        </NModal>
      </NDrawer>
    )
  }
})

export default ConnectionDrawer
