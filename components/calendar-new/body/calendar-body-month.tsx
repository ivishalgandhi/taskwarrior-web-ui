'use client'

import { useCalendarContext } from '../calendar-context'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { getTaskColor, parseTaskwarriorDate, hexToRgba } from '../calendar-utils'
import { Badge } from '@/components/ui/badge'

export default function CalendarBodyMonth() {
  const { date, tasks, setSelectedTask, setTaskDialogOpen, setDate, setMode } = useCalendarContext()

  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const today = new Date()

  // Filter tasks with due dates and group by day
  const tasksWithDueDates = tasks.filter(task => 
    task.due && task.status !== 'deleted'
  )

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="hidden md:grid grid-cols-7 border-b">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthStart.toISOString()}
          className="grid md:grid-cols-7 flex-grow overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {calendarDays.map((day) => {
            const dayTasks = tasksWithDueDates.filter((task) => {
              const taskDate = parseTaskwarriorDate(task.due)
              return taskDate && isSameDay(taskDate, day)
            })
            const isToday = isSameDay(day, today)
            const isCurrentMonth = isSameMonth(day, date)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'relative flex flex-col border-b border-r p-2 min-h-[120px] cursor-pointer hover:bg-accent/5 transition-colors',
                  !isCurrentMonth && 'bg-muted/30'
                )}
                onClick={() => {
                  setDate(day)
                  if (dayTasks.length > 0) {
                    setMode('day')
                  }
                }}
              >
                <div
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1',
                    isToday && 'bg-primary text-primary-foreground',
                    !isToday && !isCurrentMonth && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                
                <div className="flex flex-col gap-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const color = getTaskColor(task.status, task.priority)
                    return (
                      <motion.div
                        key={task.uuid}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs px-2 py-1 rounded-md truncate cursor-pointer transition-opacity hover:opacity-80"
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task)
                          setTaskDialogOpen(true)
                        }}
                      >
                        <span className="font-medium text-white drop-shadow-sm">
                          {task.description}
                        </span>
                      </motion.div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-2">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
