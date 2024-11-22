import { NextResponse } from 'next/server';
import { execTask } from '../utils/taskwarrior';

export async function GET() {
  try {
    const tasks = await execTask('export');
    return NextResponse.json(JSON.parse(tasks));
  } catch (error) {
    console.error('Error fetching tasks:', error);
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