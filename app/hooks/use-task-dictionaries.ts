import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

export interface DictionaryItem {
  value: string;
  label: string;
}

export interface TaskDictionariesData {
  statuses: DictionaryItem[];
  priorities: DictionaryItem[];
}

export const useTaskDictionaries = () => {
  const { data: dictionaries, isLoading } = useQuery<TaskDictionariesData>({
    queryKey: ['task-dictionaries'],
    queryFn: async () => {
      const res = await api.get('/tasks/dictionaries');
      return res.data?.data || res.data;
    },
    staleTime: Infinity,
  });

  const getStatusLabel = (statusValue: string) => {
    if (!dictionaries?.statuses) return statusValue;
    const found = dictionaries.statuses.find(
      (s) => s.value.toLowerCase() === statusValue.toLowerCase(),
    );
    return found ? found.label : statusValue;
  };

  const getPriorityLabel = (priorityValue: string) => {
    if (!dictionaries?.priorities) return priorityValue;
    const found = dictionaries.priorities.find(
      (p) => p.value.toLowerCase() === priorityValue.toLowerCase(),
    );
    return found ? found.label : priorityValue;
  };

  return {
    dictionaries,
    isLoading,
    getStatusLabel,
    getPriorityLabel,
  };
};
