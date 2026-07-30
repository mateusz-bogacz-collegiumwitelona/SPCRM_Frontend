import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Search, MessageSquare, Plus } from 'lucide-react';

import { useEditNote } from '~/hooks/use-edit-note';
import { NoteEditDialog } from '~/components/note-edit-dialog';
import { ContactNoteDialog, type ContactNote } from './contact-note-dialog';

import { useAddNote } from '~/hooks/use-add-note';
import { NoteAddDialog } from '~/components/note-add-dialog';
import { ActionGuard } from '~/lib/action-guard';

const columnHelper = createColumnHelper<ContactNote>();

export const ContactNotes: React.FC<{ contactId: string }> = ({ contactId }) => {
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [accumulatedMobileNotes, setAccumulatedMobileNotes] = useState<ContactNote[]>([]);
  const isMobileAppend = useRef(false);

  const [selectedNote, setSelectedNote] = useState<ContactNote | null>(null);
  const [editingNote, setEditingNote] = useState<ContactNote | null>(null);

  const { mutateAsync: editNoteAsync } = useEditNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes'] });
    },
  });

  const { mutateAsync: addNoteAsync, isPending: isAdding } = useAddNote({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes'] });
      setSearchTerm('');
      setPageNumber(1);
    },
  });

  const handleSaveNewNote = async (title: string, content: string) => {
    await addNoteAsync({
      targetId: contactId,
      title,
      content,
      noteType: 'Contact',
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Tytuł notatki',
        cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('content', {
        header: 'Treść',
        cell: (info) => (
          <span className="text-gray-700 whitespace-pre-wrap wrap-break-word line-clamp-3">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'author',
        header: 'Autor',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="text-gray-500">
              {row.authorFirstName} {row.authorLastName}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Data dodania',
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <span className="text-gray-500">
              {date.toLocaleDateString('pl-PL')}{' '}
              {date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Akcje',
        cell: (info) => (
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedNote(info.row.original)}
              className="text-blue-900 font-medium text-sm hover:underline"
            >
              Szczegóły
            </button>

            <ActionGuard authorId={info.row.original.authorId}>
              <button
                onClick={() => setEditingNote(info.row.original)}
                className="text-gray-500 font-medium text-sm hover:text-blue-900 hover:underline"
              >
                Edytuj
              </button>
            </ActionGuard>
          </div>
        ),
      }),
    ],
    [],
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['contact-notes', { contactId, pageNumber, pageSize, debouncedSearch }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
      };
      const response = await api.get(`/contacts/${contactId}/notes`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: !!contactId,
    placeholderData: keepPreviousData,
  });

  const desktopNotes = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || desktopNotes.length;

  useEffect(() => {
    if (!data?.items) return;

    setAccumulatedMobileNotes((prev) => {
      if (pageNumber === 1) return data.items;

      if (isMobileAppend.current) {
        const newItems = data.items.filter(
          (newItem: ContactNote) => !prev.some((p) => p.id === newItem.id),
        );
        return [...prev, ...newItems];
      }

      return data.items;
    });
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
    data: desktopNotes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900 mb-2" />
            <p className="text-gray-500 text-sm">Wczytywanie notatek...</p>
          </div>
        ) : !desktopNotes || desktopNotes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center gap-3">
            <MessageSquare className="h-8 w-8 text-gray-300" />
            <p className="text-gray-500 font-medium text-sm">Brak notatek do wyświetlenia.</p>
            {/* Przycisk w pustym stanie */}
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              size="sm"
              className="mt-2 text-blue-900 border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" /> Dodaj pierwszą notatkę
            </Button>
          </div>
        ) : (
          <>
            <div className="block lg:hidden space-y-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-normal text-gray-800">Notatki</h2>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  size="sm"
                  className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Dodaj
                </Button>
              </div>

              <div className="relative w-full mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Szukaj w notatkach..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                />
              </div>

              {accumulatedMobileNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col"
                >
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-blue-900">{note.title}</h3>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed line-clamp-3">
                    {note.content}
                  </p>

                  <div className="flex gap-2 w-full mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNote(note)}
                      className="flex-1 text-blue-900 border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                    >
                      Przeczytaj
                    </Button>

                    <ActionGuard authorId={note.authorId}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                        className="flex-1 text-gray-700 border-gray-200 hover:bg-gray-50 bg-white shadow-sm"
                      >
                        Edytuj
                      </Button>
                    </ActionGuard>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium bg-gray-50 px-2 py-1 rounded text-gray-700">
                      {note.authorFirstName} {note.authorLastName}
                    </span>
                    <span>{new Date(note.createdAt).toLocaleDateString('pl-PL')}</span>
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
                      'Pokaż starsze notatki'
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden lg:flex bg-white border border-gray-200 rounded-lg shadow-sm flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-normal text-gray-800 w-32">Notatki</h2>
                  <div className="relative w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Szukaj w notatkach..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                    />
                  </div>
                </div>
                {/* Przycisk dodawania nowej notatki w desktopie */}
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  size="sm"
                  className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Dodaj notatkę
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
                          <td
                            key={cell.id}
                            className="px-6 py-4 text-sm text-gray-700 align-top max-w-md"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginacja Desktopowa */}
              <div className="flex items-center justify-between p-4 bg-white rounded-b-lg">
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
        )}
      </div>

      <ContactNoteDialog
        note={selectedNote}
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
      />

      <NoteEditDialog
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        note={editingNote}
        onSave={editNoteAsync}
      />

      <NoteAddDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewNote}
        isLoading={isAdding}
      />
    </>
  );
};
