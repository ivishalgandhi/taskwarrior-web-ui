import { NextResponse } from "next/server"
import { execRawTask } from "../../utils/taskwarrior"

export async function POST(request: Request) {
  try {
    const { command } = await request.json()
    
    // Execute the command
    const output = await execRawTask(command)

    return NextResponse.json({ 
      message: "Command executed successfully",
      output: output.trim()
    })
  } catch (error) {
    console.error("Error executing command:", error)
    return NextResponse.json(
      { error: "Failed to execute command" },
      { status: 500 }
    )
  }
}
