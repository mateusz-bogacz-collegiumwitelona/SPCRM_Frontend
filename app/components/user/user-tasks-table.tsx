import React, { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Calendar,
  CheckSquare,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Button } from '~/components/ui/button';
import {
  FALLBACK_TASK_PRIORITY_LABELS,
  FALLBACK_TASK_STATUS_LABELS,
  getTaskPriorityBadgeClass,
  getTaskStatusBadgeClass,
  resolveTaskPriorityLabel,
  resolveTaskStatusLabel,
} from '~/constants/task-helpers';
import type { DictionaryItem, UserTaskItem } from '~/types/task';
import { useTaskDictionaries } from '~/hooks/use-tasks';
import { useUserTasks } from '~/hooks/use-users';
import { CompactTable } from '~/components/table/compact-table';
import { useDebounce } from '~/hooks/use-debounce';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

const PAGE_SIZE = 5;

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: pl });
};

interface UserTasksTableMeta {
  getStatusLabel?: (val: string) => string;
  getPriorityLabel?: (val: string) => string;
}

const columnHelper = createColumnHelper<UserTaskItem>();

const columns = [
  columnHelper.accessor('title', {
    header: 'Tytuł zadania',
    cell: (info) => {
      const row = info.row.original;
      const isOverdue = new Date(row.dueAt) < new Date() && row.status.toLowerCase() !== 'complete';
      return (
        <div className="leading-tight py-0.5">
          <span className="font-semibold text-blue-900 text-sm truncate max-w-47.5 sm:max-w-xs block">
            {row.title}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDate(row.dueAt)} {isOverdue && '(Po terminie)'}
            </span>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor('priority', {
    header: 'Priorytet',
    cell: (info) => {
      const raw = info.getValue();
      const meta = info.table.options.meta as UserTasksTableMeta;
      return (
        <span
          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${getTaskPriorityBadgeClass(
            raw,
          )}`}
        >
          {resolveTaskPriorityLabel(raw, meta?.getPriorityLabel)}
        </span>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const raw = info.getValue();
      const meta = info.table.options.meta as UserTasksTableMeta;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${getTaskStatusBadgeClass(
            raw,
          )}`}
        >
          {resolveTaskStatusLabel(raw, meta?.getStatusLabel)}
        </span>
      );
    },
  }),
];

const statusTranslate = (value: string): string => {
  const statuses: Record<string, string> = {
    todo: 'ToDo',
    inprogress: 'InProgress',
    complete: 'Complete',
  };
  return statuses[value] ?? 'Break';
};

const mapFallbackPriority = (value: string): string => {
  if (value === 'low') return 'Low';
  if (value === 'medium') return 'Medium';
  return 'High';
};

export const UserTasksTable = ({ userId }: { readonly userId: string }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('dueat');
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const { dictionaries, getStatusLabel, getPriorityLabel } = useTaskDictionaries();

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, statusFilter, priorityFilter]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useUserTasks({
    userId,
    pageNumber,
    pageSize: PAGE_SIZE,
    debouncedSearch,
    sortBy,
    sortDescending,
    statusFilter,
    priorityFilter,
  });

  const tasks = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || tasks.length;

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      getStatusLabel,
      getPriorityLabel,
    } satisfies UserTasksTableMeta,
  });

  const isFilterActive = Boolean(statusFilter || priorityFilter);

  const statusOptions: DictionaryItem[] = useMemo(() => {
    if (dictionaries?.statuses && dictionaries.statuses.length > 0) {
      return dictionaries.statuses;
    }
    return Object.entries(FALLBACK_TASK_STATUS_LABELS).map(([value, label]) => ({
      value: statusTranslate(value),
      label,
    }));
  }, [dictionaries]);

  const priorityOptions: DictionaryItem[] = useMemo(() => {
    if (dictionaries?.priorities && dictionaries.priorities.length > 0) {
      return dictionaries.priorities;
    }
    return Object.entries(FALLBACK_TASK_PRIORITY_LABELS).map(([value, label]) => ({
      value: mapFallbackPriority(value),
      label,
    }));
  }, [dictionaries]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <CheckSquare className="w-4 h-4 text-blue-900" />
          <h2 className="text-sm font-semibold text-gray-900">Przypisane zadania</h2>
          <span className="text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-medium">
            {totalItems}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj zadania..."
              className="w-full border border-gray-300 rounded-md bg-white pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="dueat">Termin</option>
              <option value="title">Tytuł</option>
              <option value="priority">Priorytet</option>
              <option value="status">Status</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSortDescending(!sortDescending)}
              className="h-7 w-7 border-gray-300 text-gray-600 hover:bg-gray-100"
              title={sortDescending ? 'Malejąco' : 'Rosnąco'}
            >
              {sortDescending ? (
                <ArrowDownWideNarrow className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpNarrowWide className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 px-2.5 flex items-center gap-1.5 border-gray-300 text-gray-700 text-xs hover:bg-gray-100"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtry</span>
              {isFilterActive && <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />}
            </Button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                  <span className="font-semibold text-gray-800">Filtruj zadania</span>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label htmlFor="user-tasks-filter-status" className="block text-gray-500 mb-1">
                    Status:
                  </label>
                  <select
                    id="user-tasks-filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="">Wszystkie statusy</option>
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="user-tasks-filter-priority" className="block text-gray-500 mb-1">
                    Priorytet:
                  </label>
                  <select
                    id="user-tasks-filter-priority"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="">Wszystkie priorytety</option>
                    {priorityOptions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('');
                      setPriorityFilter('');
                    }}
                    className="text-gray-500 hover:text-gray-800 underline"
                  >
                    Wyczyść
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="h-6 px-3 bg-blue-900 text-white text-[11px]"
                  >
                    Gotowe
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

      <CompactTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        totalItems={totalItems}
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
        emptyMessage="Brak przypisanych zadań spełniających kryteria"
        loadingMessage="Wczytywanie zadań..."
      />
    </div>
  );
};
