import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

export const useTaskDictionaries = () => {
  const { data: dictionaries, isLoading } = useQuery({
    queryKey: ['task-dictionaries'],
    queryFn: async () => {
      const res = await api.get('/tasks/dictionaries');
      return res.data.data;
    },
    staleTime: Infinity,
  });

  const getStatusLabel = (statusValue: string) => {
    if (!dictionaries?.statuses) return statusValue;
    const found = dictionaries.statuses.find(
      (s: { value: string; label: string }) => s.value === statusValue,
    );
    return found ? found.label : statusValue;
  };

  const getPriorityLabel = (priorityValue: string) => {
    if (!dictionaries?.priorities) return priorityValue;
    const found = dictionaries.priorities.find(
      (p: { value: string; label: string }) => p.value === priorityValue,
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
