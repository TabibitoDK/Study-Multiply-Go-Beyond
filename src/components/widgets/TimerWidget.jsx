import { useEffect, useRef, useState } from 'react'

export default function TimerWidget({ title = 'Timer' }) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!running) { clearInterval(ref.current); return }
    ref.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(ref.current)
  }, [running])

  const reset = () => { setSeconds(0); setRunning(false) }

  const fmt = (s) => {
    const h = String(Math.floor(s/3600)).padStart(2,'0')
    const m = String(Math.floor((s%3600)/60)).padStart(2,'0')
    const ss = String(s%60).padStart(2,'0')
    return `${h}:${m}:${ss}`
  }

  return (
    <div className="widget">
      <div className="widget-header"><span>{title}</span></div>
      <div className="timer-time">{fmt(seconds)}</div>
      <div className="row">
        <button className="btn" onClick={() => setRunning(r => !r)}>{running?'Pause':'Start'}</button>
        <button className="btn ghost" onClick={reset}>Reset</button>
      </div>
    </div>
  )
}
