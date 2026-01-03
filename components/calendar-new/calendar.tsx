'use client'

import type { CalendarProps } from './calendar-types'
import CalendarHeader from './header/calendar-header'
import CalendarBody from './body/calendar-body'
import CalendarHeaderActions from './header/calendar-header-actions'
import CalendarHeaderDate from './header/calendar-header-date'
import CalendarHeaderActionsMode from './header/calendar-header-actions-mode'
import CalendarProvider from './calendar-provider'

export default function Calendar({
  tasks,
  setTasks,
  mode,
  setMode,
  date,
  setDate,
  onTaskUpdate,
}: CalendarProps) {
  return (
    <CalendarProvider
      tasks={tasks}
      setTasks={setTasks}
      mode={mode}
      setMode={setMode}
      date={date}
      setDate={setDate}
      onTaskUpdate={onTaskUpdate}
    >
      <div className="flex flex-col flex-grow border rounded-lg overflow-hidden bg-card">
        <CalendarHeader>
          <CalendarHeaderDate />
          <CalendarHeaderActions>
            <CalendarHeaderActionsMode />
          </CalendarHeaderActions>
        </CalendarHeader>
        <CalendarBody />
      </div>
    </CalendarProvider>
  )
}
