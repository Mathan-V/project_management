export interface User {
  id: number;
  user_name: string;
  password: string;
  email: string;
  rolename: string;
  status: string;
  is_active: boolean;
  role_id: number | null;
  created_at: string;
  role: {
      id: number;
      name: string;
      is_enabled: boolean;
      created_at: string;
    };
}

export interface Role {
  description: string;
  permissions: any;
  id: number;
  name: string;
  is_enabled: boolean;
  created_at: string;

}

export interface BackendProject {
  id: number;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  client_id: number | null;
  user_id: number | null;
  user: any;
  client: { name: string } | null;
  timesheets: Array<{
    id: number;
    description: string;
    start_date: string;
    end_date: string;
    duration: number;
    status: string;
    projectId: number;
    userId: number;
  }>;
}

export interface Client {
  id : number;
  name : string;
  createdAt : string;
  address : string;
  contact : string;
  email : string;
  notes : string;
  is_enabled : boolean;

}

export interface TimeEntry {
  [key: string]: string;

}

export interface TimesheetEntry{
  id: number;
  description : string;
  start_date: string;
  end_date: string;
  duration: number;
  status: string;
  projectId: number;
  userId: number;
  created_by: string;
  project: string;
  user: string;
  creator: string;
}


export interface Project {
  project_name: string | number | readonly string[] | undefined;
  id: number;
  name: string;
  is_enabled : boolean;
  description: string;
  start_date: string;
  end_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  client_id: number | null;
  timeEntries: TimeEntry; // date as key, time as value (HH:MM:SS)
  // Add these if you want to persist UI state
  color?: string;
  is_public?: boolean;
  is_billable?: boolean;
  is_favorite?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string; // user ID
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  actualHours?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  user_name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}


export interface PaginatedResponse<T> {
  results: PaginatedResponse<Role>;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface ProjectFilters {
  status?: string;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TaskFilters {
  status?: string;
  projectId?: string;
  assignedTo?: string;
  priority?: string;
  dueDate?: string;
  search?: string;
}

export interface TimesheetFilters {
  status?: string;
  projectId?: string;
  assignedTo?: string;
  priority?: string;
  dueDate?: string;
  search?: string;
}

export interface EventType {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  project?: string;
  tags?: string[];
  billable?: boolean;
}



export interface AppContextType {
  events: EventType[];
  projects: Project[];
  addEvent: (event: EventType) => void;
  updateEvent: (id: number, event: Partial<EventType>) => void;
  deleteEvent: (id: number) => void;
  updateProjects: (projects: Project[]) => void;
}