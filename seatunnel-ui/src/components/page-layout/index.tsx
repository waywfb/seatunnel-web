import { defineComponent } from 'vue'
import { NPageHeader } from 'naive-ui'

export default defineComponent({
  name: 'PageLayout',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    extra: { type: Object, default: undefined }
  },
  setup(props, { slots }) {
    return () => (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Page Header */}
        {props.title && (
          <div style={{ marginBottom: '8px' }}>
            <NPageHeader title={props.title} subtitle={props.description}>
              {props.extra && {
                extra: () => props.extra
              }}
            </NPageHeader>
          </div>
        )}

        {/* Tabs slot */}
        {slots.tabs && (
          <div style={{ marginBottom: '20px' }}>
            {slots.tabs()}
          </div>
        )}

        {/* Content slot */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {slots.default?.()}
        </div>
      </div>
    )
  }
})
