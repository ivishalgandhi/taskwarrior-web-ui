import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

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
      if (value === null) {
        modifyCommand += ` ${key}:`; // Remove the field
      } else if (key === 'due') {
        // Format date as YYYY-MM-DD
        const date = new Date(value as string);
        const formattedDate = date.toISOString().split('T')[0];
        modifyCommand += ` due:${formattedDate}`;
      } else {
        modifyCommand += ` ${key}:${value}`;
      }
    });

    // Execute the command
    execSync(modifyCommand);

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
