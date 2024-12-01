import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(
  request: Request
) {
  const matches = request.url.match(/\/tasks\/([^\/]+)\/([^\/]+)/)
  const [, uuid, action] = matches ?? []

  try {
    const command = `task ${uuid} export`
    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      throw new Error(stderr)
    }

    const taskData = JSON.parse(stdout)[0]
    return NextResponse.json(taskData)
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request
) {
  const matches = request.url.match(/\/tasks\/([^\/]+)\/([^\/]+)/)
  const [, uuid, action] = matches ?? []
  const body = await request.json()

  try {
    const modString = Object.entries(body)
      .map(([key, value]) => `${key}:"${value}"`)
      .join(' ')
    
    const command = `task rc.confirmation=no ${uuid} modify ${modString}`
    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      throw new Error(stderr)
    }

    return NextResponse.json({ message: 'Task updated successfully', stdout })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to update task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request
) {
  const matches = request.url.match(/\/tasks\/([^\/]+)\/([^\/]+)/)
  const [, uuid, action] = matches ?? []

  try {
    const command = `task rc.confirmation=no ${uuid} delete`
    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      throw new Error(stderr)
    }

    return NextResponse.json({ message: 'Task deleted successfully', stdout })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to delete task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}