/** Interface representing a Task object in the application */
export interface Task {
  /** Unique ID of the task */
  id: string;
  /** Title of the task */
  title: string;
  /** Detailed description of the task */
  description: string;
  /** Due date formatted as string */
  due_date: string
  /** Category type (e.g. Technical Task, User Story) */
  category: string;
  /** Status column (e.g. To do, In progress) */
  status: string;
  /** Priority level of the task (e.g. urgent, medium, low) */
  priority: string;
  /** Sorted order position within its status column */
  position?: number;
  /** List of subtasks associated with the task */
  subtasks?: any[];
  /** Array of contact IDs assigned to this task */
  assigned_to: string[]
  /** Enriched assignment objects mapping contact details */
  task_assignments?: any[];
}

/** Interface representing a Subtask of a Task */
export interface Subtask {
  /** Unique ID of the subtask */
  id: string
  /** Associated Task ID */
  task_id: string
  /** Text description of the subtask */
  title: string
  /** Flag representing completion status */
  completed: boolean
}