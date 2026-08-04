import {
  Alert,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core'
import { useConfig } from '../data/useConfig'
import { useHousehold } from '../data/useHousehold'
import { useWeek } from '../data/useWeek'
import { useHashDate } from '../data/useHashDate'
import { addDays, dayIndexOf, longDayLabel, mondayOf, todayIso } from '../lib/weeks'
import { effectiveRoles, hasSwap } from '../lib/overrides'
import DaySelector from '../components/DaySelector'
import TaskCard from '../components/TaskCard'

// Mobile-first, day-focused view. One day at a time, each adult's tasks as a
// tappable checklist; navigate days with a calendar. Widens to two columns on
// tablet+ via SimpleGrid.
export default function WeekView({ onBack }) {
  const { config, loading: configLoading } = useConfig()
  const { timezone } = useHousehold()

  const today = todayIso(timezone)
  const { dateIso, goToDate } = useHashDate(today)

  const weekId = mondayOf(dateIso)
  const { week, loading: weekLoading, toggleTick, toggleSwap, toggleSkip } =
    useWeek(weekId, config)

  if (configLoading) {
    return <Center h="100dvh"><Loader /></Center>
  }
  if (!config) {
    return (
      <Center h="100dvh" p="md">
        <Text c="dimmed">No config yet — run the seed script.</Text>
      </Center>
    )
  }

  const dayIndex = dayIndexOf(dateIso)
  const adults = (config.people || []).filter((p) => p.type === 'adult')
  const cleanerVisit = week?.cleanerVisit || null

  return (
    <Container size="sm" py="md" px="sm">
      <Group justify="space-between" mb="md">
        <Button variant="subtle" size="compact-sm" onClick={onBack}>
          ← Everyone
        </Button>
        <Title order={4}>This week</Title>
      </Group>

      <DaySelector dateIso={dateIso} todayIso={today} onGoToDate={goToDate} />

      {cleanerVisit === dateIso ? (
        <Alert color="yellow" mt="md" title="🧽 Cleaner visits today" />
      ) : cleanerVisit === addDays(dateIso, 1) ? (
        <Alert color="yellow" mt="md" title="🧽 Cleaner comes tomorrow">
          Clear the decks tonight.
        </Alert>
      ) : null}

      <Group justify="space-between" mt="lg" mb="xs">
        <Group gap="xs">
          <Text fw={600}>{longDayLabel(dateIso)}</Text>
          {week && hasSwap(week, dayIndex) ? (
            <Badge color="grape" variant="light">
              Anchors swapped
            </Badge>
          ) : null}
        </Group>
        {week ? (
          <Button
            variant="subtle"
            size="compact-sm"
            color="grape"
            onClick={() => toggleSwap(dayIndex, hasSwap(week, dayIndex))}
          >
            {hasSwap(week, dayIndex) ? 'Undo swap' : 'Swap tonight'}
          </Button>
        ) : null}
      </Group>

      {weekLoading || !week ? (
        <Center py="xl"><Loader size="sm" /></Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {adults.map((person) => {
            const roles = effectiveRoles(week, dayIndex)
            const anchorId = roles[person.id]
            const anchor = anchorId ? config.anchors?.[anchorId] : null
            return (
              <TaskCard
                key={person.id}
                person={person}
                anchor={anchor}
                dayIndex={dayIndex}
                week={week}
                onToggleTick={toggleTick}
                onToggleSkip={toggleSkip}
              />
            )
          })}
        </SimpleGrid>
      )}
    </Container>
  )
}
