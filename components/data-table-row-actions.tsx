"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, CheckCircle, Clock, Trash2, Edit3, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Task } from "@/types/task"
import { TaskEditDialog } from "./task-edit-dialog"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onAction: (taskId: string, action: string) => Promise<any>
}

export function DataTableRowActions<TData>({
  row,
  onAction,
}: DataTableRowActionsProps<TData>) {
  const task = row.original as Task
  const [isLoading, setIsLoading] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleAction = async (action: string) => {
    if (action === 'edit') {
      setShowEditDialog(true)
      return
    }

    setIsLoading(true)
    try {
      const data = await onAction(task.uuid, action)
      
      // Show success message
      if (data?.message) {
        toast.success(data.message)
      } else {
        toast.success(`Task ${action}ed successfully`)
      }
      
      // If there's additional info from Taskwarrior, show it as a separate toast
      if (data?.info) {
        toast.info(data.info, {
          duration: 5000 // Show for 5 seconds since it might be longer text
        })
      }
    } catch (error: unknown) {
      console.error('Error performing task action:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else if (typeof error === 'string') {
        toast.error(error)
      } else {
        toast.error(`Failed to ${action} task`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <TaskEditDialog
        task={task}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onTaskUpdated={() => onAction(task.uuid, 'refresh')}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isLoading}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem 
            onClick={() => handleAction('done')}
            disabled={isLoading || task.status === 'completed'}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Done
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAction('start')}
            disabled={isLoading || task.status === 'completed' || !!task.start}
          >
            <Clock className="mr-2 h-4 w-4" />
            Start Task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleAction('edit')}
            disabled={isLoading}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAction('duplicate')}
            disabled={isLoading}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleAction('delete')}
            className="text-destructive focus:text-destructive"
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
