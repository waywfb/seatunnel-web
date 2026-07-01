import { defineComponent, ref, onMounted, PropType } from 'vue'
import { formatDistanceToNow, parseISO, format as dateFormat } from 'date-fns'

const TimeAgo = defineComponent({
  name: 'TimeAgo',
  props: {
    date: { type: [String, Number, Date] as PropType<string | number | Date>, required: true },
    interval: { type: Number, default: 60000 },
    format: { type: String, default: 'yyyy-MM-dd HH:mm' }
  },
  setup(props) {
    const text = ref('')

    const update = () => {
      try {
        if (!props.date) { text.value = '—'; return }
        const date = typeof props.date === 'string' ? parseISO(props.date) : new Date(props.date)
        if (isNaN(date.getTime())) { text.value = String(props.date); return }
        text.value = props.format
          ? dateFormat(date, props.format)
          : formatDistanceToNow(date, { addSuffix: true })
      } catch {
        text.value = String(props.date)
      }
    }

    onMounted(() => {
      update()
    })

    return { text }
  },
  render() {
    return <span style={{ color: 'var(--color-muted-foreground)', fontSize: '13px' }}>{this.text}</span>
  }
})

export default TimeAgo
