'use client'

import { CalendarContext } from './calendar-context'
import { CalendarTask, Mode } from './calendar-types'
import { useState, ReactNode } from 'react'

export default function CalendarProvider({
  tasks,
  setTasks,
  mode,
  setMode,
  date,
  setDate,
  onTaskUpdate,
  children,
}: {
  tasks: CalendarTask[]
  setTasks: (tasks: CalendarTask[]) => void
  mode: Mode
  setMode: (mode: Mode) => void
  date: Date
  setDate: (date: Date) => void
  onTaskUpdate?: (task: any) => void
  children: ReactNode
}) {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null)

  return (
    <CalendarContext.Provider
      value={{
        tasks,
        setTasks,
        mode,
        setMode,
        date,
        setDate,
        onTaskUpdate,
        taskDialogOpen,
        setTaskDialogOpen,
        selectedTask,
        setSelectedTask,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}
