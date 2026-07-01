import { defineComponent, PropType, VNode } from 'vue'
import { NSkeleton } from 'naive-ui'

const StatCard = defineComponent({
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '—' },
    color: { type: String, default: 'var(--color-primary)' },
    loading: { type: Boolean, default: false },
    icon: { type: Object as PropType<VNode>, default: null }
  },
  setup(props) {
    return () => {
      if (props.loading) {
        return (
          <div class='flex flex-col gap-2 p-5 rounded-card border border-border bg-card'>
            <NSkeleton text class='w-[40%]' />
            <NSkeleton text class='w-[60%]' />
          </div>
        )
      }

      return (
        <div class='flex items-center gap-4 p-5 rounded-card border border-border bg-card min-w-0 flex-1'>
          <div
            class='w-1 h-10 rounded-sm flex-shrink-0'
            style={{ background: props.color }}
          />
          <div class='flex flex-col gap-0.5 min-w-0'>
            <span class='text-xl font-semibold text-foreground leading-tight'>
              {props.value}
            </span>
            <span class='text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis'>
              {props.label}
            </span>
          </div>
        </div>
      )
    }
  }
})

export default StatCard
