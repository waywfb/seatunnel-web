import { defineComponent, ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { datasourceList } from '@/service/data-source'
import TagManage from './tag-manage'

const PLC_TYPES = ['OPCUA', 'S7', 'Modbus', 'Plc4x']

export default defineComponent({
  setup() {
    const { t } = useI18n()
    const message = useMessage()
    const route = useRoute()
    const router = useRouter()

    const datasources = ref<any[]>([])
    const selectedId = ref(route.query.datasourceId as string || '')
    const loadingList = ref(false)
    const activeTab = ref('tags')

    const loadDatasources = async () => {
      loadingList.value = true
      try {
        const res = await datasourceList({ pageNo: 1, pageSize: 999, searchVal: '', pluginName: '' })
        const all = res?.data || []
        datasources.value = all.filter((d: any) => PLC_TYPES.includes(d.pluginName))
        if (!selectedId.value && datasources.value.length > 0) {
          selectedId.value = datasources.value[0].id
        }
      } catch (err: any) {
        message.error(err.message || t('datasource.load_failed'))
      } finally {
        loadingList.value = false
      }
    }

    const handleChange = (id: string) => {
      selectedId.value = id
      router.replace({ query: { datasourceId: id } })
    }

    const selectedDs = computed(() =>
      datasources.value.find((d: any) => d.id === selectedId.value)
    )

    onMounted(() => { loadDatasources() })

    return () => (
      <div class="flex flex-col gap-4 p-4 h-[calc(100vh-200px)] overflow-hidden">
        {/* Tabs */}
        <div class="flex gap-6 border-b border-tide-outline-variant flex-shrink-0">
          <button
            class={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab.value === 'connection'
                ? 'border-tide-status-running text-tide-status-running'
                : 'border-transparent text-tide-outline hover:text-tide-on-surface'
            }`}
            onClick={() => { activeTab.value = 'connection' }}
          >
            连接管理
          </button>
          <button
            class={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab.value === 'tags'
                ? 'border-tide-status-running text-tide-status-running'
                : 'border-transparent text-tide-outline hover:text-tide-on-surface'
            }`}
            onClick={() => { activeTab.value = 'tags' }}
          >
            测点管理
          </button>
        </div>

        {/* 连接管理 placeholder */}
        {activeTab.value === 'connection' && (
          <div class="flex-1 flex items-center justify-center text-tide-outline font-tide-body-sm">
            连接管理
          </div>
        )}

        {/* 测点管理 */}
        {activeTab.value === 'tags' && (
          <div class="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
            {/* Info banner */}
            <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-start gap-2 flex-shrink-0">
              <span class="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">info</span>
              <span>
                测点按系统/设备的实际层级组织，和现场台账结构保持一致，不用先拍平成一张大表
              </span>
            </div>

            {/* Gateway tabs */}
            <div class="flex flex-wrap gap-2 flex-shrink-0">
              {datasources.value.map(ds => (
                <button
                  key={ds.id}
                  class={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedId.value === ds.id
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => handleChange(ds.id)}
                >
                  {ds.datasourceName}
                </button>
              ))}
            </div>

            {/* Tag manage content */}
            {selectedDs.value ? (
              <TagManage
                datasourceId={selectedDs.value.id}
                pluginName={selectedDs.value.pluginName}
              />
            ) : !loadingList.value ? (
              <div class="flex-1 flex items-center justify-center text-tide-outline font-tide-body-sm">
                {datasources.value.length === 0 ? '暂无 PLC 数据源' : '请选择采集网关'}
              </div>
            ) : null}
          </div>
        )}
      </div>
    )
  },
})
