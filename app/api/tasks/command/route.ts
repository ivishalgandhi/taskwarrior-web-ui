import { NextResponse } from "next/server"
import { execRawTask, getTasks } from "../../utils/taskwarrior"

export async function POST(request: Request) {
  try {
    const { command } = await request.json()
    
    // Execute the command
    const output = await execRawTask(command)

    // If this is an add command, get the latest task
    const isAddCommand = command.trim().toLowerCase().startsWith('add') || 
                        command.trim().toLowerCase().startsWith('task add')
    
    let task = null
    if (isAddCommand) {
      // Get all tasks sorted by entry date (newest first)
      const tasks = await getTasks()
      task = tasks[0] // The most recently added task will be first
    }

    return NextResponse.json({ 
      message: "Command executed successfully",
      output: output.trim(),
      task
    })
  } catch (error) {
    console.error("Error executing command:", error)
    return NextResponse.json(
      { error: "Failed to execute command" },
      { status: 500 }
    )
  }
}
