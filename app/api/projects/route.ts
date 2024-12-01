import { NextResponse } from 'next/server';
import { execRawTask } from '../utils/taskwarrior';

interface ProjectNode {
  name: string;
  fullPath: string;
  tasks: number;
  children: { [key: string]: ProjectNode };
}

function buildProjectTree(projects: { project: string; count: number }[]): ProjectNode[] {
  const root: { [key: string]: ProjectNode } = {};

  // Handle empty project list
  if (!projects.length) {
    return [];
  }

  // First pass: create nodes and set initial counts
  projects.forEach(({ project, count }) => {
    if (!project) return;

    const parts = project.split('.');
    let current = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}.${part}` : part;

      if (!current[part]) {
        current[part] = {
          name: currentPath, // Use full path as name
          fullPath: currentPath,
          tasks: 0,
          children: {}
        };
      }

      // Only add count to the leaf node
      if (index === parts.length - 1) {
        current[part].tasks = count;
      }
      
      current = current[part].children;
    });
  });

  // Second pass: aggregate counts up the tree
  function aggregateCounts(node: ProjectNode): number {
    let total = node.tasks;
    for (const child of Object.values(node.children)) {
      total += aggregateCounts(child);
    }
    node.tasks = total;
    return total;
  }

  // Aggregate counts for each root node
  Object.values(root).forEach(node => {
    aggregateCounts(node);
  });

  return Object.values(root);
}

export async function GET() {
  try {
    // Get all tasks with projects using export
    const tasksOutput = await execRawTask('rc.json.array=on export');
    
    // Handle no tasks case
    if (!tasksOutput.trim()) {
      return NextResponse.json([]);
    }

    const tasks = JSON.parse(tasksOutput);
    
    // Get distinct projects and count tasks for each project
    const projectCounts = tasks.reduce((acc: { [key: string]: number }, task: any) => {
      if (task.project) {
        acc[task.project] = (acc[task.project] || 0) + 1;
      }
      return acc;
    }, {});

    // Convert to array format
    const projects = Object.entries(projectCounts).map(([project, count]) => ({
      project,
      count
    }));

    // Build the project tree
    const projectTree = buildProjectTree(projects);

    return NextResponse.json(projectTree);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
