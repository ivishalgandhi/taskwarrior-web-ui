import { NextResponse } from "next/server"
import { execTaskSecure, execTask } from "../../utils/taskwarrior"

// Whitelist of allowed Taskwarrior commands
const ALLOWED_COMMANDS = [
  'add',
  'done',
  'delete',
  'modify',
  'start',
  'stop',
  'undo',
  'append',
  'annotate',
  'denotate'
]

// Dangerous characters that could lead to command injection
const DANGEROUS_CHARS = /[&|;$`'"<>(){}[\]\\!#*?]/

// Validate that the command is safe to execute
function validateCommand(command: string): { valid: boolean; args?: string[]; error?: string } {
  const trimmed = command.trim()

  if (!trimmed) {
    return { valid: false, error: 'Empty command' }
  }

  // Check for dangerous characters
  if (DANGEROUS_CHARS.test(trimmed)) {
    return { valid: false, error: 'Command contains dangerous characters' }
  }

  // Split by whitespace to get command and arguments
  const parts = trimmed.split(/\s+/)
  const cmd = parts[0].toLowerCase()

  // Check if command is in whitelist
  if (!ALLOWED_COMMANDS.includes(cmd)) {
    return { valid: false, error: `Command '${cmd}' is not allowed` }
  }

  // Return args for execFile
  return { valid: true, args: parts }
}

export async function POST(request: Request) {
  try {
    const { command } = await request.json()

    // Validate the command
    const validation = validateCommand(command)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Execute securely using execFile (no shell)
    const output = await execTaskSecure(validation.args!)

    // If this is an add command, get the latest task
    const cmd = validation.args![0].toLowerCase()
    const isAddCommand = cmd === 'add'

    let task = null
    if (isAddCommand) {
      // Get all tasks and return the most recently added one
      const tasksOutput = await execTask('export', false)
      const tasks = JSON.parse(tasksOutput || '[]')
      // Sort by entry date (newest first)
      tasks.sort((a: any, b: any) => new Date(b.entry).getTime() - new Date(a.entry).getTime())
      task = tasks[0] || null
    }

    return NextResponse.json({
      message: "Command executed successfully",
      output: output.trim(),
      task
    })
  } catch (error) {
    console.error("Error executing command:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to execute command"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
