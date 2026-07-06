import { defineComponent, ref, onMounted, watch } from 'vue'
import {
  NSpace, NButton, NCard, NTree, NDataTable,
  useMessage, NSpin, NEmpty, NTabPane, NTabs
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import {
  discoverTags, importTags, refreshTags, getSyncTaskStatus,
  getTagList, deleteTag, getGroupTree, datasourceDetail
} from '@/service/data-source'

const PLC_TYPES = ['OPCUA', 'S7', 'Modbus', 'Plc4x']

export default defineComponent({
  props: {
    datasourceId: { type: String, required: true },
    pluginName: { type: String, default: '' }
  },
  setup(props) {
    const { t } = useI18n()
    const message = useMessage()
    const activeTab = ref('browse')
    const loading = ref(false)

    // Datasource connection params
    const dsHost = ref('localhost')
    const dsPort = ref('')
    const dsParams = ref<Record<string, string>>({})

    const loadDsDetail = async (id: string) => {
      try {
        const res = await datasourceDetail(id)
        const params = res?.params || {}
        dsHost.value = params.host || 'localhost'
        dsPort.value = params.port || ''
        dsParams.value = params
      } catch (_) { }
    }

    watch(() => props.datasourceId, (val) => {
      if (val) loadDsDetail(val)
    }, { immediate: true })

    // Browse/Discover
    const treeData = ref<any[]>([])
    const checkedKeys = ref<string[]>([])
    const treeLoading = ref(false)

    // Tag List
    const tagList = ref<any[]>([])
    const tagColumns = [
      { title: t('datasource.tag_name'), key: 'tagName' },
      { title: t('datasource.tag_address'), key: 'tagAddress' },
      { title: t('datasource.tag_group'), key: 'groupId' },
      {
        title: t('datasource.operation'),
        key: 'actions',
        render: (row: any) => (
          <NButton size='small' type='error' ghost onClick={() => handleDeleteTag(row.id)}>
            {t('datasource.delete')}
          </NButton>
        )
      }
    ]

    // Sync
    const syncRunning = ref(false)
    const syncTaskId = ref('')

    const isPlcType = () => PLC_TYPES.includes(props.pluginName)

    const handleDiscover = async () => {
      if (!props.datasourceId) return
      treeLoading.value = true
      try {
        const port = dsPort.value || '4840'
        const connectionId = `${props.pluginName.toLowerCase()}://${dsHost.value}:${port}`
        let result = await discoverTags({ connectionId })
        treeData.value = buildTreeData(result?.nodes || [])
      } catch (err: any) {
        message.error(err.message || 'Discover failed')
      } finally {
        treeLoading.value = false
      }
    }

    const buildTreeData = (nodes: any[]): any[] => {
      return (nodes || []).map((node: any) => ({
        label: node.displayName || node.nativeId,
        key: node.nativeId || node.address,
        isLeaf: node.leaf,
        children: node.children ? buildTreeData(node.children) : undefined
      }))
    }

    const handleImportSelected = async () => {
      if (checkedKeys.value.length === 0) {
        message.warning('Please select tags to import')
        return
      }
      loading.value = true
      try {
        await importTags(props.datasourceId, {
          tags: checkedKeys.value.map((key: string) => ({
            nativeId: key,
            tagAddress: key,
            tagName: key,
            source: 'browse'
          }))
        })
        message.success('Import success')
        loadTagList()
      } catch (err: any) {
        message.error(err.message || 'Import failed')
      } finally {
        loading.value = false
      }
    }

    const handleRefresh = async () => {
      if (!props.datasourceId) return
      syncRunning.value = true
      try {
        const result = await refreshTags(props.datasourceId)
        message.success(t('datasource.refresh') + ' triggered')
      } catch (err: any) {
        message.error(err.message || 'Refresh failed')
      } finally {
        syncRunning.value = false
      }
    }

    const loadTagList = async () => {
      if (!props.datasourceId) return
      try {
        const result = await getTagList(props.datasourceId)
        tagList.value = result || []
      } catch (_) { }
    }

    const handleDeleteTag = async (tagId: string) => {
      try {
        await deleteTag(tagId)
        message.success('Deleted')
        loadTagList()
      } catch (err: any) {
        message.error(err.message || 'Delete failed')
      }
    }

    onMounted(() => {
      if (props.datasourceId && isPlcType()) {
        loadTagList()
      }
    })

    return () => {
      if (!isPlcType()) return null

      return (
        <NCard title={t('datasource.tag_manage')} style={{ marginTop: '16px' }}>
          <NTabs v-model:value={activeTab.value}>
            <NTabPane name='browse' tab={t('datasource.browse_tags')}>
              <NSpace vertical>
                <NSpace>
                  <NButton type='primary' onClick={handleDiscover} loading={treeLoading.value}>
                    {t('datasource.discover')}
                  </NButton>
                  <NButton
                    type='success'
                    onClick={handleImportSelected}
                    loading={loading.value}
                    disabled={checkedKeys.value.length === 0}
                  >
                    {t('datasource.import_selected')} ({checkedKeys.value.length})
                  </NButton>
                  <NButton onClick={handleRefresh} loading={syncRunning.value}>
                    {t('datasource.refresh')}
                  </NButton>
                </NSpace>
                <NSpin show={treeLoading.value}>
                  {treeData.value.length > 0 ? (
                    <NTree
                      data={treeData.value}
                      blockLine
                      checkable
                      onUpdateCheckedKeys={(keys: string[]) => { checkedKeys.value = keys }}
                      defaultExpandAll
                      style={{ maxHeight: '400px', overflow: 'auto' }}
                    />
                  ) : (
                    <NEmpty description={t('datasource.browse_tags')} />
                  )}
                </NSpin>
              </NSpace>
            </NTabPane>
            <NTabPane name='list' tab={t('datasource.tag_list')}>
              <NButton onClick={loadTagList} style={{ marginBottom: '12px' }}>
                {t('datasource.refresh')}
              </NButton>
              <NDataTable
                columns={tagColumns}
                data={tagList.value}
                rowKey={(row: any) => row.id}
                pagination={{ pageSize: 20 }}
                striped
              />
            </NTabPane>
          </NTabs>
        </NCard>
      )
    }
  }
})
