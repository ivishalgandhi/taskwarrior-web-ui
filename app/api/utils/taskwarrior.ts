import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const DEFAULT_OPTIONS = {
  env: {
    ...process.env,
    TASKRC: path.join(os.homedir(), '.taskrc'),
  },
  maxBuffer: 1024 * 1024 * 10, // 10MB buffer
};

// Common non-error messages from taskwarrior
const NON_ERROR_MESSAGES = [
  'No matches',
  'No projects',
  'Created task',
  'TASKRC override',
  'Sync required',
  'There are',
  'local changes'
];

/**
 * Check if a message is a real error or just taskwarrior info
 */
function isRealError(message: string): boolean {
  const lines = message.split('\n').map(line => line.trim()).filter(Boolean);
  return !lines.every(line => 
    NON_ERROR_MESSAGES.some(msg => line.includes(msg))
  );
}

/**
 * Clean taskwarrior output by removing common info messages
 */
function cleanOutput(output: string): string {
  return output
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !NON_ERROR_MESSAGES.some(msg => line.includes(msg)))
    .join('\n');
}

/**
 * Execute a raw taskwarrior command with proper options
 */
export async function executeCommand(command: string, forceExport: boolean = false): Promise<string> {
  if (!command) {
    throw new Error('Command is required');
  }

  try {
    // Build command with proper options
    const parts = [];

    // Add rc.verbose=nothing if not already present
    if (!command.includes('rc.verbose=')) {
      parts.push('rc.verbose=nothing');
    }

    // Add the main command
    parts.push(command);

    // Add export if needed
    if (forceExport && !command.includes('export')) {
      parts.push('export');
    }

    // Join all parts
    const fullCommand = parts.filter(Boolean).join(' ');
    console.log('Executing taskwarrior command:', fullCommand);
    
    const { stdout, stderr } = await execAsync(`task ${fullCommand}`, {
      ...DEFAULT_OPTIONS,
      timeout: 10000 // 10 second timeout
    });
    
    // Check for common error patterns
    if (stderr) {
      const stderrStr = stderr.toString().trim();
      if (stderrStr && isRealError(stderrStr)) {
        throw new Error(stderrStr);
      }
    }
    
    // Handle empty output cases
    if (!stdout.trim()) {
      if (command === '_tags') return '';
      if (command === '_projects') return '';
      throw new Error('Command produced no output');
    }
    
    return stdout.trim();
    
  } catch (error: any) {
    console.error('Task execution error:', error);
    if (error.code === 'ENOENT') {
      throw new Error('Taskwarrior is not installed or not in PATH');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Command timed out');
    }
    throw error;
  }
}

/**
 * Get tasks as JSON
 */
export async function getTasks(filter: string = ''): Promise<any[]> {
  try {
    // Always use rc.json.array=on for consistent JSON output
    const command = filter ? `rc.json.array=on ${filter}` : 'rc.json.array=on';
    console.log('Getting tasks with command:', command);
    
    const output = await executeCommand(command, true); // Force export
    if (!output) return [];
    
    try {
      const tasks = JSON.parse(output);
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('Error parsing task JSON:', error);
      console.error('Raw output:', output);
      return [];
    }
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

/**
 * Get the latest task
 */
export async function getLatestTask(): Promise<any> {
  try {
    // Sort by entry time in descending order and limit to 1
    const tasks = await getTasks('limit:1 newest');
    return tasks[0];
  } catch (error) {
    console.error('Error getting latest task:', error);
    throw error;
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskData(id: string): Promise<any> {
  try {
    const tasks = await getTasks(`${id}`);
    return tasks[0];
  } catch (error) {
    console.error(`Error getting task ${id}:`, error);
    throw error;
  }
}
