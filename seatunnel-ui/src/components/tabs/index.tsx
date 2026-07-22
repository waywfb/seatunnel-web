import { defineComponent, PropType, computed } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'

export interface TabItem {
  name: string
  label: string
  count?: number
  disabled?: boolean
}

export default defineComponent({
  name: 'STabs',
  props: {
    value: { type: String, default: undefined },
    tabs: { type: Array as PropType<TabItem[]>, required: true },
    type: {
      type: String as PropType<
        | 'line'
        | 'segment'
        | 'bar'
        | 'card'
        | 'border-card'
        | 'button-card'
        | 'button'
      >,
      default: 'line'
    },
    size: {
      type: String as PropType<'small' | 'medium' | 'large'>,
      default: 'small'
    },
    animated: { type: Boolean, default: false },
    contentStyle: { type: [String, Object], default: undefined }
  },
  emits: ['update:value'],
  setup(props, { slots, emit }) {
    const activeKey = computed({
      get: () => props.value ?? props.tabs[0]?.name,
      set: (val: string) => emit('update:value', val)
    })

    return () => (
      <div>
        <NTabs
          value={activeKey.value}
          onUpdate:value={(val: string) => emit('update:value', val)}
          type={props.type}
          size={props.size}
          animated={props.animated}
          style={props.contentStyle}
        >
          {props.tabs.map((tab) => (
            <NTabPane key={tab.name} name={tab.name} disabled={tab.disabled}>
              {{
                default: () => slots[`pane:${tab.name}`]?.(),
                tab: () =>
                  slots[`tab:${tab.name}`]?.(tab) ?? (
                    <span>
                      {tab.label}
                      {tab.count != null && (
                        <span
                          style={{
                            fontSize: '10px',
                            background: '#e2e8f0',
                            color: '#475569',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            marginLeft: '4px'
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </span>
                  )
              }}
            </NTabPane>
          ))}
        </NTabs>
      </div>
    )
  }
})
