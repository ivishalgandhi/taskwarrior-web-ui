import { NextResponse } from "next/server"
import { execTask } from "../../utils/taskwarrior"

export async function POST(request: Request) {
  try {
    const { uuid, description, priority, project, due, tags } = await request.json()

    // Build the task modification command
    let cmd = `modify ${uuid}`
    
    // Add description if provided
    if (description) {
      cmd += ` description:"${description}"`
    }

    // Add priority if provided
    if (priority && priority !== "none") {
      cmd += ` priority:${priority}`
    } else {
      // If priority is none or empty string, remove priority
      cmd += ` priority:`
    }

    // Add project if provided
    if (project) {
      cmd += ` project:"${project}"`
    } else {
      // If project is empty string, remove project
      cmd += ` project:`
    }

    // Add due date if provided
    if (due) {
      // Convert from datetime-local format (YYYY-MM-DDTHH:mm) to Taskwarrior format
      const dueDate = new Date(due)
      const taskwarriorDate = dueDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
      cmd += ` due:${taskwarriorDate}`
    } else {
      // If due is empty string, remove due date
      cmd += ` due:`
    }

    // Handle tags
    if (Array.isArray(tags)) {
      // Remove all existing tags first
      cmd += ` -ALLTAGREMOVED`
      // Add new tags
      tags.forEach(tag => {
        cmd += ` +${tag}`
      })
    }

    // Execute the command
    const result = await execTask(cmd)

    return NextResponse.json({ 
      message: "Task updated successfully",
      info: result
    })
  } catch (error) {
    console.error("Error modifying task:", error)
    return NextResponse.json(
      { error: "Failed to modify task" },
      { status: 500 }
    )
  }
}
