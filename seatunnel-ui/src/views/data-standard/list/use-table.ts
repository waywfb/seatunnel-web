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

import { onMounted, reactive } from 'vue'
import {
  getDataStandardPage,
  deleteDataStandard,
  enableDataStandard,
  disableDataStandard,
  copyDataStandard
} from '@/service/data-standard'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

export function useTable() {
  const message = useMessage()
  const state = reactive({
    params: {
      name: null as string | null,
      type: null as string | null,
      status: null as number | null
    },
    list: [] as any[],
    allData: [] as any[],
    loading: false,
    page: 1,
    pageSize: 10,
    itemCount: 0,
    typeCounts: {} as Record<string, number>
  })
  const route = useRoute()
  const router = useRouter()

  const getAllData = async () => {
    try {
      const result = await getDataStandardPage({
        pageNo: 1,
        pageSize: 999,
        name: undefined,
        type: undefined,
        status: undefined
      })
      state.allData = result?.data || []
      // 统计各类型数量
      const counts: Record<string, number> = {}
      for (const item of state.allData) {
        const type = item.type || 'Other'
        counts[type] = (counts[type] || 0) + 1
      }
      state.typeCounts = counts
    } catch {}
  }

  const getList = async () => {
    state.loading = true
    try {
      const result = await getDataStandardPage({
        pageNo: state.page,
        pageSize: state.pageSize,
        name: state.params.name || undefined,
        type: state.params.type || undefined,
        status: state.params.status ?? undefined
      })
      state.list = result?.data || []
      state.itemCount = result?.totalCount || 0
    } finally {
      state.loading = false
    }
  }

  const updateList = () => {
    if (state.list.length === 1 && state.page > 1) {
      --state.page
    }
    getList()
  }

  const onDelete = async (id: number) => {
    try {
      await deleteDataStandard(id)
      message.success('删除成功')
      updateList()
    } catch (e: any) {
      message.error(e?.message || '删除失败')
    }
  }

  const onEnable = async (id: number) => {
    try {
      await enableDataStandard(id)
      message.success('启用成功')
      getList()
    } catch (e: any) {
      message.error(e?.message || '启用失败')
    }
  }

  const onDisable = async (id: number) => {
    try {
      await disableDataStandard(id)
      message.success('停用成功')
      getList()
    } catch (e: any) {
      message.error(e?.message || '停用失败')
    }
  }

  const onCopy = async (id: number) => {
    try {
      await copyDataStandard(id)
      message.success('复制成功')
      getList()
    } catch (e: any) {
      message.error(e?.message || '复制失败')
    }
  }

  const onSearch = () => {
    state.page = 1
    getList()
  }

  const onPageChange = (page: number) => {
    state.page = page
    getList()
  }

  const onPageSizeChange = (pageSize: number) => {
    state.page = 1
    state.pageSize = pageSize
    getList()
  }

  onMounted(() => {
    getAllData()
    getList()
  })

  return {
    state,
    onSearch,
    onDelete,
    onEnable,
    onDisable,
    onCopy,
    onPageChange,
    onPageSizeChange,
    getList,
    getAllData
  }
}
