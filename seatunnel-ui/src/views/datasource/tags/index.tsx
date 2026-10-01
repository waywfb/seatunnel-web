import { defineComponent, ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { datasourceList } from '@/service/data-source'
import TagManage from './tag-manage'
import STabs from '@/components/tabs'

const PLC_TYPES = ['OPCUA', 'S7', 'Modbus', 'Plc4x']

export default defineComponent({
  setup() {
    const { t } = useI18n()
    const message = useMessage()
    const route = useRoute()

    const datasources = ref<any[]>([])
    const selectedId = ref((route.query.datasourceId as string) || '')
    const loadingList = ref(false)
    const loadDatasources = async () => {
      loadingList.value = true
      try {
        const res = await datasourceList({
          pageNo: 1,
          pageSize: 999,
          searchVal: '',
          pluginName: ''
        })
        const all = res?.data || []
        datasources.value = all.filter((d: any) =>
          PLC_TYPES.includes(d.pluginName)
        )
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
      // Use history.replaceState to update URL without triggering Vue Router navigation
      const url = new URL(window.location.href)
      url.searchParams.set('datasourceId', id)
      window.history.replaceState({}, '', url.toString())
    }

    const selectedDs = computed(() =>
      datasources.value.find((d: any) => d.id === selectedId.value)
    )

    // Tab配置
    const tabOptions = computed(() =>
      datasources.value.map((ds: any) => ({
        name: ds.id,
        label: ds.datasourceName
      }))
    )

    onMounted(() => {
      loadDatasources()
    })

    return () => (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%'
        }}
      >
        {/* Page title with action button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0
              }}
            >
              {t('datasource.tag_manage')}
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '4px 0 0 0'
              }}
            >
              按系统/设备的实际层级组织测点，和现场台账结构保持一致
            </p>
          </div>
        </div>

        {/* Gateway tabs */}
        <div style={{ marginBottom: '4px' }}>
          <STabs
            value={selectedId.value}
            onUpdate:value={handleChange}
            tabs={tabOptions.value}
          />
        </div>

        {/* Tag manage content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {selectedDs.value ? (
            <TagManage
              datasourceId={selectedDs.value.id}
              pluginName={selectedDs.value.pluginName}
            />
          ) : !loadingList.value ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: '#94a3b8',
                fontSize: '14px'
              }}
            >
              {datasources.value.length === 0
                ? '暂无 PLC 数据源'
                : '请选择采集网关'}
            </div>
          ) : null}
        </div>
      </div>
    )
  }
})
