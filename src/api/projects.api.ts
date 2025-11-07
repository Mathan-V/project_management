import api from './axios';
import type { Project, PaginatedResponse, ProjectFilters, PaginationParams } from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const projectsAPI = {
  
  getProjects: async (params?: PaginationParams & ProjectFilters): Promise<PaginatedResponse<Project>> => {
    const response = await api.get<PaginatedResponse<Project>>(API_ENDPOINTS.PROJECTS.GET_ALL, { params });
    return response.data;
  },

  getProjectById: async (project_id: string): Promise<Project> => {
    const response = await api.get<Project>(
      API_ENDPOINTS.PROJECTS.GET_SINGLE.replace('{project_id}', String(project_id))
    );
    return response.data;
  },


  createProject: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const response = await api.post<Project>(API_ENDPOINTS.PROJECTS.CREATE, projectData);
    return response.data;
  },

  updateProject: async (project_id: string, projectData: Partial<Project>): Promise<Project> => {
    const response = await api.put<Project>(
      API_ENDPOINTS.PROJECTS.GET_SINGLE.replace('{project_id}', String(project_id)),
      projectData
    );
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.PROJECTS.GET_SINGLE.replace('{project_id}', String(id)));
  },

  addProjectMember: async (projectId: string, userId: string): Promise<Project> => {
    const response = await api.post<Project>(`/projects/${projectId}/members`, { userId });
    return response.data;
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<Project> => {
    const response = await api.delete<Project>(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },
};
