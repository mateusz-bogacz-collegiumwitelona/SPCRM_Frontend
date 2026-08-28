import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';

import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { DeleteSteelGradeDialog } from '~/components/steel-grade/delete-steel-grade-dialog';
import {
  EditSteelGradeDialog,
  type EditSteelGradePayload,
} from '~/components/steel-grade/edit-steel-grade-dialog';
import {
  AddSteelGradeDialog,
  type AddSteelGradePayload,
} from '~/components/steel-grade/add-steel-grade-dialog';

interface SteelGradeListResponse {
  id: string;
  name: string;
  standard?: string | null;
  density: number;
}

interface SteelGradeTableMeta {
  onEdit: (grade: SteelGradeListResponse) => void;
  onDelete: (grade: { id: string; name: string }) => void;
}

const columnHelper = createColumnHelper<SteelGradeListResponse>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Gatunek stali',
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('standard', {
    header: 'Norma',
    cell: (info) => {
      const val = info.getValue();
      return val ? (
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
          {val}
        </span>
      ) : (
        <span className="text-gray-400 italic">Brak</span>
      );
    },
  }),
  columnHelper.accessor('density', {
    header: 'Gęstość',
    cell: (info) => (
      <span className="text-gray-700 font-medium">
        {info.getValue()} <span className="text-gray-500 font-normal text-xs">g/cm³</span>
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const grade = info.row.original;
      const meta = info.table.options.meta as SteelGradeTableMeta;

      return (
        <div className="flex items-center justify-start gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-[#004a8f]"
              >
                <span className="sr-only">Otwórz menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40 bg-white">
              <DropdownMenuItem
                onClick={() => meta.onEdit(grade)}
                className="cursor-pointer text-sm text-gray-700 focus:bg-gray-50"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                <span>Edytuj</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => meta.onDelete({ id: grade.id, name: grade.name })}
                className="cursor-pointer text-sm text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Usuń</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  }),
];

const mergeSteelGrades = (
  existing: SteelGradeListResponse[],
  incoming: SteelGradeListResponse[],
): SteelGradeListResponse[] => {
  const existingIds = new Set(existing.map((item) => item.id));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
  return [...existing, ...uniqueIncoming];
};

interface SteelGradeMobileCardProps {
  readonly item: SteelGradeListResponse;
  readonly onDelete: (grade: { id: string; name: string }) => void;
}

const SteelGradeMobileCard = ({ item, onDelete }: SteelGradeMobileCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm font-bold text-blue-900">{item.name}</p>
      {item.standard && (
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">
          {item.standard}
        </span>
      )}
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2 text-gray-600">
      <span>Gęstość:</span>
      <span className="font-semibold text-gray-900">{item.density} g/cm³</span>
    </div>
    <div className="flex justify-end pt-2 mt-2 border-t border-gray-50">
      <button
        type="button"
        onClick={() => onDelete({ id: item.id, name: item.name })}
        className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
      >
        <Trash2 className="w-3.5 h-3.5" /> Usuń
      </button>
    </div>
  </div>
);

export default function SteelGradesList() {
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [deletingGrade, setDeletingGrade] = useState<{ id: string; name: string } | null>(null);
  const [editingGrade, setEditingGrade] = useState<SteelGradeListResponse | null>(null);
  const [addingGrade, setAddingGrade] = useState(false);

  const [accumulatedMobileItems, setAccumulatedMobileItems] = useState<SteelGradeListResponse[]>(
    [],
  );
  const isMobileAppend = useRef(false);

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      reassignments,
    }: {
      id: string;
      reassignments: { productId: string; newSteelGradeId: string }[];
    }) => {
      await api.delete(`/steel-grade/${id}`, {
        data: { reassignments },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['steel-grades-list'] });
      await queryClient.invalidateQueries({ queryKey: ['product-steel-grades'] });
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setDeletingGrade(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: EditSteelGradePayload) => {
      await api.patch('/steel-grade', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['steel-grades-list'] });
      await queryClient.invalidateQueries({ queryKey: ['product-steel-grades'] });
      setEditingGrade(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: AddSteelGradePayload) => {
      await api.post('/steel-grade', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['steel-grades-list'] });
      await queryClient.invalidateQueries({ queryKey: ['product-steel-grades'] });
      setAddingGrade(false);
    },
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'steel-grades-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
      };

      const response = await api.get('/steel-grade', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopItems = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopItems.length;

  useEffect(() => {
    const items: SteelGradeListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileItems(items);
      return;
    }

    setAccumulatedMobileItems((prev) => mergeSteelGrades(prev, items));
  }, [data, pageNumber]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };

  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };

  const table = useReactTable({
    data: desktopItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (grade) => setEditingGrade(grade),
      onDelete: (grade) => setDeletingGrade(grade),
    } satisfies SteelGradeTableMeta,
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy gatunków stali.',
      )
    : null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-900 mb-4" />
          <p className="text-gray-500 font-medium">Ładowanie gatunków stali...</p>
        </div>
      );
    }

    if (desktopItems.length === 0 && !isError) {
      return (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-500 font-medium">Brak gatunków stali do wyświetlenia.</p>
        </div>
      );
    }

    return (
      <>
        <div className="block lg:hidden space-y-4">
          {accumulatedMobileItems.map((item) => (
            <SteelGradeMobileCard key={item.id} item={item} onDelete={setDeletingGrade} />
          ))}

          {pageNumber < totalPages && (
            <div className="mt-6 flex justify-center pt-2">
              <Button
                onClick={handleMobileLoadMore}
                disabled={isFetching}
                className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 h-11"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Wczytywanie danych...
                  </>
                ) : (
                  'Pokaż więcej wyników'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="hidden lg:block space-y-4">
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pozycji na stronie:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 text-gray-700 shadow-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
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
                className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
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
                className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
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
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex items-center justify-between gap-4">
            <h1 className="text-lg lg:text-2xl font-semibold flex items-center gap-2">
              Gatunki stali
            </h1>
            <Button
              onClick={() => setAddingGrade(true)}
              className="bg-white text-blue-900 hover:bg-gray-100 flex items-center gap-2 font-medium shrink-0"
            >
              <Plus className="w-4 h-4" />
              Dodaj gatunek stali
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Szukaj gatunku, normy..."
                className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">Sortuj po:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
              >
                <option value="name">Nazwa</option>
                <option value="standard">Norma</option>
                <option value="density">Gęstość</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setSortDescending(!sortDescending)}
                className="shrink-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 px-3"
              >
                {sortDescending ? (
                  <ArrowDownWideNarrow className="w-4 h-4" />
                ) : (
                  <ArrowUpNarrowWide className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {renderContent()}

          <DeleteSteelGradeDialog
            isOpen={Boolean(deletingGrade)}
            steelGradeId={deletingGrade?.id}
            steelGradeName={deletingGrade?.name}
            onClose={() => setDeletingGrade(null)}
            onConfirm={async (reassignments) => {
              if (deletingGrade) {
                await deleteMutation.mutateAsync({
                  id: deletingGrade.id,
                  reassignments,
                });
              }
            }}
            isLoading={deleteMutation.isPending}
          />

          <EditSteelGradeDialog
            isOpen={Boolean(editingGrade)}
            initialData={editingGrade}
            onClose={() => setEditingGrade(null)}
            onSave={async (data) => {
              await editMutation.mutateAsync(data);
            }}
            isLoading={editMutation.isPending}
          />

          <AddSteelGradeDialog
            isOpen={addingGrade}
            onClose={() => setAddingGrade(false)}
            onSave={async (data) => {
              await addMutation.mutateAsync(data);
            }}
            isLoading={addMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
