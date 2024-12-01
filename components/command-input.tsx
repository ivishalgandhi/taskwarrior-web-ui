"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from "sonner"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { TaskEditDialog } from "./task-edit-dialog"
import { Task } from "@/types/task"

interface CommandInputProps {
  onCommandExecuted: () => void
}

export function CommandInput({ onCommandExecuted }: CommandInputProps) {
  const [command, setCommand] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newTask, setNewTask] = useState<Task | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    setIsLoading(true)
    setOutput(null)
    try {
      const response = await fetch("/api/tasks/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: command.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute command")
      }

      const result = await response.json()
      
      // Check if command starts with 'add' or 'task add'
      const isAddCommand = command.trim().toLowerCase().startsWith('add') || 
                          command.trim().toLowerCase().startsWith('task add')
      
      if (isAddCommand && result.task) {
        setNewTask(result.task)
        const taskDescription = command.trim().replace(/^(task\s+)?add\s+/i, '')
        toast.success("Task has been created", {
          description: taskDescription,
          action: {
            label: "View",
            onClick: () => setShowEditDialog(true),
          },
        })
      } else {
        toast.success("Command executed successfully", {
          description: command.trim(),
        })
      }

      if (result.output) {
        setOutput(result.output)
      }
      
      // Clear command after successful execution
      setCommand("")
      onCommandExecuted()
    } catch (error) {
      toast.error("Failed to execute command", {
        description: "Please check your command and try again",
      })
      console.error("Error executing command:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 mb-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter taskwarrior command (e.g., add Buy groceries)"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          Execute
        </Button>
      </form>
      {output && (
        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </CardContent>
        </Card>
      )}
      {newTask && (
        <TaskEditDialog
          task={newTask}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onTaskUpdated={onCommandExecuted}
        />
      )}
    </div>
  )
}
