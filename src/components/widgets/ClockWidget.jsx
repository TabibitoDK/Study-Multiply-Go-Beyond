import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

export default function ClockWidget() {
  const [now, setNow] = useState(dayjs())

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(t)
  }, [])

  const hours = now.format('hh')
  const minutes = now.format('mm')
  const seconds = now.format('ss')
  const ampm = now.format('A')
  const dateLabel = now.format('ddd, MMM D')

  return (
    <div className="clock-widget">
      <div className="clock-display">
        <span className="clock-hours">{hours}</span>
        <span className="clock-separator">:</span>
        <span className="clock-minutes">{minutes}</span>
      </div>
      <div className="clock-meta">
        <span className="clock-seconds">{seconds}</span>
        <span className="clock-ampm">{ampm}</span>
        <span className="clock-date">{dateLabel}</span>
      </div>
    </div>
  )
}
