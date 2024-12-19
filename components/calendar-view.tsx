"use client"

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Task } from '@/types/task'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CalendarViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: any) => void
  tableFilters?: Record<string, any>
}

export function CalendarView({ tasks, onTaskUpdate, tableFilters }: CalendarViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [moreEventsDate, setMoreEventsDate] = useState<string | null>(null)
  const [moreEvents, setMoreEvents] = useState<any[]>([])
  const [isMoreEventsModalOpen, setIsMoreEventsModalOpen] = useState(false)

  // Update filtered events when tasks or filters change
  useEffect(() => {
    // First filter out deleted tasks
    const nonDeletedTasks = tasks.filter(task => task.status !== 'deleted' && task.status !== 'archived');
    console.log('[Calendar] Tasks before status filtering:', nonDeletedTasks.length);
    console.log('[Calendar] Table filters:', tableFilters);
    
    const filtered = nonDeletedTasks.filter(task => {
      if (!tableFilters) return true
      
      // Apply the same filtering logic as the table
      for (const [key, value] of Object.entries(tableFilters)) {
        if (!value) continue
        
        switch (key) {
          case 'status':
            if (Array.isArray(value)) {
              // If no status filters, show all tasks
              if (value.length === 0) return true;
              
              // Check if task status is in allowed statuses
              const included = value.includes(task.status);
              
              // Debug logging for completed tasks
              if (task.status === 'completed' || value.includes('completed')) {
                console.log('[Calendar] Task status check:', {
                  taskDescription: task.description,
                  taskStatus: task.status,
                  allowedStatuses: value,
                  included,
                  due: task.due
                });
              }
              
              return included;
            }
            break
          case 'priority':
            if (Array.isArray(value)) {
              if (value.length === 0) return true;
              if (!task.priority) return false;
              return value.includes(task.priority);
            }
            break
          case 'project':
            if (Array.isArray(value)) {
              if (value.length === 0) return true;
              if (!task.project) return false;
              return value.some(val => {
                if (!val) return false;
                if (task.project === val) return true;
                const taskParts = task.project.split('.');
                const valParts = val.split('.');
                if (valParts.length > taskParts.length) return false;
                return valParts.every((part, i) => taskParts[i] === part);
              });
            }
            break
          case 'description':
            if (!task.description.toLowerCase().includes(value.toLowerCase())) return false
            break
          case 'tags':
            if (Array.isArray(value)) {
              if (value.length === 0) return true;
              if (!task.tags || task.tags.length === 0) return false;
              return value.some(filterTag => {
                if (!filterTag) return false;
                return task.tags!.some(tag => 
                  tag.toLowerCase().includes(filterTag.toLowerCase())
                );
              });
            }
            break
        }
      }
      return true
    })

    // Debug logging for tasks and due dates
    console.log('[Calendar] Tasks after status filtering:', filtered.length);
    console.log('[Calendar] Completed tasks:', filtered.filter(t => t.status === 'completed').length);
    console.log('[Calendar] Tasks with due dates:', filtered.filter(t => t.due).length);
    console.log('[Calendar] Completed tasks with due dates:', filtered.filter(t => t.status === 'completed' && t.due).length);

    // Only show tasks with due dates in calendar
    const tasksWithDueDates = filtered.filter(task => task.due);
    console.log('[Calendar] Final tasks to show in calendar:', tasksWithDueDates.length);

    const events = tasksWithDueDates.map(task => ({
      id: task.uuid,
      title: task.description,
      start: task.due ? new Date(task.due.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
        '$1-$2-$3T$4:$5:$6Z'
      )) : undefined,
      backgroundColor: getTaskColor(task.status, task.priority),
      borderColor: 'transparent',
      textColor: '#ffffff',
      classNames: ['task-event', getTaskClass(task)],
      extendedProps: task
    }))

    setFilteredEvents(events)
  }, [tasks, tableFilters])

  function getTaskClass(task: Task): string {
    const classes = ['task-event']
    if (task.status === 'completed') classes.push('completed-task')
    if (task.status === 'waiting') classes.push('waiting-task')
    if (task.priority === 'H') classes.push('high-priority')
    if (task.priority === 'M') classes.push('medium-priority')
    if (task.priority === 'L') classes.push('low-priority')
    return classes.join(' ')
  }

  function getTaskColor(status: string, priority?: string) {
    if (status === 'completed') return '#22c55e' // green-500
    if (status === 'waiting') return '#eab308' // yellow-500
    
    // For pending tasks, use priority colors
    switch (priority) {
      case 'H':
        return '#ef4444' // red-500
      case 'M':
        return '#f97316' // orange-500
      case 'L':
        return '#3b82f1' // blue-500
      default:
        return '#6366f1' // indigo-500
    }
  }

  const handleEventClick = (info: any) => {
    setSelectedTask(info.event.extendedProps)
    setIsModalOpen(true)
  }

  const handleEventDrop = async (info: any) => {
    const taskId = info.event.id
    const newDate = info.event.start.toISOString()
    
    // Convert to Taskwarrior date format (e.g., 20240220T235959Z)
    const taskwarriorDate = newDate.replace(
      /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z/,
      '$1$2$3T$4$5$6Z'
    )
    
    await onTaskUpdate(taskId, { due: taskwarriorDate })
  }

  const handleMoreLinkClick = (info: any) => {
    info.preventDefault()
    setMoreEventsDate(info.date.toLocaleDateString())
    setMoreEvents(info.allSegs.map((seg: any) => seg.eventRange.def))
    setIsMoreEventsModalOpen(true)
  }

  const handleMoreEventClick = (event: any) => {
    setIsMoreEventsModalOpen(false)
    setSelectedTask(event.extendedProps)
    setIsModalOpen(true)
  }

  return (
    <>
      <style jsx global>{`
        .fc {
          height: calc(100vh - 180px) !important;
          background: var(--background);
          border-radius: 8px;
          padding: 1rem;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--border);
        }
        .fc-theme-standard .fc-scrollgrid {
          border-color: var(--border);
        }
        .fc-day-today {
          background: var(--muted) !important;
        }
        .fc-header-toolbar {
          margin-bottom: 1.5rem !important;
        }
        .fc-toolbar-title {
          font-size: 1.2rem !important;
          font-weight: 600;
        }
        .fc-button {
          background: var(--muted) !important;
          border: none !important;
          color: var(--foreground) !important;
          text-transform: capitalize !important;
          box-shadow: none !important;
          padding: 0.5rem 1rem !important;
          height: auto !important;
        }
        .fc-button-active {
          background: var(--primary) !important;
          color: var(--primary-foreground) !important;
        }
        .fc-event {
          border: none !important;
          padding: 2px 4px !important;
          font-size: 0.875rem !important;
          margin: 1px 0 !important;
          border-radius: 4px !important;
        }
        .fc-daygrid-event-dot {
          display: none !important;
        }
        .fc-event-time {
          font-size: 0.75rem !important;
        }
        .fc-event-title {
          font-weight: 500 !important;
        }
        .fc-day-other {
          opacity: 0.5;
        }
        .task-event {
          transition: all 0.2s ease;
        }
        .task-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .completed-task {
          opacity: 0.8;
        }
        .waiting-task {
          border-left: 3px solid #eab308 !important;
        }
        .high-priority {
          border-left: 3px solid #ef4444 !important;
        }
        .medium-priority {
          border-left: 3px solid #f97316 !important;
        }
        .low-priority {
          border-left: 3px solid #3b82f1 !important;
        }
        .fc-more-link {
          background: var(--primary) !important;
          color: var(--primary-foreground) !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          margin: 1px 0 !important;
          transition: all 0.2s ease;
          text-decoration: none !important;
          display: inline-block !important;
        }
        .fc-more-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .fc-daygrid-more-link {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
        }
        .fc-popover {
          background: var(--background) !important;
          border: 1px solid var(--border) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        .fc-popover-header {
          background: var(--muted) !important;
          padding: 8px !important;
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .fc-popover-title {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: var(--foreground) !important;
        }
        .fc-popover-close {
          color: var(--foreground) !important;
          opacity: 0.7 !important;
          font-size: 1.25rem !important;
        }
        .fc-popover-body {
          padding: 8px !important;
        }
        .fc-popover .fc-event {
          margin: 4px 0 !important;
          cursor: pointer !important;
        }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        editable={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        moreLinkClick={handleMoreLinkClick}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.description}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <span className="font-semibold">Status:</span> {selectedTask?.status}
            </div>
            {selectedTask?.project && (
              <div>
                <span className="font-semibold">Project:</span> {selectedTask.project}
              </div>
            )}
            {selectedTask?.tags && selectedTask.tags.length > 0 && (
              <div>
                <span className="font-semibold">Tags:</span> {selectedTask.tags.join(', ')}
              </div>
            )}
            {selectedTask?.due && (
              <div>
                <span className="font-semibold">Due:</span>{' '}
                {new Date(selectedTask.due.replace(
                  /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
                  '$1-$2-$3T$4:$5:$6Z'
                )).toLocaleString()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoreEventsModalOpen} onOpenChange={setIsMoreEventsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Events for {moreEventsDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {moreEvents.map((event) => (
              <div
                key={event.publicId}
                className={`p-2 rounded cursor-pointer transition-all hover:translate-y-[-1px] hover:shadow-md ${
                  event.extendedProps.status === 'completed' ? 'bg-green-500' :
                  event.extendedProps.status === 'waiting' ? 'bg-yellow-500' :
                  event.extendedProps.priority === 'H' ? 'bg-red-500' :
                  event.extendedProps.priority === 'M' ? 'bg-orange-500' :
                  event.extendedProps.priority === 'L' ? 'bg-blue-500' :
                  'bg-indigo-500'
                } text-white`}
                onClick={() => handleMoreEventClick(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
