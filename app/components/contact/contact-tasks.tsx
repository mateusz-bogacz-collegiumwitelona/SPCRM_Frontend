import React, { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import {
  getTaskPriorityBadgeClass,
  getTaskStatusBadgeClass,
  resolveTaskPriorityLabel,
  resolveTaskStatusLabel,
} from '~/utils/task-helpers';
import { AddTaskDialog } from '~/components/task/dialogs/add-task-dialog';
import { EditTaskDialog } from '~/components/task/dialogs/edit-task-dialog';
import { DeleteTaskDialog } from '~/components/task/dialogs/delete-task-dialog';
import type { ContactTaskItem } from '~/interfaces/contact';
import type { AddTaskRequestPayload, EditTaskRequestPayload } from '~/interfaces/task';

interface TaskTableMeta {
  onEdit: (task: ContactTaskItem) => void;
  onDelete: (task: ContactTaskItem) => void;
}

const columnHelper = createColumnHelper<ContactTaskItem>();

export const ContactTasks: React.FC<{ contactId: string }> = ({ contactId }) => {
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [accumulatedMobileTasks, setAccumulatedMobileTasks] = useState<ContactTaskItem[]>([]);
  const isMobileAppend = useRef(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ContactTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<ContactTaskItem | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['contact-tasks', { contactId, pageNumber, pageSize, debouncedSearch }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };
      const response = await api.get(`/contacts/${contactId}/tasks`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: !!contactId,
    placeholderData: keepPreviousData,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (payload: AddTaskRequestPayload) => {
      await api.post(`/contacts/${contactId}/tasks`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contact-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setIsAddModalOpen(false);
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: EditTaskRequestPayload;
    }) => {
      await api.put(`/tasks/${taskId}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contact-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contact-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      setDeletingTask(null);
    },
  });

  const desktopTasks: ContactTaskItem[] = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || desktopTasks.length;

  const mergeTasks = (
    existing: ContactTaskItem[],
    incoming: ContactTaskItem[],
  ): ContactTaskItem[] => {
    const existingIds = new Set(existing.map((item) => item.id));
    const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
    return [...existing, ...uniqueIncoming];
  };

  useEffect(() => {
    const items = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileTasks(items);
      return;
    }

    setAccumulatedMobileTasks((prev) => mergeTasks(prev, items));
  }, [data, pageNumber]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };

  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Zadanie',
        cell: (info) => {
          const task = info.row.original;
          return (
            <div className="flex flex-col">
              <Link to={`/task/${task.id}`} className="font-medium text-blue-900 hover:underline">
                {task.title}
              </Link>
              {task.dealId && task.dealName && (
                <Link
                  to={`/sales/${task.dealId}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-900 hover:underline mt-0.5"
                >
                  <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{task.dealName}</span>
                </Link>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getTaskStatusBadgeClass(
                status,
              )}`}
            >
              {resolveTaskStatusLabel(status)}
            </span>
          );
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Priorytet',
        cell: (info) => {
          const priority = info.getValue();
          return (
            <span
              className={`px-2 py-0.5 rounded border text-xs font-semibold ${getTaskPriorityBadgeClass(
                priority,
              )}`}
            >
              {resolveTaskPriorityLabel(priority)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'assignedTo',
        header: 'Przypisany',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="text-gray-700 text-sm">
              {row.assignedToFirstName} {row.assignedToLastName}
            </span>
          );
        },
      }),
      columnHelper.accessor('dueAt', {
        header: 'Termin',
        cell: (info) => {
          const date = new Date(info.getValue());
          return <span className="text-gray-500 text-xs">{format(date, 'dd.MM.yyyy HH:mm')}</span>;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Akcje',
        cell: (info) => {
          const meta = info.table.options.meta as TaskTableMeta;
          const task = info.row.original;

          return (
            <div className="flex items-center gap-3">
              <Link
                to={`/task/${task.id}`}
                className="text-blue-900 font-medium text-sm hover:underline"
              >
                Szczegóły
              </Link>
              <button
                type="button"
                onClick={() => meta.onEdit(task)}
                className="text-gray-500 font-medium text-sm hover:text-blue-900 hover:underline"
              >
                Edytuj
              </button>
              <button
                type="button"
                onClick={() => meta.onDelete(task)}
                className="text-gray-500 font-medium text-sm hover:text-red-600 hover:underline"
              >
                Usuń
              </button>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: desktopTasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (task: ContactTaskItem) => setEditingTask(task),
      onDelete: (task: ContactTaskItem) => setDeletingTask(task),
    } satisfies TaskTableMeta,
  });

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const listError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy zadań.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900 mb-2" />
          <p className="text-gray-500 text-sm">Wczytywanie zadań...</p>
        </div>
      );
    }

    if (!desktopTasks || desktopTasks.length === 0) {
      return (
        <div className="text-center py-10 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center gap-3">
          <CheckSquare className="h-8 w-8 text-gray-300" />
          <p className="text-gray-500 font-medium text-sm">Brak zadań dla tego kontaktu.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 text-blue-900 border-gray-300"
          >
            <Plus className="w-4 h-4 mr-2" /> Dodaj pierwsze zadanie
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="block lg:hidden space-y-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-normal text-gray-800">Zadania</h2>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                {totalItems}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Dodaj
            </Button>
          </div>

          <div className="relative w-full mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj zadań..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
            />
          </div>

          {accumulatedMobileTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col space-y-2.5"
            >
              <div className="flex justify-between items-start gap-2">
                <Link
                  to={`/task/${task.id}`}
                  className="text-sm font-bold text-blue-900 hover:underline"
                >
                  {task.title}
                </Link>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${getTaskStatusBadgeClass(
                    task.status,
                  )}`}
                >
                  {resolveTaskStatusLabel(task.status)}
                </span>
              </div>

              {task.dealId && task.dealName && (
                <Link
                  to={`/sales/${task.dealId}`}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-900 hover:underline"
                >
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <span>Transakcja: {task.dealName}</span>
                </Link>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {task.assignedToFirstName} {task.assignedToLastName}
                  </span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded border text-[11px] font-semibold ${getTaskPriorityBadgeClass(
                    task.priority,
                  )}`}
                >
                  {resolveTaskPriorityLabel(task.priority)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>Termin: {format(new Date(task.dueAt), 'dd.MM.yyyy HH:mm')}</span>
              </div>

              <div className="flex gap-2 w-full pt-2 border-t border-gray-100">
                <Link
                  to={`/task/${task.id}`}
                  className="flex-1 text-center py-1.5 text-xs font-medium text-blue-900 border border-gray-200 rounded-md hover:bg-gray-50 bg-white"
                >
                  Szczegóły
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTask(task)}
                  className="flex-1 text-xs text-gray-700 border-gray-200 hover:bg-gray-50"
                >
                  Edytuj
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingTask(task)}
                  className="flex-1 text-xs text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-red-600"
                >
                  Usuń
                </Button>
              </div>
            </div>
          ))}

          {pageNumber < totalPages && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleMobileLoadMore}
                disabled={isFetching}
                className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Pokaż starsze zadania'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="hidden lg:flex bg-white border border-gray-200 rounded-lg shadow-sm flex-col">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
              <h2 className="text-xl font-normal text-gray-800 shrink-0">Zadania</h2>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                {totalItems}
              </span>
              <div className="relative w-full max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Szukaj zadań..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                />
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" /> Dodaj zadanie
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-gray-200 px-6 py-4 text-sm font-semibold text-gray-900"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-gray-700 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-b-lg border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pozycji na stronie:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:ring-blue-900"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Wyświetlanie {Math.min((pageNumber - 1) * pageSize + 1, totalItems)} do{' '}
              {Math.min(pageNumber * pageSize, totalItems)} z {totalItems} wyników
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDesktopPageChange(Math.max(pageNumber - 1, 1))}
                disabled={pageNumber === 1 || isFetching}
                variant="outline"
                size="icon"
                className="h-8 w-8 text-blue-900 border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 px-2">
                Strona {pageNumber} z {totalPages}
              </span>
              <Button
                onClick={() => handleDesktopPageChange(Math.min(pageNumber + 1, totalPages))}
                disabled={pageNumber === totalPages || isFetching}
                variant="outline"
                size="icon"
                className="h-8 w-8 text-blue-900 border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {listError && (
          <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 pr-4">
              <p className="font-medium leading-tight">{listError.title}</p>
              {listError.details && listError.details.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                  {listError.details.map((detailErr, idx) => (
                    <li key={idx}>{detailErr}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsErrorDismissed(true)}
              className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
              title="Zamknij"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {renderContent()}
      </div>

      <AddTaskDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (payload) => {
          await addTaskMutation.mutateAsync(payload);
        }}
        isLoading={addTaskMutation.isPending}
        dialogTitle="Dodaj zadanie do kontaktu"
      />

      <EditTaskDialog
        isOpen={!!editingTask}
        taskId={editingTask?.id || null}
        onClose={() => setEditingTask(null)}
        onSave={async (taskId, payload) => {
          await editTaskMutation.mutateAsync({ taskId, payload });
        }}
        isLoading={editTaskMutation.isPending}
      />

      <DeleteTaskDialog
        isOpen={!!deletingTask}
        taskTitle={deletingTask?.title}
        onClose={() => setDeletingTask(null)}
        onConfirm={async () => {
          if (deletingTask) {
            await deleteTaskMutation.mutateAsync(deletingTask.id);
          }
        }}
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  );
};
