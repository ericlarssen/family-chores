import { createTheme } from '@mantine/core'

// "The good chart" — warm kitchen neutrals let the four person-colors carry
// identity, and one semantic green speaks the whole app's language: done.
const leaf = [
  '#e7f6ef',
  '#c7ebd8',
  '#a2dfc0',
  '#79d3a6',
  '#56c891',
  '#3fb07d',
  '#2e9e6b', // primary — completion green
  '#248056',
  '#1a6543',
  '#0f4a30',
]

export const theme = createTheme({
  primaryColor: 'leaf',
  primaryShade: { light: 6, dark: 5 },
  colors: { leaf },
  fontFamily:
    "'Hanken Grotesk Variable', system-ui, -apple-system, sans-serif",
  headings: {
    fontFamily: "'Fraunces Variable', Georgia, serif",
    fontWeight: '600',
  },
  defaultRadius: 'md',
  components: {
    Checkbox: {
      styles: {
        // A little tactility on the box itself — it presses when toggled.
        input: { transition: 'transform 120ms ease, background 120ms ease' },
      },
    },
  },
})
