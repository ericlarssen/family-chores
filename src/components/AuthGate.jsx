import { Button, Loader, Stack, Text, Title } from '@mantine/core'
import { useAuth } from '../data/useAuth'

// Gates the app on Google sign-in + allowlist membership.
//   signed out      → one Google button
//   not allowlisted → a plain "ask to be added" message
//   allowlisted     → children({ profile, user, signOut })
export default function AuthGate({ children }) {
  const { status, user, profile, signIn, signOut } = useAuth()

  if (status === 'loading') {
    return (
      <div className="full-center">
        <Loader />
      </div>
    )
  }

  if (status === 'signed-out') {
    return (
      <div className="full-center">
        <Stack align="center" gap="md" maw={360}>
          <Title order={1}>Family Chores</Title>
          <Text c="dimmed">Sign in to see this week.</Text>
          <Button size="md" onClick={signIn}>
            Sign in with Google
          </Button>
        </Stack>
      </div>
    )
  }

  if (status === 'not-allowed') {
    return (
      <div className="full-center">
        <Stack align="center" gap="md" maw={420}>
          <Title order={2}>Not on the list yet</Title>
          <Text c="dimmed" ta="center">
            You're signed in as <b>{user?.email}</b>, but this account hasn't been
            added to the household. Ask an admin to add you, then sign in again.
          </Text>
          <Button variant="default" onClick={signOut}>
            Sign out
          </Button>
        </Stack>
      </div>
    )
  }

  return children({ profile, user, signOut })
}
