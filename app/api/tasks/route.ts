import { NextRequest, NextResponse } from 'next/server';
import { executeCommand, queryTasks } from '@/lib/taskwarrior';

// Commands that modify tasks
const MODIFY_COMMANDS = [
  'add', 'modify', 'done', 'delete', 'start', 'stop',
  'annotate', 'denotate', 'edit', 'append', 'prepend'
];

function isModifyCommand(command: string): boolean {
  return MODIFY_COMMANDS.some(cmd => command.trim().startsWith(cmd));
}

export async function GET(request: NextRequest) {
  try {
    // Get filter from query params
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || '';
    
    console.log('GET /api/tasks - Filter:', filter);
    
    // Query tasks with filter
    const tasks = await queryTasks(filter);
    
    return NextResponse.json({
      success: true,
      tasks: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tasks',
        tasks: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    console.log('POST /api/tasks - Command:', command);

    // If it's a modify command, execute it and return result
    if (isModifyCommand(command)) {
      console.log('Executing modify command:', command);
      const result = await executeCommand(command);
      return NextResponse.json({ success: true, result });
    }

    // For all other commands, treat as filter and return tasks
    console.log('Executing filter command:', command);
    const tasks = await queryTasks(command);
    return NextResponse.json({ 
      success: true, 
      tasks: tasks 
    });
  } catch (error: any) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute command',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}