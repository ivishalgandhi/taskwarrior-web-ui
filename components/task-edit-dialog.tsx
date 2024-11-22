"use client"

import { useState } from "react"
import { Task } from "../types/task"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

interface TaskEditDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: task.description,
    priority: task.priority || "none",
    project: task.project || "",
    due: task.due || "",
    tags: (task.tags || []).join(","),
  })

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateStr: string | undefined) => {
    if (!dateStr) return ""
    try {
      // Convert Taskwarrior format (20240514T025828Z) to ISO format (2024-05-14T02:58:28Z)
      const match = dateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/)
      if (match) {
        const [_, year, month, day, hour, minute] = match
        return `${year}-${month}-${day}T${hour}:${minute}`
      }
      return ""
    } catch (error) {
      console.error("Error formatting date:", error)
      return ""
    }
  }

  // Helper function to format date back to Taskwarrior format
  const formatDateForTaskwarrior = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
    } catch (error) {
      console.error("Error formatting date for Taskwarrior:", error)
      return ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tasks/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid: task.uuid,
          description: formData.description,
          priority: formData.priority,
          project: formData.project,
          due: formData.due ? formatDateForTaskwarrior(formData.due) : "",
          tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }

      toast.success("Task updated successfully")
      onTaskUpdated()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update task")
      console.error("Error updating task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="H">High</SelectItem>
                  <SelectItem value="M">Medium</SelectItem>
                  <SelectItem value="L">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, project: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due">Due Date</Label>
              <Input
                id="due"
                type="datetime-local"
                value={formatDateForInput(formData.due)}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, due: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tags: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
