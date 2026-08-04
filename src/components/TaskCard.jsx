import { Badge, Card, Checkbox, Group, Stack, Text } from '@mantine/core'
import { encodeTick } from '../lib/ticks'
import { isSkipped } from '../lib/overrides'
import { isRoutineTask } from '../lib/steps'
import RoutineTask from './RoutineTask'

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

export default function TaskCard({
  person,
  anchor,
  dayIndex,
  week,
  onToggleTick,
  onToggleSkip,
}) {
  const tasks = tasksForDay(anchor, dayIndex)
  const ticks = week?.ticks

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
            const skipped = isSkipped(week, dayIndex, person.id, task.id)

            if (!skipped && isRoutineTask(task)) {
              return (
                <RoutineTask
                  key={task.id}
                  person={person}
                  anchor={anchor}
                  label={task.label}
                  dayIndex={dayIndex}
                  week={week}
                  onToggleTick={onToggleTick}
                />
              )
            }

            if (skipped) {
              return (
                <Group key={task.id} gap="xs" justify="space-between" wrap="nowrap">
                  <Text size="sm" c="dimmed" td="line-through">
                    {task.label}
                  </Text>
                  <Text
                    size="xs"
                    c="blue"
                    style={{ cursor: 'pointer', flex: 'none' }}
                    onClick={() => onToggleSkip(dayIndex, person.id, task.id, true)}
                  >
                    skipped · undo
                  </Text>
                </Group>
              )
            }

            return (
              <Group key={task.id} gap="xs" justify="space-between" wrap="nowrap">
                <Checkbox
                  checked={done}
                  label={task.label}
                  size="md"
                  onChange={(e) =>
                    onToggleTick(person.id, task.id, dayIndex, e.currentTarget.checked)
                  }
                />
                <Text
                  size="xs"
                  c="dimmed"
                  style={{ cursor: 'pointer', flex: 'none' }}
                  onClick={() => onToggleSkip(dayIndex, person.id, task.id, false)}
                >
                  skip
                </Text>
              </Group>
            )
          })}
        </Stack>
      )}
    </Card>
  )
}
