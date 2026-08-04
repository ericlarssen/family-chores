import { useEffect, useRef } from 'react'
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useHousehold } from '../data/useHousehold'
import { useHashDate } from '../data/useHashDate'
import { useWeek } from '../data/useWeek'
import {
  addDays,
  dayIndexOf,
  longDayLabel,
  mondayOf,
  todayIso,
} from '../lib/weeks'
import { encodeTick } from '../lib/ticks'
import { effectiveRoles, isSkipped } from '../lib/overrides'
import { anchorSteps, isRoutineTask, routineDone } from '../lib/steps'
import { celebrate } from '../lib/celebrate'
import RoutineTask from '../components/RoutineTask'

// A kid's tasks for the day: their everyday tasks plus the day-specific job.
function kidTasks(config, person, dayIndex) {
  const ct = config.childTasks?.[person.id]
  if (!ct) return []
  const daily = (ct.daily || [])
    .filter((t) => !t.retired)
    .map((t) => ({ id: t.id, label: t.label, icon: t.icon || '✅' }))
  const job = (ct.byDay || []).find((j) => j.day === dayIndex && !j.retired)
  return job ? [...daily, { id: job.id, label: job.label, icon: '⭐' }] : daily
}

// An adult's anchor tasks for the day, honoring a day's swap override.
function adultTasks(config, week, person, dayIndex) {
  const anchor = config.anchors?.[effectiveRoles(week, dayIndex)[person.id]]
  if (!anchor) return []
  const daily = (anchor.daily || [])
    .filter((t) => !t.retired && t.days.includes(dayIndex))
    .map((t) => ({ id: t.id, label: t.label }))
  const weekly = (anchor.weekly || [])
    .filter((t) => !t.retired && t.day === dayIndex)
    .map((t) => ({ id: t.id, label: t.label }))
  return [...daily, ...weekly]
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// A whole-card tappable task row — a big touch target for small fingers.
function TaskRow({ task, done, big, onToggle }) {
  return (
    <UnstyledButton w="100%" onClick={() => onToggle(!done)}>
      <Card
        withBorder
        radius="md"
        padding={big ? 'md' : 'sm'}
        bg={done ? 'var(--mantine-color-teal-0)' : undefined}
      >
        <Group gap="md" wrap="nowrap">
          <Checkbox
            checked={done}
            readOnly
            tabIndex={-1}
            size={big ? 'xl' : 'md'}
            color="teal"
          />
          {task.icon ? (
            <Text fz={big ? 30 : 22} lh={1}>
              {task.icon}
            </Text>
          ) : null}
          <Text fw={big ? 600 : 500} fz={big ? 'lg' : 'md'}>
            {task.label}
          </Text>
        </Group>
      </Card>
    </UnstyledButton>
  )
}

export default function PersonDay({ person, config, onBack }) {
  const { timezone } = useHousehold()
  const today = todayIso(timezone)
  const { dateIso, goToDate } = useHashDate(today)
  const weekId = mondayOf(dateIso)
  const dayIndex = dayIndexOf(dateIso)
  const { week, loading, toggleTick } = useWeek(weekId, config)

  const isKid = person.type === 'child'
  const tasks = (
    isKid
      ? kidTasks(config, person, dayIndex)
      : adultTasks(config, week, person, dayIndex)
  ).filter((t) => !isSkipped(week, dayIndex, person.id, t.id))

  // The adult holding the (possibly swapped) anchor this day — for its steps.
  const anchor = isKid
    ? null
    : config.anchors?.[effectiveRoles(week, dayIndex)[person.id]]

  // A routine task is done only when all its steps are; everything else is a
  // single tick.
  const isTaskDone = (t) =>
    !isKid && isRoutineTask(t)
      ? routineDone(week, person.id, dayIndex, anchorSteps(anchor))
      : !!week?.ticks?.[encodeTick(person.id, t.id, dayIndex)]?.done

  const doneCount = tasks.filter(isTaskDone).length
  const allDone = tasks.length > 0 && doneCount === tasks.length
  const isToday = dateIso === today

  // Confetti on the last check of the day. Fire only on a genuine not-done →
  // done transition for the same person+day — never on load of an already-done
  // day or when navigating between days.
  const celebratedRef = useRef({ key: null, done: null })
  useEffect(() => {
    if (loading || !week) return
    const key = `${person.id}:${dateIso}`
    const prev = celebratedRef.current
    if (prev.key === key && prev.done === false && allDone) {
      celebrate()
    }
    celebratedRef.current = { key, done: allDone }
  }, [person.id, dateIso, allDone, loading, week])

  return (
    <Container size="xs" py="md" px="md">
      <Group justify="space-between" mb="md">
        <Button variant="subtle" size="compact-sm" onClick={onBack}>
          ← Everyone
        </Button>
        <Group gap={4} wrap="nowrap">
          <ActionIcon
            variant="default"
            aria-label="Previous day"
            onClick={() => goToDate(addDays(dateIso, -1))}
          >
            ‹
          </ActionIcon>
          <Button
            variant={isToday ? 'light' : 'filled'}
            size="compact-sm"
            onClick={() => goToDate(today)}
          >
            {isToday ? 'Today' : 'Go to today'}
          </Button>
          <ActionIcon
            variant="default"
            aria-label="Next day"
            onClick={() => goToDate(addDays(dateIso, 1))}
          >
            ›
          </ActionIcon>
        </Group>
      </Group>

      <Group gap="sm" mb="xs">
        <Avatar
          size={48}
          radius={48}
          styles={{ placeholder: { background: person.color, color: '#fff' } }}
        >
          {initials(person.name)}
        </Avatar>
        <div>
          <Text fw={700} fz="xl">
            {person.name}
          </Text>
          <Text size="sm" c="dimmed">
            {longDayLabel(dateIso)}
          </Text>
        </div>
      </Group>

      {tasks.length > 0 ? (
        <Progress
          value={(doneCount / tasks.length) * 100}
          color="teal"
          size="sm"
          radius="xl"
          mb="md"
          mt="xs"
        />
      ) : null}

      {loading || !week ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : tasks.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nothing scheduled today.
        </Text>
      ) : (
        <Stack gap="sm">
          {allDone ? (
            <Text ta="center" fz="lg" fw={700} c="teal">
              🎉 All done!
            </Text>
          ) : null}
          {tasks.map((task) =>
            !isKid && isRoutineTask(task) ? (
              <RoutineTask
                key={task.id}
                person={person}
                anchor={anchor}
                label={task.label}
                dayIndex={dayIndex}
                week={week}
                onToggleTick={toggleTick}
              />
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                big={isKid}
                done={!!week.ticks?.[encodeTick(person.id, task.id, dayIndex)]?.done}
                onToggle={(next) => toggleTick(person.id, task.id, dayIndex, next)}
              />
            ),
          )}
        </Stack>
      )}
    </Container>
  )
}
