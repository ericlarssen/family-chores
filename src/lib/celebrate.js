import confetti from 'canvas-confetti'

// A short, celebratory two-cannon burst — fired when someone finishes all of a
// day's tasks. Honors reduced-motion preferences.
export function celebrate() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const colors = ['#4c6ef5', '#12b886', '#f59f00', '#7a5bd6', '#e64980']
  const end = Date.now() + 800

  ;(function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      startVelocity: 55,
      origin: { x: 0, y: 0.9 },
      colors,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      startVelocity: 55,
      origin: { x: 1, y: 0.9 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
