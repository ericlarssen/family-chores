import { Group, UnstyledButton } from '@mantine/core'
import { WEEKDAYS } from '../../lib/weeks'

// Compact Mon–Sun toggle strip for editing which days a daily task runs.
// `value` is an array of day indices (0 = Mon). Emits a new sorted array.
export default function DayToggles({ value, onChange }) {
  const set = new Set(value)
  return (
    <Group gap={4} wrap="nowrap">
      {WEEKDAYS.map((label, index) => {
        const on = set.has(index)
        return (
          <UnstyledButton
            key={index}
            onClick={() => {
              const next = new Set(set)
              if (on) next.delete(index)
              else next.add(index)
              onChange([...next].sort((a, b) => a - b))
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: on ? 'var(--mantine-primary-color-filled)' : 'transparent',
              color: on ? '#fff' : 'var(--mantine-color-dimmed)',
              border: '1px solid var(--mantine-color-default-border)',
            }}
          >
            {label[0]}
          </UnstyledButton>
        )
      })}
    </Group>
  )
}
