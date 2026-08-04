import { useCallback, useEffect, useState } from 'react'

// Hash-based day routing: `#/day/2026-08-05`. The mobile-first view is
// day-focused, and the hash keeps a given day deep-linkable on GitHub Pages
// (which 404s real client routes).
const DAY_HASH = /^#\/day\/(\d{4}-\d{2}-\d{2})/

function readHash() {
  const m = window.location.hash.match(DAY_HASH)
  return m ? m[1] : null
}

export function useHashDate(defaultIso) {
  const [dateIso, setDateIso] = useState(() => readHash() || defaultIso)

  useEffect(() => {
    const onHash = () => {
      const d = readHash()
      if (d) setDateIso(d)
    }
    window.addEventListener('hashchange', onHash)

    if (!readHash() && defaultIso) {
      window.location.replace(`#/day/${defaultIso}`)
      setDateIso(defaultIso)
    }
    return () => window.removeEventListener('hashchange', onHash)
  }, [defaultIso])

  const goToDate = useCallback((iso) => {
    window.location.hash = `#/day/${iso}`
    setDateIso(iso)
  }, [])

  return { dateIso, goToDate }
}
