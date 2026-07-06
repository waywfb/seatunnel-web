import { ref, computed } from 'vue'
import { getTagList, deleteTag } from '@/service/data-source'
import type { TagRow } from './types'

export function useTagTable(datasourceId: () => string | null) {
  const tagList = ref<TagRow[]>([])
  const searchQuery = ref('')
  const page = ref(1)
  const pageSize = 20

  const filteredTagList = computed(() => {
    const q = searchQuery.value.toLowerCase()
    if (!q) return tagList.value
    return tagList.value.filter(
      t =>
        (t.tagName || '').toLowerCase().includes(q) ||
        (t.tagAddress || '').toLowerCase().includes(q) ||
        (t.nativeId || '').toLowerCase().includes(q),
    )
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredTagList.value.length / pageSize)),
  )

  const pagedTagList = computed(() => {
    const start = (page.value - 1) * pageSize
    return filteredTagList.value.slice(start, start + pageSize)
  })

  async function loadTagList() {
    const id = datasourceId()
    if (!id) return
    try {
      const result = await getTagList(id)
      tagList.value = result || []
      page.value = 1
    } catch {}
  }

  async function handleDeleteTag(tagId: string) {
    try {
      await deleteTag(tagId)
      await loadTagList()
    } catch {}
  }

  return {
    searchQuery,
    page,
    pageSize,
    tagList,
    filteredTagList,
    totalPages,
    pagedTagList,
    loadTagList,
    handleDeleteTag,
  }
}
