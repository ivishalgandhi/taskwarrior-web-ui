'use client'

import { useCalendarContext } from '../calendar-context'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import CalendarHeaderDateChevrons from './calendar-header-date-chevrons'

export default function CalendarHeaderDate() {
  const { date } = useCalendarContext()
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
        <CalendarIcon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold">{format(date, 'MMMM yyyy')}</p>
        </div>
        <CalendarHeaderDateChevrons />
      </div>
    </div>
  )
}
