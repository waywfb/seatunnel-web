import { reactive, ref } from 'vue'
import type { BrowseNode } from './types'
import { importTags } from '@/service/data-source'

export function useTagImport(datasourceId: () => string | null) {
  const checkedNodes = reactive(new Map<string, BrowseNode>())
  const importing = ref(false)

  function toggleCheck(node: BrowseNode) {
    if (checkedNodes.has(node.nodeId)) {
      checkedNodes.delete(node.nodeId)
    } else {
      checkedNodes.set(node.nodeId, node)
    }
  }

  function isChecked(nodeId: string): boolean {
    return checkedNodes.has(nodeId)
  }

  function clearChecks() {
    checkedNodes.clear()
  }

  async function handleImport(onSuccess: () => void) {
    if (checkedNodes.size === 0) return
    const id = datasourceId()
    if (!id) return

    importing.value = true
    try {
      const tags = Array.from(checkedNodes.values()).map(n => ({
        nativeId: n.nodeId,
        tagAddress: n.address || n.nodeId,
        tagName: n.label,
        source: 'browse' as const,
      }))
      await importTags(id, { tags })
      checkedNodes.clear()
      onSuccess()
    } finally {
      importing.value = false
    }
  }

  return {
    checkedNodes,
    importing,
    toggleCheck,
    isChecked,
    clearChecks,
    handleImport,
  }
}
