import { defineComponent, PropType, VNode } from 'vue'
import { NSkeleton, NIcon } from 'naive-ui'

const StatCard = defineComponent({
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '—' },
    color: { type: String, default: 'var(--color-info)' },
    loading: { type: Boolean, default: false },
    icon: { type: Object as PropType<VNode>, default: null },
    trend: { type: String, default: '' },
    trendText: { type: String, default: '' }
  },
  setup(props) {
    const trendColor = () => {
      if (!props.trend) return ''
      if (props.trend === 'up') return '#16A34A'
      if (props.trend === 'down') return '#DC2626'
      return '#6B7280'
    }
    const trendIcon = () => {
      if (props.trend === 'up') return 'M2.5 11.5L7 7l4 4 5.5-5.5'
      if (props.trend === 'down') return 'M2.5 6.5L7 11l4-4 5.5 5.5'
      return ''
    }

    return () => {
      if (props.loading) {
        return (
          <div class='flex flex-col gap-3 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm'>
            <div class='flex items-center justify-between'>
              <NSkeleton text class='w-[40%]' />
              <NSkeleton text class='w-8 h-8 rounded-lg' />
            </div>
            <NSkeleton text class='w-[60%]' />
          </div>
        )
      }

      return (
        <div
          class='bg-white rounded-xl border border-[#E5E7EB] flex flex-col justify-between p-5 hover:shadow-md transition-all min-w-0 flex-1'
          style={{ borderLeft: `4px solid ${props.color}` }}
        >
          <div class='flex items-start justify-between'>
            <div class='space-y-0.5'>
              <span class='text-xs font-semibold text-[#6B7280] tracking-wide'>
                {props.label}
              </span>
              <div class='text-3xl font-bold text-[#111827] tracking-tight leading-none pt-1'>
                {props.value}
              </div>
            </div>
            {props.icon && (
              <div
                class='w-9 h-9 rounded-lg flex items-center justify-center'
                style={{ background: `${props.color}15` }}
              >
                <NIcon size={18} color={props.color}>
                  {props.icon}
                </NIcon>
              </div>
            )}
          </div>
          {(props.trend || props.trendText) && (
            <div class='text-[11px] text-[#6B7280] flex items-center gap-1.5 mt-2'>
              {props.trend && (
                <span
                  class='font-semibold flex items-center gap-0.5'
                  style={{ color: trendColor() }}
                >
                  <svg
                    width='12'
                    height='12'
                    viewBox='0 0 14 14'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='2'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  >
                    <path d={trendIcon()} />
                  </svg>
                  {props.trend === 'up' ? '+' : ''}
                  {props.trendText || ''}
                </span>
              )}
              {props.trendText && (
                <span class='text-[#6B7280]'>{props.trendText}</span>
              )}
            </div>
          )}
        </div>
      )
    }
  }
})

export default StatCard
