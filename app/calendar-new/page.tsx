"use client"

import { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import Calendar from '@/components/calendar-new/calendar'
import { Mode } from '@/components/calendar-new/calendar-types'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [mode, setMode] = useState<Mode>('month')
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] p-4">
      <Calendar
        tasks={tasks}
        setTasks={setTasks}
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
        onTaskUpdate={fetchTasks}
      />
    </div>
  )
}
