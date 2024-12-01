import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(
  request: Request
) {
  const matches = request.url.match(/\/tasks\/([^\/]+)/)
  const [, uuid] = matches ?? [null, '']

  try {
    const { stdout } = await execAsync(`task ${uuid} export`)
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
