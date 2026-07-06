import { defineComponent, ref, onMounted } from 'vue'
import { NSpace, NCard, NSelect, useMessage } from 'naive-ui'
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

    const loadDatasources = async () => {
      loadingList.value = true
      try {
        const res = await datasourceList({ pageNo: 1, pageSize: 999, searchVal: '', pluginName: '' })
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
      router.replace({ query: { datasourceId: id } })
    }

    const selectedDs = ref<any>(null)

    onMounted(() => {
      loadDatasources()
    })

    return () => {
      const ds = datasources.value.find(
        (d: any) => d.id === selectedId.value
      )

      return (
        <NSpace vertical>
          <NCard title={t('datasource.tag_manage')}>
            <NSpace vertical>
              <NSelect
                value={selectedId.value}
                onUpdateValue={handleChange}
                options={datasources.value.map((d: any) => ({
                  label: `${d.datasourceName} (${d.pluginName})`,
                  value: d.id
                }))}
                placeholder={t('datasource.select_datasource')}
                loading={loadingList.value}
                clearable
              />
              {ds && (
                <TagManage
                  datasourceId={ds.id}
                  pluginName={ds.pluginName}
                />
              )}
              {!ds && !loadingList.value && (
                <p style={{ color: '#888' }}>
                  {datasources.value.length === 0
                    ? t('datasource.no_plc_datasource')
                    : t('datasource.select_datasource_hint')}
                </p>
              )}
            </NSpace>
          </NCard>
        </NSpace>
      )
    }
  }
})
