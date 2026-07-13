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

import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  getDataStandardDetail,
  createDataStandard,
  updateDataStandard,
  getVersionList,
  getVersionDetail,
  createVersion,
  publishVersion,
  archiveVersion,
  deleteVersion,
  batchUpdateFields,
  batchUpdateFormats,
  batchUpdateMappings
} from '@/service/data-standard'
import type {
  DataStandardForm,
  FieldForm,
  FormatForm,
  MappingForm
} from './types'
import { DEFAULT_FIELD_FORM, DEFAULT_FORMAT_FORM, DEFAULT_MAPPING_FORM } from './types'

export function useDetail() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()

  const id = computed(() => {
    const val = route.params.id
    return val ? Number(val) : undefined
  })
  const isEdit = computed(() => !!id.value)

  // Standard form
  const form = reactive<DataStandardForm>({
    name: '',
    code: '',
    type: null,
    source: '',
    description: '',
    groups: []
  })

  // Version state
  const versions = ref<any[]>([])
  const currentVersionId = ref<number | undefined>(undefined)
  const currentVersion = ref<any>(null)

  // Detail data for version editing
  const fields = ref<FieldForm[]>([])
  const formats = ref<FormatForm[]>([])
  const mappings = ref<MappingForm[]>([])

  const loading = ref(false)
  const saving = ref(false)

  const isCurrentVersionDraft = computed(() => {
    return currentVersion.value?.status === 'DRAFT'
  })

  // Load standard detail
  const loadDetail = async () => {
    if (!id.value) return
    loading.value = true
    try {
      const result = await getDataStandardDetail(id.value)
      if (result) {
        form.name = result.name || ''
        form.code = result.code || ''
        form.type = result.type || null
        form.source = result.source || ''
        form.description = result.description || ''
        // Load groups from localStorage (backend doesn't persist them)
        const saved = localStorage.getItem(`ds_groups_${id.value}`)
        form.groups = saved ? JSON.parse(saved) : []
      }
      await loadVersions()
    } finally {
      loading.value = false
    }
  }

  // Load versions
  const loadVersions = async () => {
    if (!id.value) return
    const result = await getVersionList(id.value)
    versions.value = result || []
    // Select current or first version
    const current = versions.value.find((v: any) => v.isCurrent)
    if (current) {
      currentVersionId.value = current.id
    } else if (versions.value.length > 0) {
      currentVersionId.value = versions.value[0].id
    } else {
      currentVersionId.value = undefined
    }
    if (currentVersionId.value) {
      await loadVersionDetail(currentVersionId.value)
    }
  }

  // Load version detail (fields, formats, mappings)
  const loadVersionDetail = async (versionId: number) => {
    if (!id.value) return
    loading.value = true
    try {
      const result = await getVersionDetail(id.value, versionId)
      currentVersion.value = result
      fields.value = (result?.fields || []).map((f: any) => ({ ...f }))
      formats.value = (result?.formats || []).map((f: any) => ({ ...f }))
      mappings.value = (result?.mappings || []).map((m: any) => ({ ...m }))
    } finally {
      loading.value = false
    }
  }

  // Create or update standard
  const saveStandard = async () => {
    saving.value = true
    try {
      if (isEdit.value && id.value) {
        await updateDataStandard(id.value, form)
        // Persist groups to localStorage (backend doesn't store them)
        localStorage.setItem(`ds_groups_${id.value}`, JSON.stringify(form.groups || []))
        message.success('更新成功')
      } else {
        const result = await createDataStandard(form)
        const newId = (result as any)?.id || (result as any)?.data?.id
        if (newId && form.groups?.length) {
          localStorage.setItem(`ds_groups_${newId}`, JSON.stringify(form.groups))
        }
        message.success('创建成功')
        router.push({ name: 'data-standard-list' })
      }
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  // Create new version
  const handleCreateVersion = async (description?: string) => {
    if (!id.value) return
    const maxVersion = versions.value.reduce((max: number, v: any) => {
      const num = parseInt((v.version || '').replace(/\D/g, ''), 10)
      return !isNaN(num) && num > max ? num : max
    }, 0)
    const nextVersion = 'V' + (maxVersion + 1) + '.0'
    await createVersion(id.value, { version: nextVersion, description })
    message.success('版本创建成功')
    await loadVersions()
  }

  // Publish version
  const handlePublishVersion = async (versionId: number) => {
    if (!id.value) return
    await publishVersion(id.value, versionId)
    message.success('版本发布成功')
    await loadVersions()
  }

  // Archive version
  const handleArchiveVersion = async (versionId: number) => {
    if (!id.value) return
    await archiveVersion(id.value, versionId)
    message.success('版本归档成功')
    await loadVersions()
  }

  // Delete version
  const handleDeleteVersion = async (versionId: number) => {
    if (!id.value) return
    await deleteVersion(id.value, versionId)
    message.success('版本删除成功')
    await loadVersions()
  }

  // Select version
  const handleSelectVersion = async (versionId: number) => {
    currentVersionId.value = versionId
    await loadVersionDetail(versionId)
  }

  // Save fields
  const saveFields = async () => {
    if (!id.value || !currentVersionId.value) return
    await batchUpdateFields(id.value, currentVersionId.value, fields.value)
    message.success('字段保存成功')
    await loadVersionDetail(currentVersionId.value)
  }

  // Save formats
  const saveFormats = async () => {
    if (!id.value || !currentVersionId.value) return
    await batchUpdateFormats(id.value, currentVersionId.value, formats.value)
    message.success('格式保存成功')
    await loadVersionDetail(currentVersionId.value)
  }

  // Save mappings
  const saveMappings = async () => {
    if (!id.value || !currentVersionId.value) return
    await batchUpdateMappings(id.value, currentVersionId.value, mappings.value)
    message.success('映射保存成功')
    await loadVersionDetail(currentVersionId.value)
  }

  // Field CRUD helpers
  const addField = () => {
    fields.value.push({ ...DEFAULT_FIELD_FORM, sortOrder: fields.value.length })
  }
  const removeField = (index: number) => {
    fields.value.splice(index, 1)
  }

  // Format CRUD helpers
  const addFormat = () => {
    formats.value.push({ ...DEFAULT_FORMAT_FORM })
  }
  const removeFormat = (index: number) => {
    formats.value.splice(index, 1)
  }

  // Mapping CRUD helpers
  const addMapping = () => {
    mappings.value.push({ ...DEFAULT_MAPPING_FORM })
  }
  const removeMapping = (index: number) => {
    mappings.value.splice(index, 1)
  }

  return {
    id,
    isEdit,
    form,
    versions,
    currentVersionId,
    currentVersion,
    fields,
    formats,
    mappings,
    loading,
    saving,
    isCurrentVersionDraft,
    loadDetail,
    loadVersions,
    handleSelectVersion,
    saveStandard,
    handleCreateVersion,
    handlePublishVersion,
    handleArchiveVersion,
    handleDeleteVersion,
    saveFields,
    saveFormats,
    saveMappings,
    addField,
    removeField,
    addFormat,
    removeFormat,
    addMapping,
    removeMapping
  }
}
