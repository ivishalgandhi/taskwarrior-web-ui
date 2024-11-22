import { exec } from 'child_process';

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

export const execTask = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const executeCommand = () => {
      isLocked = true;
      // Escape the command to handle spaces and special characters
      const escapedCmd = cmd.replace(/"/g, '\\"');
      // For export command, don't add export at the end
      const fullCmd = cmd === 'export' ? 
        'task rc.json.array=on export' : 
        `task rc.json.array=on ${escapedCmd} export`;
      
      exec(fullCmd, (error, stdout, stderr) => {
        isLocked = false;
        processQueue();
        
        if (error) {
          console.error('Taskwarrior error:', error);
          console.error('Stderr:', stderr);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    };

    if (isLocked) {
      queue.push(executeCommand);
    } else {
      executeCommand();
    }
  });
};

// New function for raw command execution
export const execRawTask = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const executeCommand = () => {
      isLocked = true;
      // Escape the command to handle spaces and special characters
      const escapedCmd = cmd.replace(/"/g, '\\"');
      exec(`task ${escapedCmd}`, (error, stdout, stderr) => {
        isLocked = false;
        processQueue();
        
        if (error && !stderr.includes('No matches')) { // Ignore "No matches" error
          console.error('Taskwarrior error:', error);
          console.error('Stderr:', stderr);
          reject(error);
          return;
        }
        resolve(stdout || stderr); // Return stderr if stdout is empty (for "No matches" case)
      });
    };

    if (isLocked) {
      queue.push(executeCommand);
    } else {
      executeCommand();
    }
  });
};
