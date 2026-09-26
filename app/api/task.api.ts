import type {
  AddTaskRequestPayload,
  CalendarTasksParams,
  Task,
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
};
