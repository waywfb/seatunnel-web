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

import { defineComponent, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDrawer, NDrawerContent, NSpace, NButton } from 'naive-ui'
import { useNodeSettingModal } from './use-node-setting'
import NodeModeModal from './node-model'
import ConfigurationForm from './configuration-form'
import type { PropType } from 'vue'
import type { NodeInfo } from './types'
import styles from './node-setting.module.scss'

const props = {
  show: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  nodeInfo: {
    type: Object as PropType<NodeInfo>,
    default: {} as NodeInfo
  }
}

const NodeSetting = defineComponent({
  name: 'SettingNodeModal',
  props,
  emits: ['cancelModal', 'confirmModal'],
  setup(props, ctx) {
    const { t } = useI18n()
    const {
      state,
      configurationFormRef,
      modelRef,
      onSave,
      handleChangeTable,
      handleSmartParseConfirm
    } = useNodeSettingModal(props, ctx)

    const standardTableFields = ref<any[]>([])

    const refreshStandardTableFields = async () => {
      await nextTick()
      if (configurationFormRef.value?.getStandardTableFields) {
        standardTableFields.value =
          configurationFormRef.value.getStandardTableFields()
      }
    }

    watch(
      () => props.show,
      async () => {
        await nextTick()
        if (props.show && configurationFormRef.value) {
          await configurationFormRef.value.setValues(props.nodeInfo)
        }
        if (props.show && modelRef.value) {
          modelRef.value.setSelectFields(
            props.nodeInfo.selectTableFields?.tableFields || []
          )
        }
        refreshStandardTableFields()
      }
    )

    const cancelModal = () => {
      ctx.emit('cancelModal', props.show)
    }

    return () => (
      <NDrawer show={props.show} width='40%' zIndex={1000}>
        <NDrawerContent bodyScrollable={false}>
          {{
            default: () => (
              <div class={styles['drawer-layout']}>
                <div class={styles['config-section']}>
                  <ConfigurationForm
                    nodeType={props.nodeInfo.type}
                    nodeId={props.nodeInfo.pluginId}
                    transformType={props.nodeInfo.connectorType}
                    datasourceName={
                      props.nodeInfo.datasourceName ||
                      props.nodeInfo.connectorType ||
                      ''
                    }
                    predecessorDatasourceName={
                      props.nodeInfo.predecessorDatasourceName || ''
                    }
                    predecessorTableName={
                      props.nodeInfo.predecessorTableName || ''
                    }
                    ref={configurationFormRef}
                    onTableNameChange={handleChangeTable}
                    onSmartParseConfirm={handleSmartParseConfirm}
                  />
                </div>
                <div class={styles['divider']} />
                <div class={styles['model-section']}>
                  <NodeModeModal
                    ref={modelRef}
                    type={props.nodeInfo.type}
                    transformType={props.nodeInfo.connectorType}
                    predecessorsNodeId={props.nodeInfo.predecessorsNodeId}
                    currentNodeId={props.nodeInfo.pluginId}
                    schemaError={props.nodeInfo.schemaError}
                    refForm={configurationFormRef}
                    standardTableFields={standardTableFields.value}
                  />
                </div>
              </div>
            ),
            footer: () => (
              <NSpace>
                <NButton onClick={cancelModal}>
                  {t('project.synchronization_definition.cancel')}
                </NButton>
                <NButton onClick={onSave} type='primary'>
                  {t('project.synchronization_definition.confirm')}
                </NButton>
              </NSpace>
            )
          }}
        </NDrawerContent>
      </NDrawer>
    )
  }
})

export default NodeSetting
