export interface Task {
  id: number;
  uuid: string;
  description: string;
  status: string;
  project?: string;
  tags?: string[];
  urgency: number;
  due?: string;
  start?: string;  // ISO date string when the task was started
  priority?: 'H' | 'M' | 'L' | '';  // Taskwarrior priority levels
  end?: string;       // Task completion date
  modified?: string;  // Last modification date
  entry?: string;     // Task creation date
  depends?: string[]; // Task dependencies
  annotations?: string[]; // Task notes/annotations
  wait?: string;     // Wait date
}