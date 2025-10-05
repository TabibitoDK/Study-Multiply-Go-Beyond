import { useEffect, useMemo, useRef, useState } from 'react'

const MODES = [
  { id: 'focus', label: 'Pomodoro', duration: 25 * 60 },
  { id: 'short', label: 'Short Break', duration: 5 * 60 },
  { id: 'long', label: 'Long Break', duration: 15 * 60 },
  { id: 'stopwatch', label: 'Stopwatch', duration: null }
]

export default function TimerWidget() {
  const [modeId, setModeId] = useState(MODES[0].id)
  const activeMode = useMemo(() => MODES.find(m => m.id === modeId) ?? MODES[0], [modeId])
  const [seconds, setSeconds] = useState(activeMode.duration ?? 0)
  const [running, setRunning] = useState(false)
  const timerRef = useRef()

  useEffect(() => {
    setSeconds(activeMode.duration ?? 0)
    setRunning(false)
  }, [activeMode])

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (activeMode.duration === null) {
          return prev + 1
        }
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [running, activeMode])

  const formatted = useMemo(() => {
    const s = Math.max(0, seconds)
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return activeMode.duration && activeMode.duration < 3600 ? `${m}:${ss}` : `${h}:${m}:${ss}`
  }, [seconds, activeMode])

  const progress = useMemo(() => {
    if (activeMode.duration === null) return 0
    if (activeMode.duration === 0) return 0
    return Math.min(1, 1 - seconds / activeMode.duration)
  }, [seconds, activeMode])

  function toggleRunning() {
    setRunning(p => !p)
  }

  function reset() {
    clearInterval(timerRef.current)
    setSeconds(activeMode.duration ?? 0)
    setRunning(false)
  }

  return (
    <div className={`timer-widget ${running ? 'is-running' : ''}`}>
      <div className="timer-modes" role="tablist" aria-label="Timer modes">
        {MODES.map(mode => (
          <button
            key={mode.id}
            className={`timer-mode ${mode.id === activeMode.id ? 'active' : ''}`}
            onClick={() => setModeId(mode.id)}
            role="tab"
            aria-selected={mode.id === activeMode.id}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="timer-display">{formatted}</div>

      {activeMode.duration !== null && (
        <div className="timer-progress" aria-hidden="true">
          <div className="timer-progress-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}

      <div className="timer-actions">
        <button className="timer-btn primary" onClick={toggleRunning}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="timer-btn ghost" onClick={reset}>Reset</button>
      </div>
    </div>
  )
}
