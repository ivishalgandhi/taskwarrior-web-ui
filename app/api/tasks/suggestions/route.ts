import { NextRequest, NextResponse } from 'next/server';
import { executeCommand } from '@/app/api/utils/taskwarrior';

interface ProjectNode {
  name: string;
  fullPath: string;
  tasks: number;
  children: { [key: string]: ProjectNode };
}

function flattenProjectTree(node: ProjectNode, projects: string[] = []): string[] {
  projects.push(node.fullPath);
  Object.values(node.children).forEach(child => {
    flattenProjectTree(child, projects);
  });
  return projects;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Type parameter is required' 
        }, 
        { status: 400 }
      );
    }

    console.log('Received type parameter:', type);
    let values: string[] = [];

    switch (type) {
      case 'tags':
        try {
          console.log('Executing _tags command...');
          const output = await executeCommand('_tags');
          console.log('Raw output from _tags:', output);
          
          // Handle empty output case
          if (!output) {
            console.log('No tags found');
            return NextResponse.json({ success: true, values: [] });
          }
          
          values = output
            .split('\n')
            .map(tag => tag.trim())
            .filter(Boolean)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            
          console.log('Processed tags:', values);
          return NextResponse.json({ success: true, values });
        } catch (error: any) {
          console.error('Error fetching tags:', error);
          return NextResponse.json(
            { 
              success: false, 
              error: error.message || 'Failed to fetch tags',
              details: error.toString()
            }, 
            { status: 500 }
          );
        }

      case 'project':
      case 'projects':
        try {
          console.log('Fetching projects...');
          const output = await executeCommand('_projects');
          console.log('Raw projects output:', output);
          
          // Handle empty output case
          if (!output) {
            console.log('No projects found');
            return NextResponse.json({ success: true, values: [] });
          }
          
          values = output
            .split('\n')
            .map(project => project.trim())
            .filter(Boolean)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            
          console.log('Processed projects:', values);
          return NextResponse.json({ success: true, values });
        } catch (error: any) {
          console.error('Error fetching projects:', error);
          return NextResponse.json(
            { 
              success: false, 
              error: error.message || 'Failed to fetch projects',
              details: error.toString()
            }, 
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unsupported suggestion type: ${type}` 
          }, 
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Unexpected error in suggestions route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.toString()
      }, 
      { status: 500 }
    );
  }
}
