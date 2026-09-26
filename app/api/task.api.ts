import type {
  AddTaskRequestPayload,
  CalendarTasksParams,
  ChangeTaskStatusPayload,
  DealTasksParams,
  EditTaskRequestPayload,
  ExtendTaskDueDatePayload,
  Task,
  TaskContactResponse,
  TaskDealResponse,
  TaskDictionariesResponse,
} from '~/interfaces/task';
import { api } from '~/api/api';

export const tasksApi = {
  getCalendarTasks: async (params: CalendarTasksParams): Promise<Task[]> => {
    const res = await api.get('/tasks/calendar', {
      params: {
        DateFrom: params.dateFrom,
        DateTo: params.dateTo,
        TaskStatus: params.status || undefined,
        TaskPriority: params.priority || undefined,
      },
    });
    return res.data.data;
  },

  getDictionaries: async (): Promise<TaskDictionariesResponse> => {
    const res = await api.get('/tasks/dictionaries');
    return res.data.data;
  },

  createTask: async (payload: AddTaskRequestPayload): Promise<void> => {
    await api.post('/tasks', payload);
  },

  getDetails: async (taskId: string) => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data?.data || res.data?.value || res.data;
  },

  getContactTasks: async (
    contactId: string,
    params: { pageNumber: number; pageSize: number; searchTerm?: string },
  ) => {
    const res = await api.get(`/contacts/${contactId}/tasks`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
      },
    });
    return res.data?.value || res.data?.data || res.data;
  },

  addContactTask: async (contactId: string, payload: AddTaskRequestPayload) => {
    const res = await api.post(`/contacts/${contactId}/tasks`, payload);
    return res.data;
  },

  getDealTasks: async (dealId: string, params: DealTasksParams) => {
    const res = await api.get(`/sales/${dealId}/tasks`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        Status: params.status || undefined,
        Priority: params.priority || undefined,
      },
    });
    return res.data?.value || res.data?.data || res.data;
  },

  addDealTask: async (dealId: string, payload: AddTaskRequestPayload) => {
    const res = await api.post(`/sales/${dealId}/tasks`, payload);
    return res.data;
  },

  editTask: async (taskId: string, payload: EditTaskRequestPayload) => {
    const res = await api.put(`/tasks/${taskId}`, payload);
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
  },

  changeStatus: async (payload: ChangeTaskStatusPayload | { taskId: string; status: string }) => {
    const response = await api.put('/tasks/change-status', payload);
    return response.data;
  },

  getContact: async (taskId: string): Promise<TaskContactResponse> => {
    const response = await api.get(`/tasks/${taskId}/contact`);
    return response.data?.data || response.data?.value || response.data;
  },

  getDeal: async (taskId: string): Promise<TaskDealResponse> => {
    const response = await api.get(`/tasks/${taskId}/deal`);
    return response.data?.data || response.data?.value || response.data;
  },

  extendDueDate: async (taskId: string, payload: ExtendTaskDueDatePayload) => {
    const response = await api.put(`/tasks/${taskId}/extend-due-date`, payload);
    return response.data;
  },

  changeAssignee: async (taskId: string, newAssigneeId: string) => {
    const response = await api.put(`/tasks/${taskId}/change-assigned-user/${newAssigneeId}`);
    return response.data;
  },
};
