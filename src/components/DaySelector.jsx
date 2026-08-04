import { ActionIcon, Button, Group, Stack } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { addDays, mondayOf, weekRangeLabel } from '../lib/weeks'

// Day navigation: a calendar picker (off-the-shelf, @mantine/dates) flanked by
// prev/next-day arrows, with a "Today" shortcut. Mantine 8 date components use
// `YYYY-MM-DD` string values, which match our day ids directly.
export default function DaySelector({ dateIso, todayIso, onGoToDate }) {
  const isToday = dateIso === todayIso

  return (
    <Stack gap={4}>
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Previous day"
          onClick={() => onGoToDate(addDays(dateIso, -1))}
        >
          ‹
        </ActionIcon>

        <DatePickerInput
          style={{ flex: 1 }}
          size="md"
          valueFormat="ddd, MMM D"
          firstDayOfWeek={1}
          value={dateIso}
          onChange={(v) => v && onGoToDate(v)}
          popoverProps={{ withinPortal: true }}
        />

        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Next day"
          onClick={() => onGoToDate(addDays(dateIso, 1))}
        >
          ›
        </ActionIcon>
      </Group>

      <Group justify="space-between">
        <Button
          variant="subtle"
          size="compact-xs"
          disabled={isToday}
          onClick={() => onGoToDate(todayIso)}
        >
          {isToday ? 'Today' : 'Jump to today'}
        </Button>
        <span style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>
          Week of {weekRangeLabel(mondayOf(dateIso))}
        </span>
      </Group>
    </Stack>
  )
}
