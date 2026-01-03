'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ControllerRenderProps } from 'react-hook-form'

interface DateTimePickerProps {
  field: ControllerRenderProps<any, any>
}

export function DateTimePicker({ field }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    field.value ? new Date(field.value) : undefined
  )

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Preserve time from existing date or use current time
      const timeDate = date || new Date()
      newDate.setHours(timeDate.getHours())
      newDate.setMinutes(timeDate.getMinutes())
      
      setDate(newDate)
      field.onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"))
    }
  }

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    const currentDate = date || new Date()
    const newDate = new Date(currentDate)
    
    if (type === 'hour') {
      newDate.setHours(parseInt(value))
    } else {
      newDate.setMinutes(parseInt(value))
    }
    
    setDate(newDate)
    field.onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP p') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Hour</label>
              <select
                className="w-full p-2 border rounded-md"
                value={date?.getHours() || 0}
                onChange={(e) => handleTimeChange('hour', e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Minute</label>
              <select
                className="w-full p-2 border rounded-md"
                value={date?.getMinutes() || 0}
                onChange={(e) => handleTimeChange('minute', e.target.value)}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
