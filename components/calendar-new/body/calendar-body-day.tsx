'use client'

import { useCalendarContext } from '../calendar-context'
import { format, isSameDay, addHours, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { getTaskColor, parseTaskwarriorDate, getTaskHour, hexToRgba } from '../calendar-utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export default function CalendarBodyDay() {
  const { date, tasks, setSelectedTask, setTaskDialogOpen } = useCalendarContext()

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()
  const isToday = isSameDay(date, today)

  // Filter tasks for the selected day
  const dayTasks = tasks.filter((task) => {
    if (!task.due || task.status === 'deleted') return false
    const taskDate = parseTaskwarriorDate(task.due)
    return taskDate && isSameDay(taskDate, date)
  })

  // Group tasks by priority
  const highPriorityTasks = dayTasks.filter(t => t.priority === 'H')
  const mediumPriorityTasks = dayTasks.filter(t => t.priority === 'M')
  const lowPriorityTasks = dayTasks.filter(t => t.priority === 'L')
  const noPriorityTasks = dayTasks.filter(t => !t.priority)

  return (
    <div className="flex flex-col lg:flex-row flex-grow overflow-hidden gap-4 p-4">
      {/* Left side: Time grid */}
      <div className="flex-grow flex flex-col overflow-hidden border rounded-lg">
        <div className="py-3 px-4 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">
                {format(date, 'EEEE')}
              </div>
              <div
                className={cn(
                  'text-2xl font-semibold',
                  isToday && 'text-primary'
                )}
              >
                {format(date, 'MMMM d, yyyy')}
              </div>
            </div>
            {dayTasks.length > 0 && (
              <Badge variant="secondary">
                {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {hours.map((hour) => {
                // Find tasks for this specific hour
                const hourTasks = dayTasks.filter(task => getTaskHour(task) === hour)
                
                return (
                  <div
                    key={hour}
                    className="flex border-b min-h-[80px] hover:bg-accent/5 transition-colors"
                  >
                    <div className="w-20 py-2 px-3 text-xs text-muted-foreground text-right border-r">
                      {format(addHours(startOfDay(date), hour), 'h:mm a')}
                    </div>
                    <div className="flex-grow p-2">
                      {hourTasks.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {hourTasks.map((task) => {
                            const color = getTaskColor(task.status, task.priority)
                            return (
                              <motion.div
                                key={task.uuid}
                                initial={{ opacity: 0, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs p-2 rounded cursor-pointer transition-opacity hover:opacity-80 border-l-2"
                                style={{ 
                                  backgroundColor: hexToRgba(color, 0.1),
                                  borderLeftColor: color
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTask(task)
                                  setTaskDialogOpen(true)
                                }}
                              >
                                <span className="font-medium">
                                  {task.description}
                                </span>
                                {task.project && (
                                  <span className="text-muted-foreground ml-2">
                                    · {task.project}
                                  </span>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </div>

      {/* Right side: Task list */}
      {dayTasks.length > 0 && (
        <div className="lg:w-80 flex flex-col gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="py-3 px-4 border-b bg-card">
              <h3 className="font-semibold">Tasks for this day</h3>
            </div>
            <ScrollArea className="max-h-[calc(100vh-250px)]">
              <div className="p-4 space-y-4">
                {highPriorityTasks.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      HIGH PRIORITY
                    </div>
                    <div className="space-y-2">
                      {highPriorityTasks.map((task) => {
                        const color = getTaskColor(task.status, task.priority)
                        return (
                          <motion.div
                            key={task.uuid}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => {
                              setSelectedTask(task)
                              setTaskDialogOpen(true)
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm leading-tight">
                                  {task.description}
                                </p>
                                {task.project && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.project}
                                  </p>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {mediumPriorityTasks.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      MEDIUM PRIORITY
                    </div>
                    <div className="space-y-2">
                      {mediumPriorityTasks.map((task) => {
                        const color = getTaskColor(task.status, task.priority)
                        return (
                          <motion.div
                            key={task.uuid}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => {
                              setSelectedTask(task)
                              setTaskDialogOpen(true)
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm leading-tight">
                                  {task.description}
                                </p>
                                {task.project && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.project}
                                  </p>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(lowPriorityTasks.length > 0 || noPriorityTasks.length > 0) && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      OTHER TASKS
                    </div>
                    <div className="space-y-2">
                      {[...lowPriorityTasks, ...noPriorityTasks].map((task) => {
                        const color = getTaskColor(task.status, task.priority)
                        return (
                          <motion.div
                            key={task.uuid}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => {
                              setSelectedTask(task)
                              setTaskDialogOpen(true)
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm leading-tight">
                                  {task.description}
                                </p>
                                {task.project && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.project}
                                  </p>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {dayTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No tasks for this day</p>
            <p className="text-sm mt-1">Select a different date to view tasks</p>
          </div>
        </div>
      )}
    </div>
  )
}
