export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateProject = (project: any): string[] => {
  const errors: string[] = [];
  
  if (!validateRequired(project.name)) {
    errors.push('Project name is required');
  }
  
  if (!validateRequired(project.description)) {
    errors.push('Project description is required');
  }
  
  if (!project.startDate) {
    errors.push('Start date is required');
  }
  
  if (!project.endDate) {
    errors.push('End date is required');
  }
  
  return errors;
};

export const validateTask = (task: any): string[] => {
  const errors: string[] = [];
  
  if (!validateRequired(task.title)) {
    errors.push('Task title is required');
  }
  
  if (!task.projectId) {
    errors.push('Project is required');
  }
  
  if (!task.assignedTo) {
    errors.push('Assignee is required');
  }
  
  if (!task.dueDate) {
    errors.push('Due date is required');
  }
  
  return errors;
};