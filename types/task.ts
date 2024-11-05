export interface Task {
  id: number;
  description: string;
  status: string;
  project?: string;
  tags?: string[];
  urgency: number;
  due?: string;
}