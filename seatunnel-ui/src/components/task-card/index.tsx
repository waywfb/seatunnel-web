import { defineComponent, PropType, h } from 'vue'
import { NTag, NButton, NIcon, NDropdown, NSpin } from 'naive-ui'
import {
  EditOutlined,
  PlayCircleOutlined,
  EllipsisOutlined
} from '@vicons/antd'
import { tasksState } from '@/common/common'
import { useI18n } from 'vue-i18n'
import TimeAgo from '@/components/time-ago'
import { I18N_KEYS } from '@/common/i18n-keys'
import type { Task } from '@/types/task'

const DATASOURCE_DISPLAY_NAMES: Record<string, string> = {
  'JDBC-Mysql': 'MySQL',
  'JDBC-Postgres': 'PostgreSQL',
  'JDBC-SQLServer': 'SQLServer',
  'JDBC-Oracle': 'Oracle',
  'JDBC-Db2': 'Db2',
  'JDBC-Hive': 'Hive',
  'JDBC-KingBase': 'Kingbase',
  'JDBC-TiDB': 'TiDB',
  'MySQL-CDC': 'MySQL-CDC',
  'Postgres-CDC': 'Postgres-CDC',
  'SqlServer-CDC': 'SQLServer-CDC',
  Kafka: 'Kafka',
  Http: 'HTTP',
  ElasticSearch: 'Elasticsearch',
  S3: 'S3',
  MongoDB: 'MongoDB',
  FakeSource: 'FakeSource',
  Hive: 'Hive',
  Console: 'Console',
  StarRocks: 'StarRocks'
}

function getDatasourceDisplayName(name: string): string {
  return DATASOURCE_DISPLAY_NAMES[name] || name
}

const TaskCard = defineComponent({
  name: 'TaskCard',
  props: {
    task: { type: Object as PropType<Task>, required: true },
    onEdit: { type: Function as PropType<(task: Task) => void>, default: null },
    onRun: { type: Function as PropType<(task: Task) => void>, default: null },
    onDelete: {
      type: Function as PropType<(task: Task) => void>,
      default: null
    },
    loadingStates: {
      type: Object as PropType<Map<number, boolean>>,
      default: () => new Map()
    }
  },
  setup(props) {
    const { t } = useI18n()

    const renderState = (state: string) => {
      if (!state) return null
      const option = tasksState(t)[state]
      if (!option) return null
      const icon = h(
        NIcon,
        { color: option.color, size: 16, class: 'inline-flex' },
        { default: () => h(option.icon) }
      )
      if (option.isSpin) {
        return h(NSpin, { size: 16 }, { icon: () => icon })
      }
      return h(
        'span',
        {
          class: 'inline-flex items-center gap-1 text-[13px]'
        },
        [icon, h('span', { style: { color: option.color } }, option.desc)]
      )
    }

    const renderJobTypeTag = (jobType: string) => {
      if (!jobType) return null
      const isReplica =
        jobType === 'DATA_REPLICA' || jobType === 'whole_library_sync'
      return h(
        NTag,
        {
          size: 'small',
          type: isReplica ? 'info' : 'success',
          bordered: false,
          round: false
        },
        {
          default: () =>
            t(
              isReplica
                ? I18N_KEYS.SYNCHRONIZATION_DEFINITION.WHOLE_LIBRARY_SYNC
                : I18N_KEYS.SYNCHRONIZATION_DEFINITION.DATA_INTEGRATION
            )
        }
      )
    }

    const dropdownOptions = [
      {
        label: t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.DELETE),
        key: 'delete',
        props: {
          onClick: () => {
            if (
              window.confirm(
                t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.DELETE_CONFIRM)
              )
            ) {
              props.onDelete?.(props.task)
            }
          }
        }
      }
    ]

    return () => {
      const task = props.task
      const isRunning = props.loadingStates.get(task.id)

      return (
        <div class='bg-card border border-border rounded-card p-5 flex flex-col gap-2.5'>
          <div class='flex justify-between items-start gap-2'>
            <span
              class='font-semibold text-sm text-primary cursor-pointer leading-relaxed'
              onClick={() => props.onEdit?.(task)}
            >
              {task.name}
            </span>
            {renderJobTypeTag(task.jobType)}
          </div>

          <div>{renderState(task.status || task.jobStatus)}</div>

          {task.sourceConnectorType || task.sinkConnectorType ? (
            <div class='text-[13px] text-foreground'>
              {(task.sourceConnectorType || '?') +
                ' → ' +
                (getDatasourceDisplayName(
                  task.sinkDatasourceName || task.sinkConnectorType
                ) || '?')}
            </div>
          ) : null}

          <div class='flex gap-3 text-xs text-muted-foreground'>
            {task.createTime
              ? h('span', null, [
                  t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.CREATE_TIME) + ' ',
                  h(TimeAgo, { date: task.createTime })
                ])
              : null}
            {task.updateTime
              ? h('span', null, [
                  t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.UPDATE_TIME) + ' ',
                  h(TimeAgo, { date: task.updateTime })
                ])
              : null}
          </div>

          <div class='flex gap-2 mt-0.5'>
            <NButton size='small' tertiary onClick={() => props.onEdit?.(task)}>
              {{
                icon: () => h(NIcon, null, { default: () => h(EditOutlined) }),
                default: () => t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.EDIT)
              }}
            </NButton>
            <NButton
              size='small'
              type='primary'
              secondary
              loading={isRunning}
              disabled={isRunning}
              onClick={() => props.onRun?.(task)}
            >
              {{
                icon: () =>
                  h(NIcon, null, { default: () => h(PlayCircleOutlined) }),
                default: () => t(I18N_KEYS.SYNCHRONIZATION_DEFINITION.START)
              }}
            </NButton>
            <NDropdown
              trigger='click'
              options={dropdownOptions}
              placement='bottom-end'
            >
              <NButton size='small' tertiary>
                {{
                  icon: () =>
                    h(NIcon, null, { default: () => h(EllipsisOutlined) })
                }}
              </NButton>
            </NDropdown>
          </div>
        </div>
      )
    }
  }
})

export default TaskCard
