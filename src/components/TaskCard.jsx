import { Badge, Card, Checkbox, Group, Stack, Text } from '@mantine/core'
import { encodeTick } from '../lib/ticks'

// One adult's tasks for the selected day: their anchor's daily tasks that apply
// today, followed by the weekly task if it lands today. All text from config.
function tasksForDay(anchor, dayIndex) {
  if (!anchor) return []
  const daily = (anchor.daily || []).filter(
    (t) => !t.retired && t.days.includes(dayIndex),
  )
  const weekly = (anchor.weekly || []).filter(
    (t) => !t.retired && t.day === dayIndex,
  )
  return [...daily, ...weekly]
}

export default function TaskCard({ person, anchor, dayIndex, ticks, onToggle }) {
  const tasks = tasksForDay(anchor, dayIndex)

  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="xs" mb="sm" wrap="nowrap">
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: person.color,
            flex: 'none',
          }}
        />
        <Text fw={700}>{person.name}</Text>
        {anchor ? (
          <Badge variant="light" color="gray" ml="auto">
            {anchor.label}
          </Badge>
        ) : null}
      </Group>

      {tasks.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nothing scheduled today.
        </Text>
      ) : (
        <Stack gap="xs">
          {tasks.map((task) => {
            const key = encodeTick(person.id, task.id, dayIndex)
            const done = !!ticks?.[key]?.done
            return (
              <Checkbox
                key={task.id}
                checked={done}
                label={task.label}
                size="md"
                onChange={(e) =>
                  onToggle(person.id, task.id, dayIndex, e.currentTarget.checked)
                }
              />
            )
          })}
        </Stack>
      )}
    </Card>
  )
}
