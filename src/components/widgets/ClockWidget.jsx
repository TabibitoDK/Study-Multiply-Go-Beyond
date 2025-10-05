import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

export default function ClockWidget({ title = 'Clock' }) {
  const [now, setNow] = useState(dayjs())

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="widget">
      <div className="widget-header"><span>{title}</span></div>
      <div className="clock-time">{now.format('hh:mm:ss A')}</div>
    </div>
  )
}
