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

export const I18N_KEYS = {
  // 同步定义相关
  SYNCHRONIZATION_DEFINITION: {
    CREATE_TASK:
      'project.synchronization_definition.create_synchronization_task',
    TASK_NAME: 'project.synchronization_definition.task_name',
    DELETE: 'project.synchronization_definition.delete',
    DELETE_CONFIRM: 'project.synchronization_definition.delete_confirm',
    EDIT: 'project.synchronization_definition.edit',
    START: 'project.synchronization_definition.start',
    CREATE_TIME: 'project.synchronization_definition.create_time',
    UPDATE_TIME: 'project.synchronization_definition.update_time',
    WHOLE_LIBRARY_SYNC: 'project.synchronization_definition.whole_library_sync',
    DATA_INTEGRATION: 'project.synchronization_definition.data_integration',
    ALL_TASK_TYPES: 'project.synchronization_definition.all_task_types',
    RESET: 'project.synchronization_definition.reset',
    REFRESH: 'project.synchronization_definition.refresh',
    PAGINATION_SUMMARY: 'project.synchronization_definition.pagination_summary',
    TOTAL_TASKS: 'project.synchronization_definition.total_tasks',
    RUNNING_TASKS: 'project.synchronization_definition.running_tasks',
    PER_PAGE: 'project.synchronization_definition.per_page',
    ITEMS_PER_PAGE: 'project.synchronization_definition.items_per_page',
    JUMP_TO: 'project.synchronization_definition.jump_to',
    PAGE_UNIT: 'project.synchronization_definition.page_unit'
  },
  // 同步实例相关
  SYNCHRONIZATION_INSTANCE: {
    TOTAL: 'project.synchronization_instance.total',
    RUNNING: 'project.synchronization_instance.running',
    SUCCESS: 'project.synchronization_instance.success',
    FAIL: 'project.synchronization_instance.fail',
    OFFLINE_SYNC: 'project.synchronization_instance.offline_sync',
    REAL_TIME_SYNC: 'project.synchronization_instance.real_time_sync'
  }
} as const
