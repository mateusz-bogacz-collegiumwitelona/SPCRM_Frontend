import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Filter, ListTodo, Pencil, Plus, Trash2, User } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { TablePagination } from '~/components/table/table-pagination';
import { TableEmptyState, TableLoadingState } from '~/components/table/table-state-views';
import {
  getTaskPriorityBadgeClass,
  getTaskStatusBadgeClass,
  resolveTaskPriorityLabel,
  resolveTaskStatusLabel,
} from '~/constants/task-helpers';
import { AddTaskDialog } from '~/components/task/dialogs/add-task-dialog';
import { DeleteTaskDialog } from '~/components/task/dialogs/delete-task-dialog';
import { EditTaskDialog } from '~/components/task/dialogs/edit-task-dialog';
import type { AddTaskRequestPayload, EditTaskRequestPayload, SaleTaskResponse } from '~/types/task';
import { useDealTaskMutations, useDealTasks, useTaskDictionaries } from '~/hooks/use-tasks';
import { useDebounce } from '~/hooks/use-debounce';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

export const DealTasks = ({ dealId }: { dealId: string }) => {
  const { dictionaries, getStatusLabel, getPriorityLabel } = useTaskDictionaries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<SaleTaskResponse | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<SaleTaskResponse | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, statusFilter, priorityFilter, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useDealTasks(dealId, {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    status: statusFilter,
    priority: priorityFilter,
  });

  const { addDealTaskMutation, editDealTaskMutation, deleteDealTaskMutation } =
    useDealTaskMutations(dealId);

  const tasks: SaleTaskResponse[] = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || tasks.length;

  const handleSaveTask = async (payload: AddTaskRequestPayload) => {
    await addDealTaskMutation.mutateAsync(payload);
    setIsAddModalOpen(false);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    await deleteDealTaskMutation.mutateAsync(taskToDelete.id);
    setTaskToDelete(null);
  };

  const handleEditTask = async (taskId: string, payload: EditTaskRequestPayload) => {
    await editDealTaskMutation.mutateAsync({ taskId, payload });
    setTaskToEdit(null);
  };

  let taskListContent: React.ReactNode;

  if (isLoading) {
    taskListContent = <TableLoadingState message="Ładowanie zadań..." />;
  } else if (tasks.length === 0) {
    taskListContent = <TableEmptyState message="Brak przypisanych zadań do tej sprzedaży." />;
  } else {
    taskListContent = (
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-xs transition-all bg-white"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <Link
                to={`/task/${task.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-brand hover:underline line-clamp-1 flex-1"
              >
                {task.title}
              </Link>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTaskPriorityBadgeClass(task.priority)}`}
                >
                  {resolveTaskPriorityLabel(task.priority, getPriorityLabel)}
                </span>

                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTaskStatusBadgeClass(task.status)}`}
                >
                  {resolveTaskStatusLabel(task.status, getStatusLabel)}
                </span>

                <button
                  type="button"
                  onClick={() => setTaskToDelete(task)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                  title="Usuń zadanie"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setTaskToEdit(task)}
                  className="text-gray-400 hover:text-brand p-1 rounded transition-colors"
                  title="Edytuj zadanie"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 gap-y-1 mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{new Date(task.dueAt).toLocaleDateString('pl-PL')}</span>
              </div>

              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate max-w-30">
                  {task.assignedToFirstName} {task.assignedToLastName}
                </span>
              </div>

              {task.contactFirstName && (
                <span className="text-[11px] text-gray-400 italic">
                  Dotyczy: {task.contactFirstName} {task.contactLastName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="p-3.5 border-b border-gray-200 bg-gray-50/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Zadania</h2>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              {totalItems}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 flex items-center gap-1.5 bg-brand text-white hover:bg-blue-800 text-xs shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dodaj zadanie</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj zadania..."
              className="w-full border border-gray-300 rounded-md bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="relative shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7.5 flex items-center gap-1.5 border-gray-300 text-xs text-gray-700 bg-white"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtry</span>
              {(statusFilter || priorityFilter) && (
                <span className="w-2 h-2 rounded-full bg-brand" />
              )}
            </Button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 space-y-3">
                <div>
                  <label
                    htmlFor="deal-tasks-status-filter"
                    className="text-xs font-medium text-gray-700 mb-1 block"
                  >
                    Status
                  </label>
                  <select
                    id="deal-tasks-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                  >
                    <option value="">Wszystkie</option>
                    {dictionaries?.statuses?.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    )) ?? (
                      <>
                        <option value="ToDo">Do zrobienia</option>
                        <option value="InProgress">W trakcie</option>
                        <option value="Complete">Zakończone</option>
                        <option value="Break">Wstrzymane</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="deal-tasks-priority-filter"
                    className="text-xs font-medium text-gray-700 mb-1 block"
                  >
                    Priorytet
                  </label>
                  <select
                    id="deal-tasks-priority-filter"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                  >
                    <option value="">Wszystkie</option>
                    {dictionaries?.priorities?.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    )) ?? (
                      <>
                        <option value="Low">Niski</option>
                        <option value="Medium">Średni</option>
                        <option value="High">Wysoki</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('');
                      setPriorityFilter('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 underline"
                  >
                    Wyczyść
                  </button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-brand text-white px-2.5"
                    onClick={() => setShowFilters(false)}
                  >
                    Zamknij
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <QueryErrorBanner
        error={queryError}
        fallbackMessage="Nie udało się pobrać danych zamówienia."
        className="mb-6"
      />

      <div className="p-4 space-y-4">
        {taskListContent}

        {!isLoading && totalItems > 0 && (
          <TablePagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            isFetching={isFetching}
            onPageChange={setPageNumber}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        )}
      </div>

      <AddTaskDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTask}
        isLoading={addDealTaskMutation.isPending}
        dialogTitle="Dodaj zadanie do sprzedaży"
      />

      <DeleteTaskDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTaskConfirm}
        isLoading={deleteDealTaskMutation.isPending}
        taskTitle={taskToDelete?.title}
      />

      <EditTaskDialog
        isOpen={Boolean(taskToEdit)}
        onClose={() => setTaskToEdit(null)}
        taskId={taskToEdit?.id ?? null}
        onSave={handleEditTask}
        isLoading={editDealTaskMutation.isPending}
      />
    </div>
  );
};
