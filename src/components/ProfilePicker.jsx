import {
  Avatar,
  Card,
  Container,
  Group,
  Menu,
  SimpleGrid,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { rolesForWeek } from '../lib/rotation'
import { currentWeekId } from '../lib/weeks'

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Kiosk landing: tap a face to open that person's day. A parent stays signed in;
// the picker is how kids (and adults) get to their own list.
export default function ProfilePicker({ config, timezone, account, onSelect, onSignOut }) {
  const people = config.people || []
  const roles = rolesForWeek(config, currentWeekId(timezone))

  return (
    <Container size="sm" py="xl" px="md">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Who's here?</Title>
        <Menu position="bottom-end" withArrow>
          <Menu.Target>
            <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }}>
              {account?.displayName || account?.email} ▾
            </Text>
          </Menu.Target>
          <Menu.Dropdown>
            {account?.role === 'admin' ? (
              <Menu.Item onClick={() => onSelect('admin')}>Edit chores</Menu.Item>
            ) : null}
            <Menu.Item onClick={onSignOut}>Sign out</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="lg">
        {people.map((person) => {
          const subtitle =
            person.type === 'adult'
              ? config.anchors?.[roles[person.id]]?.label
              : `Age ${person.age}`
          return (
            <UnstyledButton key={person.id} onClick={() => onSelect(person.id)}>
              <Card withBorder radius="lg" padding="lg" ta="center">
                <Avatar
                  size={72}
                  radius={72}
                  mx="auto"
                  styles={{ placeholder: { background: person.color, color: '#fff' } }}
                >
                  {initials(person.name)}
                </Avatar>
                <Text className="display" fw={600} fz={20} mt="sm">
                  {person.name}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {subtitle}
                </Text>
              </Card>
            </UnstyledButton>
          )
        })}

        <UnstyledButton onClick={() => onSelect('overview')}>
          <Card withBorder radius="lg" padding="lg" ta="center" h="100%">
            <Avatar size={72} radius={72} mx="auto" color="gray">
              📋
            </Avatar>
            <Text className="display" fw={600} fz={20} mt="sm">
              This week
            </Text>
            <Text size="xs" c="dimmed">
              Both parents
            </Text>
          </Card>
        </UnstyledButton>
      </SimpleGrid>
    </Container>
  )
}
