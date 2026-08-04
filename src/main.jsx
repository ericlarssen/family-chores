import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/hanken-grotesk'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './styles/app.css'
import { theme } from './theme'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
