import { NextResponse } from 'next/server';
import { execTask, execRawTask } from '../utils/taskwarrior';

const parseProjects = (output: string): string[] => {
  if (!output || output === '[]') return [];
  try {
    // Split by newlines and filter out the header and empty lines
    return output.split('\n')
      .filter(line => line && !line.startsWith('Project') && !line.includes('---'))
      .map(line => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.error('Error parsing projects:', error);
    return [];
  }
};

const parseTags = (output: string): string[] => {
  if (!output || output === '[]') return [];
  try {
    // Split by newlines and filter out the header and empty lines
    return output.split('\n')
      .filter(line => line && !line.startsWith('Tag') && !line.includes('---'))
      .map(line => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.error('Error parsing tags:', error);
    return [];
  }
};

const safeParseInt = (value: string): number => {
  try {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
};

export async function GET() {
  try {
    console.log('Starting metrics collection...');

    // Get task counts by status
    const [totalStr, pendingStr, completedStr, deletedStr] = await Promise.all([
      execTask('count'),
      execTask('status:pending count'),
      execTask('status:completed count'),
      execTask('status:deleted count')
    ]);

    console.log('Task counts retrieved:', { totalStr, pendingStr, completedStr, deletedStr });

    const totalTasks = safeParseInt(totalStr);
    const pendingTasks = safeParseInt(pendingStr);
    const completedTasks = safeParseInt(completedStr);
    const deletedTasks = safeParseInt(deletedStr);

    // Get project statistics
    console.log('Fetching projects...');
    const projectsStr = await execRawTask('projects');
    console.log('Projects output:', projectsStr);
    const projects = parseProjects(projectsStr);

    // Get tags statistics
    console.log('Fetching tags...');
    const tagsStr = await execRawTask('tags');
    console.log('Tags output:', tagsStr);
    const tags = parseTags(tagsStr);

    console.log('Metrics collection complete');

    return NextResponse.json({
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        deleted: deletedTasks
      },
      projects,
      tags
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({
      tasks: {
        total: 0,
        pending: 0,
        completed: 0,
        deleted: 0
      },
      projects: [],
      tags: []
    });
  }
}
