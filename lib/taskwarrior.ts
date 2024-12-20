import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const DB_LOCK_ERROR = 'database is locked';

// These are known informational messages that Taskwarrior outputs to stderr
const KNOWN_INFO_PATTERNS = [
  /Project '.+' has changed/,
  /Project '.+' is \d+% complete/,
  /\d+ tasks?/,
  /remaining/,
  /^Created task \d+\.$/,
  /^Completed \d+ tasks?\.$/,
  /^Deleted \d+ tasks?\.$/,
  /^Modified \d+ tasks?\.$/,
  /^Task \d+ deleted\.$/,
  /^Task \d+ modified\.$/,
];

function isInformationalMessage(stderr: string): boolean {
  return KNOWN_INFO_PATTERNS.some(pattern => pattern.test(stderr));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithRetry(
  command: string, 
  retryCount: number = 0
): Promise<{ stdout: string; stderr: string }> {
  try {
    console.log('Executing command:', command);
    return await execAsync(command);
  } catch (error: any) {
    if (error.stderr?.includes(DB_LOCK_ERROR) && retryCount < MAX_RETRIES) {
      console.log(`Database locked, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      return executeWithRetry(command, retryCount + 1);
    }
    throw error;
  }
}

export async function executeCommand(command: string, json: boolean = false): Promise<string> {
  try {
    const fullCommand = `task ${json ? 'rc.json.array=on rc.verbose=nothing' : ''} ${command}`;
    console.log('Executing taskwarrior command:', command);
    const { stdout, stderr } = await executeWithRetry(fullCommand);
    
    if (stderr) {
      console.log('Taskwarrior stderr:', stderr);
      // Only throw if it's not a known informational message
      if (!isInformationalMessage(stderr)) {
        throw new Error(stderr);
      }
    }
    
    return stdout.trim();
  } catch (error: any) {
    // If it's an exec error, check if the stderr is actually just info
    if (error.stderr && isInformationalMessage(error.stderr)) {
      return error.stdout?.trim() || '';
    }
    console.error('Error executing taskwarrior command:', error);
    throw error;
  }
}

export async function queryTasks(filter: string = ''): Promise<any[]> {
  try {
    console.log('Querying tasks with filter:', filter);
    // If the command already includes 'export', use it as is
    if (filter.includes('export')) {
      console.log('Using export command:', filter);
      const result = await executeCommand(filter, true);
      return JSON.parse(result);
    }
    
    // If it's a list or other command, append export to get JSON
    const exportCmd = filter ? `${filter} export` : 'export';
    console.log('Using export command:', exportCmd);
    const result = await executeCommand(exportCmd, true);
    return JSON.parse(result);
  } catch (error) {
    console.error('Error querying tasks:', error);
    throw error;
  }
}
