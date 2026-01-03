import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

let isLocked = false;
const queue: (() => void)[] = [];

const processQueue = () => {
  if (queue.length > 0 && !isLocked) {
    const nextTask = queue.shift();
    if (nextTask) {
      nextTask();
    }
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function execWithRetry(command: string, options: any, retries = 0): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, options);
    if (stderr && !stderr.includes('No matches') && !stderr.includes('No projects')) {
      console.warn('Command stderr:', stderr);
    }
    return stdout || stderr;
  } catch (error: any) {
    const errorStr = error.stderr || error.message || '';
    const shouldRetry = (
      errorStr.includes('database is locked') ||
      errorStr.includes('UNIQUE constraint failed') ||
      errorStr.includes('working_set.id')
    ) && retries < MAX_RETRIES;
    
    if (shouldRetry) {
      console.log(`Database error, retrying in ${RETRY_DELAY}ms... (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return execWithRetry(command, options, retries + 1);
    }
    throw error;
  }
}

async function execWithTimeout(command: string, options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Command timed out after 5s: ${command}`));
    }, 5000);

    execAsync(command, options).then(({ stdout, stderr }) => {
      clearTimeout(timeout);
      
      console.log('Command:', command);
      console.log('Stdout:', stdout);
      console.log('Stderr:', stderr);
      
      if (stderr && !stdout && !stderr.includes('No matches') && !stderr.includes('No projects')) {
        console.error('Error:', stderr);
        reject(stderr);
        return;
      }
      
      resolve(stdout || stderr);
    }).catch((error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

export const execTask = async (cmd: string, includeCompleted: boolean = false): Promise<string> => {
  try {
    let escapedCmd = cmd.replace(/"/g, '\\"');
    
    // If it's an export command and we want completed tasks, modify the command
    if (cmd === 'export' && includeCompleted) {
      escapedCmd = 'export status:completed or status:pending or status:waiting';
    }
    
    const fullCmd = `task rc.json.array=on ${escapedCmd}`;
    
    console.log('Executing task command:', fullCmd);
    
    const result = await execWithRetry(fullCmd, {
      env: {
        ...process.env,
        PATH: process.env.PATH
      },
      shell: '/bin/bash'
    });

    return result || '[]';
  } catch (error) {
    console.error('Task command error:', error);
    return '[]';
  }
};

export const execRawTask = async (cmd: string): Promise<string> => {
  try {
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const fullCmd = `task ${escapedCmd}`;
    
    console.log('Executing raw task command:', fullCmd);
    
    const result = await execWithRetry(fullCmd, {
      env: {
        ...process.env,
        PATH: process.env.PATH
      },
      shell: '/bin/bash'
    });

    return result || '';
  } catch (error) {
    console.error('Raw task command error:', error);
    return '';
  }
};
