import type {
  AddTaskRequestPayload,
  CalendarTasksParams,
  ChangeTaskStatusPayload,
  EditTaskRequestPayload,
  ExtendTaskDueDatePayload,
  Task,
  TaskContactResponse,
  TaskDealResponse,
  TaskDictionariesResponse,
} from '~/types/task';
import { client } from '~/lib/client';
import type { Note } from '~/types/note';

export const tasksApi = {
  getCalendarTasks: async (params: CalendarTasksParams): Promise<Task[]> => {
    const res = await client.get('/tasks/calendar', {
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
    const res = await client.get('/tasks/dictionaries');
    return res.data.data;
  },

  createTask: async (payload: AddTaskRequestPayload): Promise<void> => {
    await client.post('/tasks', payload);
  },

  getDetails: async (taskId: string) => {
    const res = await client.get(`/tasks/${taskId}`);
    return res.data?.data || res.data?.value || res.data;
  },

  editTask: async (taskId: string, payload: EditTaskRequestPayload) => {
    const res = await client.put(`/tasks/${taskId}`, payload);
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    const res = await client.delete(`/tasks/${taskId}`);
    return res.data;
  },

  changeStatus: async (payload: ChangeTaskStatusPayload | { taskId: string; status: string }) => {
    const response = await client.put('/tasks/change-status', payload);
    return response.data;
  },

  getContact: async (taskId: string): Promise<TaskContactResponse> => {
    const response = await client.get(`/tasks/${taskId}/contact`);
    return response.data?.data || response.data?.value || response.data;
  },

  getDeal: async (taskId: string): Promise<TaskDealResponse> => {
    const response = await client.get(`/tasks/${taskId}/deal`);
    return response.data?.data || response.data?.value || response.data;
  },

  extendDueDate: async (taskId: string, payload: ExtendTaskDueDatePayload) => {
    const response = await client.put(`/tasks/${taskId}/extend-due-date`, payload);
    return response.data;
  },

  changeAssignee: async (taskId: string, newAssigneeId: string) => {
    const response = await client.put(`/tasks/${taskId}/change-assigned-user/${newAssigneeId}`);
    return response.data;
  },

  getTaskNotes: async (taskId: string): Promise<Note[]> => {
    const response = await client.get(`/tasks/${taskId}/notes`);
    return response.data?.data || response.data?.value || response.data || [];
  },
};
