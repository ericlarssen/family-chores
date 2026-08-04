import { useState } from 'react'
import {
  Badge,
  Card,
  Checkbox,
  Collapse,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { encodeTick } from '../lib/ticks'
import { anchorSteps } from '../lib/steps'

// An anchor routine rendered as an expandable checklist: a header showing the
// routine label + (done/total) progress, which taps open to reveal each step as
// its own checkbox. "Done" is derived — the header ticks itself only when every
// step is checked.
export default function RoutineTask({
  person,
  anchor,
  label,
  dayIndex,
  week,
  onToggleTick,
}) {
  const [open, setOpen] = useState(false)
  const steps = anchorSteps(anchor)
  const doneCount = steps.filter(
    (s) => week?.ticks?.[encodeTick(person.id, s.id, dayIndex)]?.done,
  ).length
  const allDone = steps.length > 0 && doneCount === steps.length

  return (
    <Card withBorder radius="md" padding="xs">
      <UnstyledButton w="100%" onClick={() => setOpen((o) => !o)}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Checkbox checked={allDone} readOnly tabIndex={-1} size="md" color="teal" />
            <Text fw={500}>{label}</Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Badge variant="light" color={allDone ? 'teal' : 'gray'}>
              {doneCount}/{steps.length}
            </Badge>
            <Text c="dimmed" size="sm">
              {open ? '▲' : '▼'}
            </Text>
          </Group>
        </Group>
      </UnstyledButton>

      <Collapse in={open}>
        {anchor?.when ? (
          <Text size="xs" c="dimmed" mt="xs" pl="lg">
            {anchor.when}
          </Text>
        ) : null}
        <Stack gap={8} mt="xs" pl="lg">
          {steps.map((step) => {
            const done = !!week?.ticks?.[encodeTick(person.id, step.id, dayIndex)]?.done
            return (
              <Checkbox
                key={step.id}
                size="sm"
                checked={done}
                label={step.label}
                onChange={(e) =>
                  onToggleTick(person.id, step.id, dayIndex, e.currentTarget.checked)
                }
              />
            )
          })}
        </Stack>
      </Collapse>
    </Card>
  )
}
