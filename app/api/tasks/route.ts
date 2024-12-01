import { NextResponse } from 'next/server';
import { execTask } from '../utils/taskwarrior';

export async function GET() {
  try {
    console.log('[Server] Starting task export...');
    
    // First check if taskwarrior is working
    try {
      const version = await execTask('_version');
      console.log('[Server] Taskwarrior version:', version);
    } catch (e) {
      console.error('[Server] Error getting version:', e);
    }
    
    // Try to list tasks first
    try {
      const list = await execTask('list');
      console.log('[Server] Task list output:', list);
    } catch (e) {
      console.error('[Server] Error listing tasks:', e);
    }
    
    // Now try export
    const tasks = await execTask('export');
    console.log('[Server] Raw export output:', tasks);
    
    if (!tasks.trim()) {
      console.log('[Server] No tasks found in export');
      return NextResponse.json([]);
    }
    
    const parsedTasks = JSON.parse(tasks);
    console.log('[Server] Number of tasks found:', parsedTasks.length);
    
    return NextResponse.json(parsedTasks);
  } catch (error) {
    console.error('[Server] Error in GET /api/tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, project, tags } = body;
    
    let cmd = `add "${description}"`;
    if (project) cmd += ` project:"${project}"`;
    if (tags) cmd += ` ${tags.map((t: string) => `+${t}`).join(' ')}`;
    
    const result = await execTask(cmd);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error adding task:', error);
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}