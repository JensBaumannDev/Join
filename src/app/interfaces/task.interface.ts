export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string
  category: string;
  status: string;
  priority: string;
  subtasks?: any[];
  assigned_to: string[]
  task_assignments?: any[];
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  completed: boolean
}