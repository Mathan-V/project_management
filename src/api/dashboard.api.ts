import api from './axios';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user: string;
}

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const response = await api.get<RecentActivity[]>('/dashboard/recent-activity');
    return response.data;
  },
};