'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Mode, calendarModes } from '../calendar-types'
import { useCalendarContext } from '../calendar-context'
import { calendarModeIconMap } from '../calendar-mode-icon-map'
import { cn } from '@/lib/utils'

export default function CalendarHeaderActionsMode() {
  const { mode, setMode } = useCalendarContext()

  return (
    <ToggleGroup
      className="flex gap-0 rounded-lg border shadow-sm"
      type="single"
      variant="outline"
      value={mode}
      onValueChange={(value) => {
        if (value) setMode(value as Mode)
      }}
    >
      {calendarModes.map((modeValue) => {
        const isSelected = mode === modeValue
        return (
          <ToggleGroupItem
            key={modeValue}
            value={modeValue}
            className={cn(
              'gap-2 capitalize',
              isSelected && 'bg-accent'
            )}
          >
            {calendarModeIconMap[modeValue]}
            <span className={cn(
              'transition-all duration-200',
              isSelected ? 'opacity-100' : 'opacity-0 w-0 hidden'
            )}>
              {modeValue}
            </span>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
