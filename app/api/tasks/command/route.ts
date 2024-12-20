import { NextRequest, NextResponse } from 'next/server';
import { executeCommand, getLatestTask } from '@/app/api/utils/taskwarrior';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command } = body;

    console.log('Executing command:', command);

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    // Validate add commands have a description
    if (command.trim().toLowerCase().startsWith('add')) {
      const parts = command.trim().split(' ');
      let hasDescription = false;
      
      // Skip 'add' and look for first non-attribute word
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!part.includes(':') && !part.startsWith('+') && !part.startsWith('-')) {
          hasDescription = true;
          break;
        }
      }

      if (!hasDescription) {
        return NextResponse.json(
          { 
            success: false,
            error: 'A task must have a description',
            userMessage: 'Please provide a description for the task'
          },
          { status: 400 }
        );
      }
    }

    // Execute the command
    const output = await executeCommand(command);
    console.log('Command output:', output);

    // If this is an add command, get the latest task
    const isAddCommand = command.trim().toLowerCase().startsWith('add');
    
    if (isAddCommand) {
      try {
        // Wait a bit for the task to be added
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the latest task
        const latestTask = await getLatestTask();
        console.log('Latest task:', latestTask);
        
        if (latestTask) {
          return NextResponse.json({ 
            success: true,
            output,
            task: latestTask
          });
        }
      } catch (error) {
        console.error('Error getting latest task:', error);
      }
      
      // If we couldn't get the latest task, still return success
      return NextResponse.json({ 
        success: true,
        output,
        message: 'Task added successfully'
      });
    }

    // For non-add commands, just return the output
    return NextResponse.json({ 
      success: true,
      output 
    });

  } catch (error) {
    console.error('Command execution error:', error);
    
    // Handle known taskwarrior error messages
    const errorMessage = error.stderr?.trim() || error.message || 'Failed to execute command';
    const userMessage = errorMessage.includes('A task must have a description')
      ? 'Please provide a description for the task'
      : 'Failed to execute command';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        userMessage,
        details: error.stderr || error.message
      },
      { status: 400 }
    );
  }
}
