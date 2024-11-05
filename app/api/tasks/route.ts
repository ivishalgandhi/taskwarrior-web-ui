import { exec } from 'child_process';
import { NextResponse } from 'next/server';

// Helper to execute TaskWarrior commands
const execTask = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(`task ${cmd}`, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

export async function GET() {
  try {
    const tasks = await execTask('export');
    return NextResponse.json(JSON.parse(tasks));
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
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
    return NextResponse.json({ error }, { status: 500 });
  }
}