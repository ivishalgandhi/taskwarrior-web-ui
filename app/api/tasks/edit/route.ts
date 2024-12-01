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
    if (due && due.trim()) {
      try {
        // Convert from datetime-local format (YYYY-MM-DDTHH:mm) to Taskwarrior format
        const dueDate = new Date(due)
        if (!isNaN(dueDate.getTime())) {
          const taskwarriorDate = dueDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
          cmd += ` due:${taskwarriorDate}`
        } else {
          return NextResponse.json(
            { error: "Invalid due date format" },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid due date" },
          { status: 400 }
        )
      }
    } else {
      // If due is empty string or undefined, remove due date
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

    const result = await execTask(cmd)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to modify task", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
