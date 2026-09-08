export interface FolderItem extends BrowseNode {
  depth: number
}

export interface BrowseNode {
  nodeId: string
  label: string
  address: string
  description?: string
  leaf: boolean
  parentId: string | null
  children: string[]
  loadedOnce: boolean
  loading: boolean
  hasMore: boolean
  attributes?: Record<string, any>
}

export interface TagRow {
  id: string
  nativeId: string
  tagName: string
  tagAddress: string
  dataType?: string
  status?: string
  groupId?: string
}

export interface RawBrowseNode {
  nativeId: string
  address?: string
  displayName: string
  description?: string
  leaf: boolean
  children?: RawBrowseNode[]
  attributes?: Record<string, any>
}
