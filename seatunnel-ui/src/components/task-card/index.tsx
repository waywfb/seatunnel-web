import { defineComponent, PropType, h } from 'vue'
import { NTag, NButton, NIcon, NDropdown, NSpace, NSpin } from 'naive-ui'
import {
  EditOutlined,
  PlayCircleOutlined,
  EllipsisOutlined
} from '@vicons/antd'
import { tasksState } from '@/common/common'
import { useI18n } from 'vue-i18n'
import TimeAgo from '@/components/time-ago'

const TaskCard = defineComponent({
  name: 'TaskCard',
  props: {
    task: { type: Object as PropType<any>, required: true },
    onEdit: { type: Function as PropType<(task: any) => void>, default: null },
    onRun: { type: Function as PropType<(task: any) => void>, default: null },
    onDelete: { type: Function as PropType<(task: any) => void>, default: null },
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
        { color: option.color, size: 16, style: { display: 'inline-flex' } },
        { default: () => h(option.icon) }
      )
      if (option.isSpin) {
        return h(NSpin, { size: 16 }, { icon: () => icon })
      }
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px'
          }
        },
        [
          icon,
          h(
            'span',
            { style: { color: option.color } },
            option.desc
          )
        ]
      )
    }

    const renderJobTypeTag = (jobType: string) => {
      if (!jobType) return null
      const isReplica =
        jobType === 'DATA_REPLICA' || jobType === 'whole_library_sync'
      return h(NTag, {
        size: 'small',
        type: isReplica ? 'info' : 'success',
        bordered: false,
        round: false
      }, {
        default: () =>
          t(
            isReplica
              ? 'project.synchronization_definition.whole_library_sync'
              : 'project.synchronization_definition.data_integration'
          )
      })
    }

    const dropdownOptions = [
      {
        label: t('project.synchronization_definition.delete'),
        key: 'delete',
        props: {
          onClick: () => {
            if (
              window.confirm(
                t('project.synchronization_definition.delete_confirm')
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
        <div
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: '14px',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                lineHeight: 1.4
              }}
              onClick={() => props.onEdit?.(task)}
            >
              {task.name}
            </span>
            {renderJobTypeTag(task.jobType)}
          </div>

          <div>{renderState(task.status || task.jobStatus)}</div>

          {task.sourceConnectorType || task.sinkConnectorType ? (
            <div style={{ fontSize: '13px', color: 'var(--color-foreground)' }}>
              {(task.sourceConnectorType || '?') + ' → ' + (task.sinkConnectorType || '?')}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--color-muted-foreground)'
            }}
          >
            {task.createTime
              ? h(
                  'span',
                  null,
                  [
                    t('project.synchronization_definition.create_time') + ' ',
                    h(TimeAgo, { date: task.createTime })
                  ]
              )
              : null}
            {task.updateTime
              ? h(
                  'span',
                  null,
                  [
                    t('project.synchronization_definition.update_time') + ' ',
                    h(TimeAgo, { date: task.updateTime })
                  ]
              )
              : null}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <NButton size='small' tertiary onClick={() => props.onEdit?.(task)}>
              {{
                icon: () =>
                  h(NIcon, null, { default: () => h(EditOutlined) }),
                default: () => t('project.synchronization_definition.edit')
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
                default: () => t('project.synchronization_definition.start')
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
