import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { AlertCircle, ArrowDownWideNarrow, ArrowUpNarrowWide, Edit2, Plus, X } from 'lucide-react';
import { api } from '~/api/api';
import { mergeById } from '~/utils/table-helpers';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { AddUnitDialog, type AddUnitRequestPayload } from '~/components/unit/add-unit-dialog';
import { EditUnitDialog, type EditUnitRequestPayload } from '~/components/unit/edit-unit-dialog';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/common/data-table';
import { MainLayout } from '~/components/layout/main-layout';

interface UnitListResponse {
  id: string;
  name: string;
  symbol: string;
  baseMultiplier: number;
}

interface UnitTableMeta {
  onEdit: (unit: UnitListResponse) => void;
}

const columnHelper = createColumnHelper<UnitListResponse>();

const columns = [
  columnHelper.accessor('symbol', {
    header: 'Symbol',
    cell: (info) => (
      <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded text-xs tracking-wider">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('name', {
    header: 'Nazwa',
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('baseMultiplier', {
    header: 'Mnożnik',
    cell: (info) => (
      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const row = info.row.original;
      const meta = info.table.options.meta as UnitTableMeta;

      return (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => meta.onEdit(row)}
            className="text-gray-600 hover:text-blue-900 flex items-center gap-1.5 h-8 px-2"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Edytuj</span>
          </Button>
        </div>
      );
    },
  }),
];

const UnitMobileCard = ({
  unit,
  onEdit,
}: {
  readonly unit: UnitListResponse;
  readonly onEdit: (unit: UnitListResponse) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {unit.symbol}
        </span>
        <p className="text-sm font-semibold text-gray-900">{unit.name}</p>
      </div>
      <button
        type="button"
        onClick={() => onEdit(unit)}
        className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edytuj
      </button>
    </div>
    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
      Mnożnik: <span className="font-medium text-gray-700">{unit.baseMultiplier}</span>
    </div>
  </div>
);

export default function UnitList() {
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<UnitListResponse | null>(null);

  const [accumulatedMobileUnits, setAccumulatedMobileUnits] = useState<UnitListResponse[]>([]);
  const isMobileAppend = useRef(false);

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
      'units-of-measure',
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

      const response = await api.get('/unit', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (payload: AddUnitRequestPayload) => {
      await api.post('/unit', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['units-of-measure'] });
      await queryClient.invalidateQueries({ queryKey: ['units-of-measure-simple'] });
      setIsAddOpen(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: EditUnitRequestPayload) => {
      await api.put('/unit', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['units-of-measure'] });
      await queryClient.invalidateQueries({ queryKey: ['units-of-measure-simple'] });
      setEditUnit(null);
    },
  });

  const desktopUnits = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopUnits.length;

  useEffect(() => {
    const items: UnitListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileUnits(items);
      return;
    }

    setAccumulatedMobileUnits((prev) => mergeById(prev, items, (item) => item.id));
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
    data: desktopUnits,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (unit) => setEditUnit(unit),
    } satisfies UnitTableMeta,
  });

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
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać listy jednostek miary.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin']} redirectTo="/dashboard">
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold">Jednostki miary</h1>
            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="bg-white text-blue-900 hover:bg-gray-100 font-medium text-xs sm:text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Dodaj jednostkę miary
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj jednostkę (symbol, nazwa)..."
                className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Sortuj po:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                >
                  <option value="name">Nazwa</option>
                  <option value="symbol">Symbol</option>
                </select>

                <Button
                  type="button"
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
          </div>

          {listError && (
            <div className="mb-6 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobileUnits}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.id}
            renderMobileCard={(item) => <UnitMobileCard unit={item} onEdit={setEditUnit} />}
            emptyMessage="Brak jednostek miary do wyświetlenia."
            loadingMessage="Ładowanie jednostek miary..."
            paginationProps={{
              pageNumber,
              pageSize,
              totalPages,
              totalItems,
              isFetching,
              onPageSizeChange: setPageSize,
              onPageChange: handleDesktopPageChange,
            }}
          />

          <AddUnitDialog
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onSave={async (payload) => {
              await addMutation.mutateAsync(payload);
            }}
            isLoading={addMutation.isPending}
          />

          <EditUnitDialog
            unit={editUnit}
            isOpen={Boolean(editUnit)}
            onClose={() => setEditUnit(null)}
            onSave={async (payload) => {
              await editMutation.mutateAsync(payload);
            }}
            isLoading={editMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
