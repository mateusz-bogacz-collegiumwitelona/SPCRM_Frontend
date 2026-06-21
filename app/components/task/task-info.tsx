import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Calendar, CheckCircle2, AlertCircle, AlignLeft } from 'lucide-react';
import { useTaskDictionaries } from '~/hooks/use-task-dictionaries';

export const TaskInfo = ({ taskId }: { taskId: string }) => {
  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['task-core-details', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data.data;
    },
  });

  const { getStatusLabel, getPriorityLabel } = useTaskDictionaries();

  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (isError || !task)
    return <div className="text-red-500 mb-6">Nie udało się pobrać danych zadania.</div>;

  const isCompleted = task.status === 'Complete';
  const isOverdue = new Date(task.dueAt) < new Date() && !isCompleted;

  return (
    <div className="mb-6">
      {/* NAGŁÓWEK */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-3">{task.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              isCompleted ? 'bg-[#d4edda] text-[#28a745]' : 'bg-blue-100 text-[#004a8f]'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {getStatusLabel(task.status)}
          </span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wider">
            {getPriorityLabel(task.priority)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ml-2 ${
              isOverdue ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {new Date(task.dueAt).toLocaleString('pl-PL', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {isOverdue && ' (Zaległe)'}
          </span>
        </div>
      </div>

      {task.description && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-6 mb-6">
          <h2 className="text-xl font-normal text-gray-800 mb-4 flex items-center gap-2">
            <AlignLeft className="text-[#004a8f] w-5 h-5" /> Opis zadania
          </h2>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-100">
            {task.description}
          </div>
        </div>
      )}
    </div>
  );
};
