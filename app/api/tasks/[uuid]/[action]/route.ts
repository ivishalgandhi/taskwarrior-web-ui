import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// These are informational messages from Taskwarrior, not errors
const TASKWARRIOR_INFO_MESSAGES = [
  'Configuration override',
  'The project',
  'is complete',
  'remaining',
  'has changed',
  'Completed',
  'Started',
  'Deleted',
  'Duplicated',
  'You have more urgent tasks',
  'Task not started',
  'Task started'
]

const isInformationalMessage = (message: string): boolean => {
  return TASKWARRIOR_INFO_MESSAGES.some(infoMsg => message.includes(infoMsg))
}

export async function POST(
  request: Request,
  { params }: { params: { uuid: string; action: string } }
) {
  const { uuid, action } = params

  try {
    let command: string
    switch (action) {
      case 'done':
        command = `task rc.confirmation=no ${uuid} done`
        break
      case 'start':
        command = `task rc.confirmation=no ${uuid} start`
        break
      case 'delete':
        command = `task rc.confirmation=no ${uuid} delete`
        break
      case 'duplicate':
        command = `task rc.confirmation=no ${uuid} duplicate`
        break
      case 'edit':
        command = `task ${uuid} export`
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { stdout, stderr } = await execAsync(command)

    // Split stderr into lines and filter out informational messages
    const errorLines = stderr.split('\n').filter(line => 
      line.trim() && !isInformationalMessage(line)
    )

    // Real errors that aren't informational messages
    if (errorLines.length > 0) {
      throw new Error(errorLines.join('\n'))
    }

    // For edit action, return the task data
    if (action === 'edit') {
      try {
        const taskData = JSON.parse(stdout)[0]
        return NextResponse.json(taskData)
      } catch (error) {
        throw new Error('Failed to parse task data')
      }
    }

    // Get all informational messages
    const infoMessages = stderr.split('\n')
      .filter(line => line.trim())
      .join('\n')

    return NextResponse.json({ 
      message: `Task ${action}d successfully`,
      info: infoMessages,
      stdout
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: `Failed to ${action} task`,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
