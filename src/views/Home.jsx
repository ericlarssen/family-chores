import { Center, Loader, Text } from '@mantine/core'
import { useConfig } from '../data/useConfig'
import { useHousehold } from '../data/useHousehold'
import { useProfile } from '../data/useProfile'
import ProfilePicker from '../components/ProfilePicker'
import PersonDay from './PersonDay'
import WeekView from './WeekView'
import AdminEditor from './AdminEditor'

// Top-level kiosk routing. A parent stays signed in; `selection` (persisted in
// localStorage) decides what shows: the picker, one person's day, or the
// two-parent week overview. So the fridge tablet reopens exactly where it was.
export default function Home({ profile, onSignOut }) {
  const { config, loading } = useConfig()
  const { timezone } = useHousehold()
  const { selection, select } = useProfile()

  if (loading) {
    return <Center h="100dvh"><Loader /></Center>
  }
  if (!config) {
    return (
      <Center h="100dvh" p="md">
        <Text c="dimmed">No config yet — run the seed script.</Text>
      </Center>
    )
  }

  const back = () => select(null)

  if (selection === 'overview') {
    return <WeekView onBack={back} />
  }

  if (selection === 'admin') {
    return <AdminEditor config={config} account={profile} onBack={back} />
  }

  if (selection) {
    const person = (config.people || []).find((p) => p.id === selection)
    if (person) {
      return <PersonDay person={person} config={config} onBack={back} />
    }
    // Stale selection (person removed from config) — fall back to the picker.
  }

  return (
    <ProfilePicker
      config={config}
      timezone={timezone}
      account={profile}
      onSelect={select}
      onSignOut={onSignOut}
    />
  )
}
