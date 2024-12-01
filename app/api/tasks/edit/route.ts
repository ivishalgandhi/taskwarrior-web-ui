import { NextRequest, NextResponse } from 'next/server';
import { execTask } from '../../utils/taskwarrior';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { uuid, updates } = data;

    if (!uuid) {
      return NextResponse.json({ error: 'Task UUID is required' }, { status: 400 });
    }

    // Build the modification command
    let modifyCommand = `task uuid:${uuid} modify`;
    
    // Add each update to the command
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'description' && value) {
        modifyCommand += ` description:"${value}"`;
      }
      else if (key === 'priority') {
        if (value && value !== 'none') {
          modifyCommand += ` priority:${value}`;
        } else {
          // If priority is none or empty string, remove priority
          modifyCommand += ` priority:`;
        }
      }
      else if (key === 'project') {
        if (value) {
          modifyCommand += ` project:"${value}"`;
        } else {
          // If project is empty string, remove project
          modifyCommand += ` project:`;
        }
      }
      else if (key === 'due') {
        if (value && value.trim()) {
          try {
            // Convert from datetime-local format (YYYY-MM-DDTHH:mm) to Taskwarrior format
            const dueDate = new Date(value);
            if (!isNaN(dueDate.getTime())) {
              const taskwarriorDate = dueDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
              modifyCommand += ` due:${taskwarriorDate}`;
            } else {
              throw new Error('Invalid due date format');
            }
          } catch (error) {
            return NextResponse.json(
              { error: 'Invalid due date format' },
              { status: 400 }
            );
          }
        } else {
          // If due is empty string, remove due date
          modifyCommand += ` due:`;
        }
      }
      else if (key === 'tags') {
        if (Array.isArray(value) && value.length > 0) {
          // Add new tags
          value.forEach((tag: string) => {
            modifyCommand += ` +${tag}`;
          });
        }
      }
    });

    // Execute the command
    const result = await execTask(modifyCommand);
    
    return NextResponse.json({ 
      message: 'Task updated successfully',
      result 
    });
  } catch (error) {
    console.error('Error modifying task:', error);
    return NextResponse.json(
      { error: 'Failed to modify task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
