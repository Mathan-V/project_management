import api from './axios';
import type {
  TimesheetEntry,
  PaginatedResponse,
  TimesheetFilters,
  PaginationParams
} from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const timesheetsAPI = {

  getTimesheetsAll: async (params?: PaginationParams): Promise<PaginatedResponse<TimesheetEntry>> => {
    const response = await api.get<PaginatedResponse<TimesheetEntry>>(API_ENDPOINTS.TIMESHEET.GET_ALL_TIMESHEET, { params });
    return response.data;
  },

  getTimesheetByProject: async (
    projectId: string,
    params?: PaginationParams & TimesheetFilters
  ): Promise<PaginatedResponse<TimesheetEntry>> => {
    const url = API_ENDPOINTS.TIMESHEET.GET_ALL.replace('{project_id}', projectId);
    const response = await api.get<PaginatedResponse<TimesheetEntry>>(url, { params });
    return response.data;
  },

  getTimesheetById: async (id: string): Promise<TimesheetEntry> => {
    const url = API_ENDPOINTS.TIMESHEET.GET_SINGLE.replace('{timesheet_id}', id);
    const response = await api.get<TimesheetEntry>(url);
    return response.data;
  },

  createTimesheet: async (
    timesheetData: Omit<TimesheetEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TimesheetEntry> => {
    const response = await api.post<TimesheetEntry>(
      API_ENDPOINTS.TIMESHEET.CREATE,
      timesheetData
    );
    return response.data;
  },

  updateTimesheet: async (
    id: string,
    timesheetData: Partial<TimesheetEntry>
  ): Promise<TimesheetEntry> => {
    const url = API_ENDPOINTS.TIMESHEET.UPDATE.replace('{timesheet_id}', id);
    const response = await api.put<TimesheetEntry>(url, timesheetData);
    return response.data;
  },

  deleteTimesheet: async (id: string): Promise<void> => {
    const url = API_ENDPOINTS.TIMESHEET.DELETE.replace('{timesheet_id}', id);
    await api.delete(url);
  }
};
