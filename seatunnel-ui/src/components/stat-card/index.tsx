import { defineComponent, PropType, VNode, h } from 'vue'
import { NSkeleton, NIcon } from 'naive-ui'

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px 20px',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
            }}
          >
            <NSkeleton text style={{ width: '40%' }} />
            <NSkeleton text style={{ width: '60%' }} />
          </div>
        )
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-card)',
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              width: '4px',
              height: '40px',
              borderRadius: '2px',
              background: props.color,
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span
              style={{
                fontSize: 'var(--font-page-title)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-foreground)',
                lineHeight: 1.2,
              }}
            >
              {props.value}
            </span>
            <span
              style={{
                fontSize: 'var(--font-caption)',
                color: 'var(--color-muted-foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {props.label}
            </span>
          </div>
        </div>
      )
    }
  }
})

export default StatCard
