import { Task } from '@/types/task'

export function getTaskColor(status: string, priority?: string): string {
  if (status === 'completed') return '#22c55e' // green-500
  if (status === 'waiting') return '#eab308' // yellow-500
  
  // For pending tasks, use priority colors
  switch (priority) {
    case 'H':
      return '#ef4444' // red-500
    case 'M':
      return '#f97316' // orange-500
    case 'L':
      return '#3b82f6' // blue-500
    default:
      return '#6b7280' // gray-500
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function parseTaskwarriorDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  try {
    // Convert Taskwarrior format (20240514T025828Z) to ISO format
    const match = dateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/)
    if (match) {
      const [_, year, month, day, hour, minute, second] = match
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`)
    }
    return undefined
  } catch (error) {
    console.error('Error parsing taskwarrior date:', error)
    return undefined
  }
}

export function formatDateForTaskwarrior(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Get the hour for a task - if time is set, use it; otherwise default to 8 AM
export function getTaskHour(task: Task): number {
  if (!task.due) return 8
  const taskDate = parseTaskwarriorDate(task.due)
  if (!taskDate) return 8
  
  const hour = taskDate.getHours()
  const minute = taskDate.getMinutes()
  
  // If time is exactly midnight (00:00), assume no time was set, default to 8 AM
  if (hour === 0 && minute === 0) return 8
  
  return hour
}
