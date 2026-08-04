import { useState } from 'react'
import {
  Accordion,
  Button,
  Card,
  ColorInput,
  Container,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { HOUSEHOLD_ID, db } from '../firebase'
import { WEEKDAYS } from '../lib/weeks'
import DayToggles from '../components/admin/DayToggles'

const DAY_OPTIONS = WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))

function newId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`
}

function RetireButton({ retired, onToggle }) {
  return (
    <Button
      variant="subtle"
      size="compact-xs"
      color={retired ? 'gray' : 'red'}
      onClick={onToggle}
    >
      {retired ? 'Restore' : 'Retire'}
    </Button>
  )
}

export default function AdminEditor({ config, account, onBack }) {
  const [draft, setDraft] = useState(() => structuredClone(config))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  if (account?.role !== 'admin') {
    return (
      <Container size="sm" py="xl" px="md">
        <Title order={3} mb="md">
          Admins only
        </Title>
        <Text c="dimmed" mb="lg">
          Editing chores is limited to household admins.
        </Text>
        <Button variant="default" onClick={onBack}>
          ← Back
        </Button>
      </Container>
    )
  }

  // Immutable update via a structured-clone mutator — config is tiny, so cloning
  // per edit is cheap and keeps every field independently editable.
  const update = (mutator) => {
    setDraft((prev) => {
      const next = structuredClone(prev)
      mutator(next)
      return next
    })
    setDirty(true)
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const newVersion = (config.version || 0) + 1
      const next = { ...draft, version: newVersion }
      const batch = writeBatch(db)
      batch.set(doc(db, `households/${HOUSEHOLD_ID}/config/current`), next)
      batch.set(
        doc(db, `households/${HOUSEHOLD_ID}/configVersions/${newVersion}`),
        { ...next, snapshotAt: serverTimestamp() },
      )
      await batch.commit()
      setDirty(false)
      setSaved(true)
    } catch (err) {
      console.error('[admin] save failed', err)
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const adults = draft.people.filter((p) => p.type === 'adult')
  const kids = draft.people.filter((p) => p.type === 'child')
  const eveningStarter =
    Object.entries(draft.rotation.start).find(([, a]) => a === 'evening')?.[0] ||
    adults[0]?.id

  return (
    <Container size="sm" py="md" px="md" pb={96}>
      <Group justify="space-between" mb="md">
        <Button variant="subtle" size="compact-sm" onClick={onBack}>
          ← Back
        </Button>
        <Title order={4}>Edit chores</Title>
      </Group>

      <Accordion variant="separated" multiple>
        {/* People ------------------------------------------------------- */}
        <Accordion.Item value="people">
          <Accordion.Control>People</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              {draft.people.map((p, i) => (
                <Group key={p.id} gap="xs" wrap="nowrap">
                  <ColorInput
                    value={p.color}
                    onChange={(c) => update((d) => (d.people[i].color = c))}
                    w={48}
                    withPicker={false}
                    withEyeDropper={false}
                    format="hex"
                  />
                  <TextInput
                    style={{ flex: 1 }}
                    value={p.name}
                    onChange={(e) =>
                      update((d) => (d.people[i].name = e.currentTarget.value))
                    }
                  />
                  {p.type === 'child' ? (
                    <NumberInput
                      w={70}
                      min={1}
                      value={p.age}
                      onChange={(v) => update((d) => (d.people[i].age = Number(v)))}
                    />
                  ) : null}
                </Group>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Anchors ------------------------------------------------------ */}
        {Object.keys(draft.anchors).map((key) => {
          const anchor = draft.anchors[key]
          return (
            <Accordion.Item key={key} value={`anchor-${key}`}>
              <Accordion.Control>{anchor.label}</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <TextInput
                    label="Anchor name"
                    value={anchor.label}
                    onChange={(e) =>
                      update((d) => (d.anchors[key].label = e.currentTarget.value))
                    }
                  />

                  <div>
                    <Text fw={600} size="sm" mb="xs">
                      Every-day tasks
                    </Text>
                    <Stack gap="xs">
                      {anchor.daily.map((t, j) => (
                        <Card key={t.id} withBorder padding="xs" opacity={t.retired ? 0.5 : 1}>
                          <Group gap="xs" wrap="nowrap" mb={6}>
                            <TextInput
                              style={{ flex: 1 }}
                              size="xs"
                              value={t.label}
                              onChange={(e) =>
                                update(
                                  (d) =>
                                    (d.anchors[key].daily[j].label =
                                      e.currentTarget.value),
                                )
                              }
                            />
                            <RetireButton
                              retired={t.retired}
                              onToggle={() =>
                                update(
                                  (d) =>
                                    (d.anchors[key].daily[j].retired = !t.retired),
                                )
                              }
                            />
                          </Group>
                          <DayToggles
                            value={t.days}
                            onChange={(days) =>
                              update((d) => (d.anchors[key].daily[j].days = days))
                            }
                          />
                        </Card>
                      ))}
                    </Stack>
                    <Button
                      variant="light"
                      size="compact-sm"
                      mt="xs"
                      onClick={() =>
                        update((d) =>
                          d.anchors[key].daily.push({
                            id: newId(`${key}-d`),
                            label: 'New task',
                            days: [0, 1, 2, 3, 4, 5, 6],
                          }),
                        )
                      }
                    >
                      + Every-day task
                    </Button>
                  </div>

                  <div>
                    <Text fw={600} size="sm" mb="xs">
                      Weekly tasks
                    </Text>
                    <Stack gap="xs">
                      {anchor.weekly.map((t, j) => (
                        <Group key={t.id} gap="xs" wrap="nowrap" opacity={t.retired ? 0.5 : 1}>
                          <Select
                            w={90}
                            size="xs"
                            data={DAY_OPTIONS}
                            value={String(t.day)}
                            onChange={(v) =>
                              update(
                                (d) => (d.anchors[key].weekly[j].day = Number(v)),
                              )
                            }
                          />
                          <TextInput
                            style={{ flex: 1 }}
                            size="xs"
                            value={t.label}
                            onChange={(e) =>
                              update(
                                (d) =>
                                  (d.anchors[key].weekly[j].label =
                                    e.currentTarget.value),
                              )
                            }
                          />
                          <RetireButton
                            retired={t.retired}
                            onToggle={() =>
                              update(
                                (d) =>
                                  (d.anchors[key].weekly[j].retired = !t.retired),
                              )
                            }
                          />
                        </Group>
                      ))}
                    </Stack>
                    <Button
                      variant="light"
                      size="compact-sm"
                      mt="xs"
                      onClick={() =>
                        update((d) =>
                          d.anchors[key].weekly.push({
                            id: newId(`${key}-w`),
                            day: 0,
                            label: 'New weekly task',
                          }),
                        )
                      }
                    >
                      + Weekly task
                    </Button>
                  </div>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )
        })}

        {/* Child tasks -------------------------------------------------- */}
        {kids.map((kid) => {
          const ct = draft.childTasks?.[kid.id]
          if (!ct) return null
          return (
            <Accordion.Item key={kid.id} value={`child-${kid.id}`}>
              <Accordion.Control>{kid.name}'s tasks</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <div>
                    <Text fw={600} size="sm" mb="xs">
                      Every day
                    </Text>
                    <Stack gap="xs">
                      {ct.daily.map((t, j) => (
                        <Group key={t.id} gap="xs" wrap="nowrap" opacity={t.retired ? 0.5 : 1}>
                          <TextInput
                            w={52}
                            size="xs"
                            value={t.icon || ''}
                            onChange={(e) =>
                              update(
                                (d) =>
                                  (d.childTasks[kid.id].daily[j].icon =
                                    e.currentTarget.value),
                              )
                            }
                          />
                          <TextInput
                            style={{ flex: 1 }}
                            size="xs"
                            value={t.label}
                            onChange={(e) =>
                              update(
                                (d) =>
                                  (d.childTasks[kid.id].daily[j].label =
                                    e.currentTarget.value),
                              )
                            }
                          />
                          <RetireButton
                            retired={t.retired}
                            onToggle={() =>
                              update(
                                (d) =>
                                  (d.childTasks[kid.id].daily[j].retired =
                                    !t.retired),
                              )
                            }
                          />
                        </Group>
                      ))}
                    </Stack>
                    <Button
                      variant="light"
                      size="compact-sm"
                      mt="xs"
                      onClick={() =>
                        update((d) =>
                          d.childTasks[kid.id].daily.push({
                            id: newId(`${kid.id}-d`),
                            icon: '✅',
                            label: 'New task',
                          }),
                        )
                      }
                    >
                      + Every-day task
                    </Button>
                  </div>

                  <div>
                    <Text fw={600} size="sm" mb="xs">
                      Day jobs
                    </Text>
                    <Stack gap="xs">
                      {ct.byDay.map((t, j) => (
                        <Group key={t.id} gap="xs" wrap="nowrap" opacity={t.retired ? 0.5 : 1}>
                          <Select
                            w={90}
                            size="xs"
                            data={DAY_OPTIONS}
                            value={String(t.day)}
                            onChange={(v) =>
                              update(
                                (d) =>
                                  (d.childTasks[kid.id].byDay[j].day = Number(v)),
                              )
                            }
                          />
                          <TextInput
                            style={{ flex: 1 }}
                            size="xs"
                            value={t.label}
                            onChange={(e) =>
                              update(
                                (d) =>
                                  (d.childTasks[kid.id].byDay[j].label =
                                    e.currentTarget.value),
                              )
                            }
                          />
                          <RetireButton
                            retired={t.retired}
                            onToggle={() =>
                              update(
                                (d) =>
                                  (d.childTasks[kid.id].byDay[j].retired =
                                    !t.retired),
                              )
                            }
                          />
                        </Group>
                      ))}
                    </Stack>
                  </div>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )
        })}

        {/* Rotation ----------------------------------------------------- */}
        <Accordion.Item value="rotation">
          <Accordion.Control>Rotation</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <NumberInput
                label="Swap anchors every N weeks"
                min={1}
                value={draft.rotation.swapEveryNWeeks}
                onChange={(v) =>
                  update((d) => (d.rotation.swapEveryNWeeks = Number(v)))
                }
              />
              <Select
                label="Who starts on the evening anchor"
                data={adults.map((p) => ({ value: p.id, label: p.name }))}
                value={eveningStarter}
                onChange={(pid) =>
                  update((d) => {
                    const other = adults.find((p) => p.id !== pid)?.id
                    d.rotation.start = { [pid]: 'evening', [other]: 'morning' }
                  })
                }
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Cleaner ------------------------------------------------------ */}
        <Accordion.Item value="cleaner">
          <Accordion.Control>Cleaner</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <NumberInput
                label="Visits every N weeks"
                min={1}
                value={draft.cleaner?.schedule?.everyNWeeks}
                onChange={(v) =>
                  update((d) => (d.cleaner.schedule.everyNWeeks = Number(v)))
                }
              />
              <Select
                label="Visit day"
                data={DAY_OPTIONS}
                value={String(draft.cleaner?.schedule?.day)}
                onChange={(v) =>
                  update((d) => (d.cleaner.schedule.day = Number(v)))
                }
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Sticky save bar */}
      <Group
        justify="space-between"
        p="sm"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--mantine-color-body)',
          borderTop: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Text size="sm" c={error ? 'red' : saved ? 'leaf' : 'dimmed'}>
          {error
            ? error
            : saved
              ? `Saved · v${(config.version || 0) + (dirty ? 1 : 0)}`
              : `Version ${config.version}`}
        </Text>
        <Button onClick={save} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
      </Group>
    </Container>
  )
}
