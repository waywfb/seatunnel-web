import { reactive, computed, ref } from 'vue'
import type { BrowseNode, FolderItem, RawBrowseNode } from './types'
import { discoverTags } from '@/service/data-source'

const nodeMap = reactive(new Map<string, BrowseNode>())
const rootNodeIds = reactive<string[]>([])
const connId = ref('')

function buildNode(raw: RawBrowseNode, parentId: string | null): BrowseNode {
  const nodeId = raw.nativeId || raw.address || ''
  const existing = nodeMap.get(nodeId)
  if (existing) return existing

  const node: BrowseNode = {
    nodeId,
    label: raw.displayName || nodeId,
    address: raw.address || nodeId,
    description: raw.description,
    leaf: raw.leaf,
    parentId,
    children: [],
    loadedOnce: false,
    loading: false,
    hasMore: false,
  }
  nodeMap.set(nodeId, node)

  if (raw.children && raw.children.length > 0) {
    node.children = raw.children.map(c => buildNode(c, nodeId).nodeId)
    node.loadedOnce = true
  }

  return node
}

export function useBrowseStore() {
  const folderList = computed(() => {
    const result: FolderItem[] = []
    function walk(nodeIds: string[], depth: number) {
      for (const id of nodeIds) {
        const n = nodeMap.get(id)
        if (!n || n.leaf) continue
        result.push({ ...n, depth })
        if (n.children.length > 0) walk(n.children, depth + 1)
      }
    }
    walk(rootNodeIds, 0)
    return result
  })

  async function loadRoots(connectionId: string) {
    connId.value = connectionId
    rootNodeIds.length = 0
    const res = await discoverTags({ connectionId })
    const raws: RawBrowseNode[] = res?.nodes || []
    for (const raw of raws) {
      const node = buildNode(raw, null)
      if (!rootNodeIds.includes(node.nodeId)) {
        rootNodeIds.push(node.nodeId)
      }
    }
  }

  async function loadChildren(nodeId: string) {
    const node = nodeMap.get(nodeId)
    if (!node || node.leaf || node.loading) return
    if (node.loadedOnce) return
    node.loading = true
    try {
      const res = await discoverTags({ connectionId: connId.value, parentNodeId: nodeId, limit: 200 })
      const raws: RawBrowseNode[] = res?.nodes || []
      for (const raw of raws) {
        const child = buildNode(raw, nodeId)
        if (!node.children.includes(child.nodeId)) {
          node.children.push(child.nodeId)
        }
      }
      node.loadedOnce = true
    } catch {
      node.loadedOnce = true
    } finally {
      node.loading = false
    }
  }

  function getNode(nodeId: string): BrowseNode | undefined {
    return nodeMap.get(nodeId)
  }

  function getLeafChildren(nodeId: string): BrowseNode[] {
    const node = nodeMap.get(nodeId)
    if (!node) return []
    return node.children
      .map(id => nodeMap.get(id))
      .filter((n): n is BrowseNode => n !== undefined && n.leaf)
  }

  function getAllChildren(nodeId: string): BrowseNode[] {
    const node = nodeMap.get(nodeId)
    if (!node) return []
    return node.children
      .map(id => nodeMap.get(id))
      .filter((n): n is BrowseNode => n !== undefined)
  }

  function clear() {
    nodeMap.clear()
    rootNodeIds.length = 0
  }

  return {
    nodeMap,
    rootNodeIds,
    folderList,
    loadRoots,
    loadChildren,
    getNode,
    getLeafChildren,
    getAllChildren,
    clear,
  }
}
