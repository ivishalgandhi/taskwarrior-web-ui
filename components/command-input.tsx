"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { toast } from "sonner"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

interface CommandInputProps {
  onCommandExecuted: () => void
}

export function CommandInput({ onCommandExecuted }: CommandInputProps) {
  const [command, setCommand] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

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
      toast.success("Command executed successfully")
      if (result.output) {
        setOutput(result.output)
      }
      
      onCommandExecuted()
    } catch (error) {
      toast.error("Failed to execute command")
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
          <CardContent className="p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm">{output}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
