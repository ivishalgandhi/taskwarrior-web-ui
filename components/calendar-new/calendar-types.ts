import { Task } from '@/types/task'

export type CalendarTask = Task

export type CalendarProps = {
  tasks: CalendarTask[]
  setTasks: (tasks: CalendarTask[]) => void
  mode: Mode
  setMode: (mode: Mode) => void
  date: Date
  setDate: (date: Date) => void
  onTaskUpdate?: (task: Task) => void
}

export type CalendarContextType = CalendarProps & {
  selectedTask: CalendarTask | null
  setSelectedTask: (task: CalendarTask | null) => void
  taskDialogOpen: boolean
  setTaskDialogOpen: (open: boolean) => void
}

export const calendarModes = ['day', 'week', 'month'] as const
export type Mode = (typeof calendarModes)[number]
