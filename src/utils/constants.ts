export const TASK_STATUS = {
  todo: { label: 'To Do', color: 'bg-gray-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500' },
  done: { label: 'Done', color: 'bg-green-500' },
  blocked: { label: 'Blocked', color: 'bg-red-500' },
} as const;

export const PRIORITY = {
  low: { label: 'Low', color: 'bg-gray-300' },
  medium: { label: 'Medium', color: 'bg-yellow-500' },
  high: { label: 'High', color: 'bg-red-500' },
} as const;

export const PROJECT_STATUS = {
  active: { label: 'Active', color: 'bg-green-500' },
  completed: { label: 'Completed', color: 'bg-blue-500' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-500' },
} as const;

export const ROLES = {
  admin: 'Admin',
  manager: 'Manager',
  user: 'User',
} as const;