export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  subtasks?: any[];
  task_assignments?: any[];
}
