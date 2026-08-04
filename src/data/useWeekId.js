import { useCallback, useEffect, useState } from 'react'

// Hash-based week routing: `#/week/2026-08-03`. GitHub Pages 404s on real client
// routes, so the hash sidesteps server routing entirely and makes weeks
// deep-linkable.
const WEEK_HASH = /^#\/week\/(\d{4}-\d{2}-\d{2})/

function readHash() {
  const m = window.location.hash.match(WEEK_HASH)
  return m ? m[1] : null
}

export function useWeekId(defaultMonday) {
  const [weekId, setWeekId] = useState(() => readHash() || defaultMonday)

  useEffect(() => {
    const onHash = () => {
      const w = readHash()
      if (w) setWeekId(w)
    }
    window.addEventListener('hashchange', onHash)

    // Normalize the URL so it's shareable even when opened at the bare root.
    if (!readHash() && defaultMonday) {
      window.location.replace(`#/week/${defaultMonday}`)
      setWeekId(defaultMonday)
    }
    return () => window.removeEventListener('hashchange', onHash)
  }, [defaultMonday])

  const goToWeek = useCallback((w) => {
    window.location.hash = `#/week/${w}`
    setWeekId(w)
  }, [])

  return { weekId, goToWeek }
}
