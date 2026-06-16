import React, { useState, useMemo, useEffect, type ComponentType, useRef } from 'react';
import { MainLayout } from '~/components/main-layout';
import { Button } from '~/components/ui/button';
import { Filter, ChevronLeft, ChevronRight, MapPinned, ArrowDownWideNarrow } from 'lucide-react';
import { api } from '~/api/api';
import { useParams } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';

interface CompanyDetailResponse {
  id: string;
  name: string;
  nip: string;
  isYour: boolean;
}

interface AddressDetailResponse {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

interface CompanyContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  isPrimary: boolean;
  ownerFirstName: string;
  ownerLastName: string;
}

interface CompanySalesResponse {
  id: string;
  salesmanFirstName: string;
  salesmanLastName: string;
  name: string;
  value: number;
  code: string;
  decimalPlaces: number;
  status: string;
  closeDate: string;
  createdAt: string;
}

interface CompanyDebtSummaryResponse {
  currencyCode: string;
  totalAmount: number;
  decimalPlace: number;
}

interface CompanyDebtDetailResponse {
  id: string;
  invoiceNumber: string;
  amountLeft: number;
  currencyCode: string;
  decimalPlaces: number;
  dueDate: string;
  daysOverdue: number;
}

interface PagedResult<T> {
  items: T[];
  totalPages?: number;
  totalItems?: number;
  totalCount?: number;
}

const contactColumnHelper = createColumnHelper<any>();
const contactColumns = [
  contactColumnHelper.display({
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
  contactColumnHelper.accessor('isPrimary', {
    header: 'Główny kontakt',
    cell: (info) => {
      const isPrimary = info.getValue();
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${isPrimary ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'}`}
        >
          {isPrimary ? 'Tak' : 'Nie'}
        </span>
      );
    },
  }),
  contactColumnHelper.display({
    id: 'owner',
    header: 'Opiekun',
    cell: (info) => {
      const row = info.row.original;
      const ownerName = `${row.ownerFirstName || ''} ${row.ownerLastName || ''}`.trim();
      return <span className="text-sm text-gray-600">{ownerName || 'Brak'}</span>;
    },
  }),
  contactColumnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: () => (
      <a href="#" className="text-[#004a8f] hover:underline font-medium text-sm">
        Szczegóły
      </a>
    ),
  }),
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Complete':
      return { label: 'Zakończona', style: 'bg-[#d4edda] text-[#28a745]' };
    case 'InProgress':
      return { label: 'W trakcie', style: 'bg-blue-100 text-[#004a8f]' };
    case 'ToDo':
      return { label: 'Do zrobienia', style: 'bg-yellow-100 text-yellow-800' };
    case 'Cancelled':
      return { label: 'Anulowana', style: 'bg-red-100 text-red-700' };
    default:
      return { label: status, style: 'bg-gray-100 text-gray-600' };
  }
};

const saleColumnHelper = createColumnHelper<CompanySalesResponse>();
const saleColumns = [
  saleColumnHelper.display({
    id: 'salesman',
    header: 'Sprzedawca',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="text-[#004a8f] font-normal text-sm">
            {row.salesmanFirstName} {row.salesmanLastName}
          </span>
          <span className="text-xs text-gray-500 mt-0.5">{row.name}</span>
        </div>
      );
    },
  }),
  saleColumnHelper.display({
    id: 'amount',
    header: 'Kwota',
    cell: (info) => {
      const row = info.row.original;
      const formattedValue = new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: row.decimalPlaces,
        maximumFractionDigits: row.decimalPlaces,
      }).format(row.value);
      return (
        <span className="text-sm text-gray-600 font-semibold">
          {formattedValue} {row.code}
        </span>
      );
    },
  }),
  saleColumnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const statusValue = info.getValue();
      const { label, style } = getStatusConfig(statusValue);
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style}`}
        >
          {label}
        </span>
      );
    },
  }),
  saleColumnHelper.accessor('createdAt', {
    header: 'Data utworzenia',
    cell: (info) => {
      const date = new Date(info.getValue());
      return <span className="text-sm text-gray-500">{date.toLocaleDateString('pl-PL')}</span>;
    },
  }),
  saleColumnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: () => (
      <a href="#" className="text-[#004a8f] hover:underline font-medium text-sm">
        Szczegóły
      </a>
    ),
  }),
];

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  const [mobileLimits, setMobileLimits] = useState({
    addresses: 3,
  });

  const loadMoreMobile = (section: keyof typeof mobileLimits) => {
    setMobileLimits((prev) => ({ ...prev, [section]: prev[section] + 3 }));
  };

  // Stany wyszukiwania i paginacji (Desktop)
  const [contactSearch, setContactSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');

  const [contactPage, setContactPage] = useState(1);
  const [contactPageSize, setContactPageSize] = useState(4);

  const [salePage, setSalePage] = useState(1);
  const [salePageSize, setSalePageSize] = useState(4);

  // Stany dedykowane dla zakładki/sekcji długów
  const [debtPage, setDebtPage] = useState(1);
  const [debtPageSize, setDebtPageSize] = useState(10);
  const [accumulatedMobileDebts, setAccumulatedMobileDebts] = useState<CompanyDebtDetailResponse[]>(
    [],
  );
  const isDebtMobileAppend = useRef(false);

  // Podstawowe informacje o firmie
  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
  } = useQuery({
    queryKey: ['company-details', clientId],
    queryFn: async () => {
      const response = await api.get('/company', {
        params: { companyId: clientId },
      });
      return response.data.data as CompanyDetailResponse;
    },
    enabled: !!clientId,
  });

  // Adresy firmy
  const { data: addressesData, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['company-addresses', clientId],
    queryFn: async () => {
      const response = await api.get('/company/addresses', {
        params: { companyId: clientId, PageNumber: 1, PageSize: 100 },
      });
      return response.data.data as PagedResult<AddressDetailResponse>;
    },
    enabled: !!clientId,
  });

  const addresses = addressesData?.items || [];

  // Dynamiczne ładowanie komponentu mapy
  const [MapComponent, setMapComponent] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    let isMounted = true;
    import('~/components/osm-map-client').then((module) => {
      if (isMounted) setMapComponent(() => module.default);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Formatowanie danych pod mapę
  const mapCompaniesData = useMemo(() => {
    return addresses.map((addr) => ({
      id: addr.id.toString(),
      name: 'Adres firmy',
      nip: 'Brak',
      street: addr.street,
      city: addr.city,
      zipCode: addr.zipCode,
      latitude: addr.latitude,
      longitude: addr.longitude,
      type: addr.type,
    }));
  }, [addresses]);

  const mapCenter = useMemo<[number, number]>(() => {
    const firstWithCoords = addresses.find((a) => a.latitude && a.longitude);
    return firstWithCoords
      ? [firstWithCoords.latitude!, firstWithCoords.longitude!]
      : [51.9194, 19.1451];
  }, [addresses]);

  // Kontakty firmy
  const { data: contactsData, isLoading: isContactsLoading } = useQuery({
    queryKey: ['company-contacts', clientId, contactPage, contactPageSize],
    queryFn: async () => {
      const response = await api.get('/company/contacts', {
        params: {
          companyId: clientId,
          PageNumber: contactPage,
          PageSize: contactPageSize,
        },
      });
      return response.data.data as PagedResult<any>;
    },
    enabled: !!clientId,
  });

  const contacts = contactsData?.items || [];
  const totalContactPages = contactsData?.totalPages || 1;
  const totalContactItems = contactsData?.totalCount || 0;

  const [accumulatedMobileContacts, setAccumulatedMobileContacts] = useState<
    CompanyContactResponse[]
  >([]);
  useEffect(() => {
    if (contacts.length > 0) {
      if (contactPage === 1) {
        setAccumulatedMobileContacts(contacts);
      } else {
        setAccumulatedMobileContacts((prev) => {
          const newItems = contacts.filter(
            (newContact) => !prev.some((p) => p.id === newContact.id),
          );
          return [...prev, ...newItems];
        });
      }
    }
  }, [contacts, contactPage]);

  const contactsTable = useReactTable({
    data: contacts,
    columns: contactColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Sprzedaż firmy
  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['company-sales', clientId, salePage, salePageSize],
    queryFn: async () => {
      const response = await api.get('/company/sales', {
        params: {
          companyId: clientId,
          PageNumber: salePage,
          PageSize: salePageSize,
        },
      });
      return response.data.data as PagedResult<CompanySalesResponse>;
    },
    enabled: !!clientId,
  });

  const sales = salesData?.items || [];
  const totalSalePages = salesData?.totalPages || 1;
  const totalSaleItems = salesData?.totalCount || 0;

  const [accumulatedMobileSales, setAccumulatedMobileSales] = useState<CompanySalesResponse[]>([]);
  useEffect(() => {
    if (sales.length > 0) {
      if (salePage === 1) {
        setAccumulatedMobileSales(sales);
      } else {
        setAccumulatedMobileSales((prev) => {
          const newItems = sales.filter((newSale) => !prev.some((p) => p.id === newSale.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [sales, salePage]);

  const salesTable = useReactTable({
    data: sales,
    columns: saleColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 1. Pobieranie podsumowania długów (Kafelki)
  const { data: debtSummaryResponse, isLoading: isDebtSummaryLoading } = useQuery({
    queryKey: ['company-debt-summary', clientId],
    queryFn: async () => {
      const response = await api.get('/company/debts/summary', {
        params: { companyId: clientId },
      });
      return response.data?.value || response.data?.data || response.data || [];
    },
    enabled: !!clientId,
  });

  const debtSummary: CompanyDebtSummaryResponse[] = Array.isArray(debtSummaryResponse)
    ? debtSummaryResponse
    : [];

  // 2. Pobieranie szczegółowych faktur (Tabela / Lista)
  const {
    data: debtsResponse,
    isLoading: isDebtsLoading,
    isFetching: isDebtsFetching,
  } = useQuery({
    queryKey: ['company-debts', { clientId, debtPage, debtPageSize }],
    queryFn: async () => {
      const params = {
        companyId: clientId,
        PageNumber: debtPage,
        PageSize: debtPageSize,
      };
      const response = await api.get('/company/debts', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: !!clientId,
    placeholderData: keepPreviousData,
  });

  const desktopDebts = useMemo(() => debtsResponse?.items || [], [debtsResponse]);
  const totalDebtPages = debtsResponse?.totalPages || 1;
  const totalDebtItems =
    debtsResponse?.totalItems || debtsResponse?.totalCount || desktopDebts.length;

  // Resetowanie dopisywania stron przy zmianie rozmiaru bazy na stronę
  useEffect(() => {
    isDebtMobileAppend.current = false;
    setDebtPage(1);
  }, [debtPageSize]);

  // Akumulacja danych dla widoku mobilnego (infinite scroll)
  useEffect(() => {
    if (!debtsResponse?.items) return;

    setAccumulatedMobileDebts((prev) => {
      if (debtPage === 1) return debtsResponse.items;

      if (isDebtMobileAppend.current) {
        const newItems = debtsResponse.items.filter(
          (newItem: CompanyDebtDetailResponse) => !prev.some((p) => p.id === newItem.id),
        );
        return [...prev, ...newItems];
      }

      return debtsResponse.items;
    });
  }, [debtsResponse, debtPage]);

  const debtColumnHelper = createColumnHelper<CompanyDebtDetailResponse>();
  const debtColumns = [
    debtColumnHelper.accessor('invoiceNumber', {
      header: 'Numer faktury',
      cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
    }),
    debtColumnHelper.accessor('amountLeft', {
      header: 'Do zapłaty',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="font-bold text-red-600">
            {row.amountLeft.toLocaleString('pl-PL', { minimumFractionDigits: row.decimalPlaces })}{' '}
            {row.currencyCode}
          </span>
        );
      },
    }),
    debtColumnHelper.accessor('dueDate', {
      header: 'Termin płatności',
      cell: (info) => (
        <span className="text-gray-500">
          {new Date(info.getValue()).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    }),
    debtColumnHelper.accessor('daysOverdue', {
      header: 'Status opóźnienia',
      cell: (info) => {
        const days = info.getValue();
        return days > 0 ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            {days} dni po terminie
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            W terminie
          </span>
        );
      },
    }),
  ];

  const debtTable = useReactTable({
    data: desktopDebts,
    columns: debtColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDebtMobileLoadMore = () => {
    isDebtMobileAppend.current = true;
    setDebtPage((prev) => prev + 1);
  };

  const handleDebtDesktopPageChange = (newPage: number) => {
    isDebtMobileAppend.current = false;
    setDebtPage(newPage);
  };

  const getDisplayRange = (page: number, size: number, total: number) => {
    if (total === 0) return 'Wyświetlanie 0 do 0 z 0 wyników';
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `Wyświetlanie ${start} do ${end} z ${total} wyników`;
  };

  useEffect(() => setContactPage(1), [contactSearch, contactPageSize]);
  useEffect(() => setSalePage(1), [saleSearch, salePageSize]);

  return (
    <MainLayout>
      <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen z-0 pb-12">
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          {/* HEADER */}
          <div className="mb-6 lg:mb-8">
            {isBasicInfoLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            ) : isError || !basicInfo ? (
              <div className="text-red-500 font-medium">Nie udało się pobrać danych firmy.</div>
            ) : (
              <>
                <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-2">
                  {basicInfo.name}{' '}
                  <span className="text-xl text-gray-500 ml-2">(NIP: {basicInfo.nip})</span>
                </h1>

                <div
                  className={`inline-block px-3 py-1 rounded-full ${
                    basicInfo.isYour ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="font-medium text-sm">
                    {basicInfo.isYour ? 'Twój klient' : 'Obcy klient'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* === WIDOK MOBILNY === */}
          <div className="block lg:hidden space-y-6">
            {/* ADRESY - MOBILE */}
            <section>
              <h2 className="text-xl text-[#004a8f] font-normal mb-3">Adresy:</h2>
              <div className="space-y-3">
                {addresses.slice(0, mobileLimits.addresses).map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-black rounded-lg p-3 bg-white text-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[#004a8f] leading-tight space-y-1">
                        <p>Ulica: {addr.street}</p>
                        <p>Kod pocztowy: {addr.zipCode}</p>
                        <p>Miasto: {addr.city}</p>
                      </div>
                      <span className="bg-[#d4edda] text-[#28a745] text-xs px-2 py-0.5 rounded-full">
                        {addr.type}
                      </span>
                    </div>
                    <div className="border-t border-black pt-2 flex justify-between items-end">
                      <a href="#" className="text-[#004a8f] text-sm ml-auto">
                        Otwórz nawigację
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {mobileLimits.addresses < addresses.length && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
                  onClick={() => loadMoreMobile('addresses')}
                >
                  Pokaż więcej
                </button>
              )}
            </section>

            {/* KONTAKTY - MOBILE */}
            <section>
              <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6 flex justify-between items-center">
                Kontakty:
                {isContactsLoading && <span className="text-sm text-gray-400">Ładowanie...</span>}
              </h2>

              {accumulatedMobileContacts.length === 0 && !isContactsLoading ? (
                <div className="p-4 text-gray-500 bg-gray-50 rounded-lg text-sm text-center border border-gray-200">
                  Brak kontaktów dla tej firmy.
                </div>
              ) : (
                <div className="space-y-3">
                  {accumulatedMobileContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="border border-black rounded-lg p-3 bg-white text-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[#004a8f] leading-tight space-y-1">
                          <p>
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.jobTitle && (
                            <p className="text-gray-600 text-xs">{contact.jobTitle}</p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${contact.isPrimary ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {contact.isPrimary ? 'Główny' : 'Dodatkowy'}
                        </span>
                      </div>
                      <div className="border-t border-black pt-2 flex justify-between items-center">
                        <p className="text-black text-xs font-medium">
                          Opiekun: {contact.ownerFirstName} {contact.ownerLastName}
                        </p>
                        <a href="#" className="text-[#004a8f] text-sm hover:underline">
                          Szczegóły
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {contactPage < totalContactPages && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium disabled:opacity-50"
                  onClick={() => setContactPage((prev) => prev + 1)}
                  disabled={isContactsLoading}
                >
                  {isContactsLoading ? 'Ładowanie...' : 'Pokaż więcej'}
                </button>
              )}
            </section>

            {/* SPRZEDAŻ - MOBILE */}
            <section>
              <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6 flex justify-between items-center">
                Sprzedaż:
                {isSalesLoading && <span className="text-sm text-gray-400">Ładowanie...</span>}
              </h2>

              {accumulatedMobileSales.length === 0 && !isSalesLoading ? (
                <div className="p-4 text-gray-500 bg-gray-50 rounded-lg text-sm text-center border border-gray-200">
                  Brak historii sprzedaży dla tej firmy.
                </div>
              ) : (
                <div className="space-y-3">
                  {accumulatedMobileSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="border border-black rounded-lg p-3 bg-white text-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[#004a8f] leading-tight space-y-1">
                          <p>
                            Kto: {sale.salesmanFirstName} {sale.salesmanLastName}
                          </p>
                          <p>
                            Kwota:{' '}
                            {new Intl.NumberFormat('pl-PL', {
                              minimumFractionDigits: sale.decimalPlaces,
                              maximumFractionDigits: sale.decimalPlaces,
                            }).format(sale.value)}{' '}
                            {sale.code}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getStatusConfig(sale.status).style}`}
                        >
                          {getStatusConfig(sale.status).label}
                        </span>
                      </div>
                      <div className="border-t border-black pt-2 flex justify-between items-center">
                        <p className="text-black text-xs font-medium">
                          Utworzono: {new Date(sale.createdAt).toLocaleDateString('pl-PL')}
                        </p>
                        <a href="#" className="text-[#004a8f] text-sm hover:underline">
                          Szczegóły
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {salePage < totalSalePages && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium disabled:opacity-50"
                  onClick={() => setSalePage((prev) => prev + 1)}
                  disabled={isSalesLoading}
                >
                  {isSalesLoading ? 'Ładowanie...' : 'Pokaż więcej'}
                </button>
              )}
            </section>

            {/* DŁUGI - MOBILE */}
            <section>
              <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6">Długi:</h2>
              {accumulatedMobileDebts.length === 0 && !isDebtsLoading ? (
                <div className="p-4 text-gray-500 bg-green-50 rounded-lg text-sm text-center border border-green-200 text-green-700">
                  Brak zadłużenia. Wszystkie faktury są opłacone.
                </div>
              ) : (
                <div className="space-y-3">
                  {accumulatedMobileDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="rounded-lg border border-red-100 bg-white p-4 shadow-sm border-t-2 border-t-red-400 text-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{debt.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">
                            Termin: {new Date(debt.dueDate).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                        {debt.daysOverdue > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            {debt.daysOverdue} dni po terminie
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            W terminie
                          </span>
                        )}
                      </div>
                      <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Pozostała kwota:</span>
                        <span className="text-sm font-bold text-red-600">
                          {debt.amountLeft.toLocaleString('pl-PL', {
                            minimumFractionDigits: debt.decimalPlaces,
                          })}{' '}
                          {debt.currencyCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {debtPage < totalDebtPages && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium disabled:opacity-50"
                  onClick={handleDebtMobileLoadMore}
                  disabled={isDebtsFetching}
                >
                  {isDebtsFetching ? 'Ładowanie...' : 'Pokaż więcej faktur'}
                </button>
              )}
            </section>
          </div>

          {/* === WIDOK DESKTOP === */}
          <div className="hidden lg:flex flex-row gap-8 items-start relative z-0">
            {/* LEWA KOLUMNA - TABELE */}
            <div className="flex-1 min-w-0">
              {/* === SEKCJA KONTAKTÓW === */}
              <div className="mb-10 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <h2 className="text-xl font-normal text-gray-800 shrink-0 w-32">Kontakty</h2>
                    <div className="w-80">
                      <input
                        type="text"
                        placeholder="Wyszukaj..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-500">Sortuj po:</span>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]">
                      <option>Nazwisko</option>
                      <option>Imię</option>
                    </select>
                    <Button
                      variant="outline"
                      className="px-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <ArrowDownWideNarrow className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <Filter className="w-4 h-4" /> Filtry
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-200">
                      {contactsTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-sm font-semibold text-gray-800"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {isContactsLoading ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">
                            Pobieranie danych...
                          </td>
                        </tr>
                      ) : contacts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">
                            Brak przypisanych kontaktów.
                          </td>
                        </tr>
                      ) : (
                        contactsTable.getRowModel().rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-6 py-4">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={contactPageSize}
                      onChange={(e) => setContactPageSize(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    >
                      <option value={4}>4</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getDisplayRange(contactPage, contactPageSize, totalContactItems)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                      disabled={contactPage === 1}
                      className="h-8 w-8 rounded-full border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>
                    <span className="text-sm text-gray-700 font-medium">
                      Strona {contactPage} z {totalContactPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setContactPage((p) => Math.min(totalContactPages, p + 1))}
                      disabled={contactPage === totalContactPages}
                      className="h-8 w-8 rounded-full border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* === SEKCJA SPRZEDAŻY === */}
              <div className="mb-10 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <h2 className="text-xl font-normal text-gray-800 shrink-0 w-32">Sprzedaż</h2>
                    <div className="w-80">
                      <input
                        type="text"
                        placeholder="Wyszukaj sprzedawcę..."
                        value={saleSearch}
                        onChange={(e) => setSaleSearch(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-500">Sortuj po:</span>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]">
                      <option>Data zawarcia</option>
                      <option>Kwota</option>
                    </select>
                    <Button
                      variant="outline"
                      className="px-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <ArrowDownWideNarrow className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <Filter className="w-4 h-4" /> Filtry
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-200">
                      {salesTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-sm font-semibold text-gray-800"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {isSalesLoading ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            Pobieranie danych...
                          </td>
                        </tr>
                      ) : sales.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            Brak historii sprzedaży.
                          </td>
                        </tr>
                      ) : (
                        salesTable.getRowModel().rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-6 py-4">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={salePageSize}
                      onChange={(e) => setSalePageSize(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    >
                      <option value={4}>4</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getDisplayRange(salePage, salePageSize, totalSaleItems)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSalePage((p) => Math.max(1, p - 1))}
                      disabled={salePage === 1}
                      className="h-8 w-8 rounded-full border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>
                    <span className="text-sm text-gray-700 font-medium">
                      Strona {salePage} z {totalSalePages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSalePage((p) => Math.min(totalSalePages, p + 1))}
                      disabled={salePage === totalSalePages}
                      className="h-8 w-8 rounded-full border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* === SEKCJA FINANSOWA (DŁUGI) === */}
              <div className="mb-10 flex flex-col gap-6">
                <div className="border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-normal text-gray-800">
                    Sytuacja finansowa i zadłużenie
                  </h2>
                </div>

                {isDebtSummaryLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                ) : debtSummary.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium">
                      Brak zaległych płatności. Wszystkie faktury tej firmy są opłacone.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {debtSummary.map((item) => (
                      <div
                        key={item.currencyCode}
                        className="bg-white p-4 border border-red-200 rounded-lg shadow-sm border-l-4 border-l-red-500"
                      >
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Suma zadłużenia ({item.currencyCode})
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {item.totalAmount.toLocaleString('pl-PL', {
                            minimumFractionDigits: item.decimalPlace,
                          })}{' '}
                          {item.currencyCode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {desktopDebts.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col mt-2">
                    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50">
                          {debtTable.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th
                                  key={header.id}
                                  className="px-6 py-3.5 text-sm font-semibold text-gray-900 uppercase tracking-wider"
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody>
                          {isDebtsLoading ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-sm text-gray-500">
                                Ładowanie faktur...
                              </td>
                            </tr>
                          ) : (
                            debtTable.getRowModel().rows.map((row) => (
                              <tr
                                key={row.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} className="px-6 py-3.5 text-sm text-gray-700">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between bg-white p-4 rounded-b-lg border-t border-gray-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Pozycji:</span>
                        <select
                          value={debtPageSize}
                          onChange={(e) => setDebtPageSize(Number(e.target.value))}
                          className="border border-gray-300 rounded-md bg-white px-2 py-1 text-gray-700 focus:outline-none"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                        </select>
                      </div>
                      <div className="text-gray-500">
                        {getDisplayRange(debtPage, debtPageSize, totalDebtItems)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleDebtDesktopPageChange(Math.max(debtPage - 1, 1))}
                          disabled={debtPage === 1 || isDebtsFetching}
                          variant="outline"
                          size="sm"
                          className="px-2 h-8 disabled:opacity-40"
                        >
                          Poprzednia
                        </Button>
                        <span className="font-medium text-gray-700 px-2">
                          {debtPage} z {totalDebtPages}
                        </span>
                        <Button
                          onClick={() =>
                            handleDebtDesktopPageChange(Math.min(debtPage + 1, totalDebtPages))
                          }
                          disabled={debtPage === totalDebtPages || isDebtsFetching}
                          variant="outline"
                          size="sm"
                          className="px-2 h-8 disabled:opacity-40"
                        >
                          Następna
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRAWA KOLUMNA - MAPA LEAFLET (Sticky) */}
            <div className="w-[400px] xl:w-[450px] shrink-0 sticky top-24 z-0">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-normal text-gray-800 mb-4">Lokalizacje adresów</h2>
                <div className="border border-gray-300 rounded-lg overflow-hidden h-[500px] bg-gray-100 relative z-0">
                  {isAddressesLoading ? (
                    <div className="flex h-full w-full items-center justify-center text-gray-600">
                      <div className="animate-pulse flex items-center gap-2">
                        <MapPinned className="animate-bounce" /> Pobieranie adresów z bazy...
                      </div>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center text-gray-500 text-sm text-center p-6">
                      Brak adresów do wyświetlenia na mapie.
                    </div>
                  ) : MapComponent ? (
                    <MapComponent
                      center={mapCenter}
                      zoom={6}
                      className="h-full w-full z-0"
                      companies={mapCompaniesData}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-600">
                      <div className="animate-pulse flex items-center gap-2">
                        <MapPinned className="animate-bounce" /> Ładowanie skryptu mapy...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientDetails;
