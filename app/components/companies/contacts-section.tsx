import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type Row,
} from '@tanstack/react-table';
import { Button } from '~/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowDownWideNarrow, Filter, UserPlus } from 'lucide-react';
import { api } from '~/api/api';
import { AddContactDialog, type AddContactRequest } from './add-contact-dialog';
import { Link } from 'react-router';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  isPrimary: boolean;
  ownerFirstName?: string;
  ownerLastName?: string;
}

const PrimaryBadge = ({ isPrimary }: { isPrimary: boolean }) => {
  const className = isPrimary ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${className}`}>
      {isPrimary ? 'Główny' : 'Dodatkowy'}
    </span>
  );
};

const TableRow = ({ row }: { row: Row<Contact> }) => (
  <tr className="border-b hover:bg-gray-50 transition-colors">
    {row.getVisibleCells().map((cell) => (
      <td key={cell.id} className="px-6 py-4">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    ))}
  </tr>
);

const columnHelper = createColumnHelper<Contact>();
const columns = [
  columnHelper.display({
    id: 'fullName',
    header: 'Imię i nazwisko',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="text-[#004a8f] font-normal text-sm">
            {row.firstName} {row.lastName}
          </span>
          {row.jobTitle && <span className="text-xs text-gray-500 mt-0.5">{row.jobTitle}</span>}
        </div>
      );
    },
  }),
  columnHelper.accessor('isPrimary', {
    header: 'Główny kontakt',
    cell: (info) => {
      const isPrimary = info.getValue();
      const badgeClass = isPrimary ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600';
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
        >
          {isPrimary ? 'Tak' : 'Nie'}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'owner',
    header: 'Opiekun',
    cell: (info) => (
      <span className="text-sm text-gray-600">
        {`${info.row.original.ownerFirstName || ''} ${info.row.original.ownerLastName || ''}`.trim() ||
          'Brak'}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: () => (
      <button className="text-[#004a8f] hover:underline font-medium text-sm">Szczegóły</button>
    ),
  }),
];

export const ContactsSection: React.FC<{
  clientId?: string;
  getDisplayRange: (page: number, pageSize: number, total: number) => string;
}> = ({ clientId, getDisplayRange }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [mobileContacts, setMobileContacts] = useState<Contact[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['company-contacts', clientId, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/company/contacts', {
        params: { companyId: clientId, PageNumber: page, PageSize: pageSize },
      });
      return res.data.data;
    },
    enabled: !!clientId,
    placeholderData: keepPreviousData,
  });

  const addContactMutation = useMutation({
    mutationFn: async (newContact: AddContactRequest) => {
      return await api.post('/contacts', newContact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-contacts', clientId] });
      setIsAddModalOpen(false);
    },
    onError: (error) => {
      console.error('Błąd podczas dodawania kontaktu', error);
      alert('Nie udało się zapisać kontaktu. Sprawdź konsolę.');
    },
  });

  const handleSaveContact = async (contactData: Omit<AddContactRequest, 'companyId'>) => {
    if (!clientId) return;

    await addContactMutation.mutateAsync({
      ...contactData,
      companyId: clientId,
    });
  };

  const items: Contact[] = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || 0;

  useEffect(() => {
    setPage(1);
    setMobileContacts([]);
  }, [search, pageSize]);

  useEffect(() => {
    if (items.length > 0) {
      setMobileContacts((prev) => {
        if (page === 1) return items;
        const newItems = items.filter((item) => !prev.some((p) => p.id === item.id));
        return [...prev, ...newItems];
      });
    }
  }, [items, page]);

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() });

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4} className="p-6 text-center text-gray-500">
            Pobieranie...
          </td>
        </tr>
      );
    }
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="p-6 text-center text-gray-500">
            Brak danych.
          </td>
        </tr>
      );
    }
    return table.getRowModel().rows.map((row) => <TableRow key={row.id} row={row} />);
  };

  return (
    <>
      {/* WIDOK MOBILNY (dla małych ekranów < 768px) */}
      <section className="block xl:hidden">
        <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6 flex justify-between items-center">
          <span>
            Kontakty: {isLoading && <span className="text-sm text-gray-400">Ładowanie...</span>}
          </span>
          <Button size="icon" variant="ghost" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-5 h-5 text-[#004a8f]" />
          </Button>
        </h2>
        {/* ... reszta kodu sekcji mobilnej (bez zmian) ... */}
        {mobileContacts.length === 0 && !isLoading ? (
          <div className="p-4 text-gray-500 bg-gray-50 rounded-lg text-sm text-center border">
            Brak kontaktów.
          </div>
        ) : (
          <div className="space-y-3">
            {mobileContacts.map((c) => (
              <div key={c.id} className="border border-black rounded-lg p-3 bg-white text-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[#004a8f] leading-tight">
                    <p className="font-medium">
                      {c.firstName} {c.lastName}
                    </p>
                    {c.jobTitle && <p className="text-gray-600 text-xs">{c.jobTitle}</p>}
                  </div>
                  <PrimaryBadge isPrimary={c.isPrimary} />
                </div>
                <div className="border-t border-black pt-2 flex justify-between items-center text-xs">
                  <p>
                    Opiekun: {c.ownerFirstName} {c.ownerLastName}
                  </p>
                  <Link className="text-[#004a8f] hover:underline" to={`contact/${c.id}`}>
                    Szczegóły
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {page < totalPages && (
          <button
            className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
            onClick={() => setPage((p) => p + 1)}
          >
            Pokaż więcej
          </button>
        )}
      </section>

      {/* WIDOK DESKTOP (od 1024px wzwyż) */}
      <div className="hidden xl:flex mb-10 bg-white border border-gray-200 rounded-lg shadow-sm flex-col w-full overflow-hidden">
        {/* Nagłówek z responsywnym zawijaniem elementów (flex-wrap) */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
            <h2 className="text-xl font-normal text-gray-800">Kontakty</h2>

            <Button
              className="bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-2 shrink-0"
              onClick={() => setIsAddModalOpen(true)}
            >
              <UserPlus className="w-4 h-4" /> Dodaj
            </Button>

            <input
              type="text"
              placeholder="Wyszukaj..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 md:w-72 border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select className="border rounded-md px-3 py-2 text-sm bg-white">
              <option>Nazwisko</option>
            </select>
            <Button variant="outline" className="px-3">
              <ArrowDownWideNarrow className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtry
            </Button>
          </div>
        </div>

        {/* Kontener tabeli zabezpieczony przed wyjściem poza ekran */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-137.5">
            <thead className="bg-white border-b">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-6 py-4 text-sm font-semibold">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>

        {/* Pasek paginacji */}
        <div className="p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs bg-white rounded-b-lg">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded-md p-1.5"
          >
            <option value={4}>4</option>
            <option value={10}>10</option>
          </select>
          <div className="text-gray-500">{getDisplayRange(page, pageSize, totalItems)}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              Strona {page} z {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AddContactDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveContact}
        isLoading={addContactMutation.isPending}
      />
    </>
  );
};
