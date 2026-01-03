'use client'

import { useCalendarContext } from '../calendar-context'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  addHours,
  startOfDay,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { getTaskColor, parseTaskwarriorDate, hexToRgba } from '../calendar-utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Fragment } from 'react'

export default function CalendarBodyWeek() {
  const { date, tasks, setSelectedTask, setTaskDialogOpen } = useCalendarContext()

  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: weekEnd,
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()

  // Filter tasks with due dates
  const tasksWithDueDates = tasks.filter(task => 
    task.due && task.status !== 'deleted'
  )

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-card z-10">
        <div className="py-3 px-2 text-xs text-muted-foreground border-r">Time</div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'py-3 text-center border-r',
                isToday && 'bg-primary/10'
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold mt-1',
                  isToday && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week grid */}
      <ScrollArea className="flex-grow">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={weekStart.toISOString()}
            className="grid grid-cols-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {hours.map((hour) => (
              <Fragment key={`hour-${hour}`}>
                <div
                  key={`time-${hour}`}
                  className="py-2 px-2 text-xs text-muted-foreground border-r border-b text-right"
                >
                  {format(addHours(startOfDay(date), hour), 'ha')}
                </div>
                {weekDays.map((day) => {
                  const dayTasks = tasksWithDueDates.filter((task) => {
                    const taskDate = parseTaskwarriorDate(task.due)
                    return taskDate && isSameDay(taskDate, day)
                  })
                  const isToday = isSameDay(day, today)

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'relative border-r border-b min-h-[60px] p-1 hover:bg-accent/5 transition-colors',
                        isToday && 'bg-primary/5'
                      )}
                    >
                      {hour === 0 && dayTasks.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {dayTasks.map((task) => {
                            const color = getTaskColor(task.status, task.priority)
                            return (
                              <motion.div
                                key={task.uuid}
                                initial={{ opacity: 0, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 line-clamp-1 overflow-hidden"
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
                        </div>
                      )}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}
