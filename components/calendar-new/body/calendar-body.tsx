'use client'

import { useCalendarContext } from '../calendar-context'
import CalendarBodyMonth from './calendar-body-month'
import CalendarBodyWeek from './calendar-body-week'
import CalendarBodyDay from './calendar-body-day'

export default function CalendarBody() {
  const { mode } = useCalendarContext()

  return (
    <div className="flex-1 overflow-hidden relative">
      <div className={mode === 'month' ? 'block h-full' : 'hidden'}>
        <CalendarBodyMonth />
      </div>
      <div className={mode === 'week' ? 'block h-full' : 'hidden'}>
        <CalendarBodyWeek />
      </div>
      <div className={mode === 'day' ? 'block h-full' : 'hidden'}>
        <CalendarBodyDay />
      </div>
    </div>
  )
}
