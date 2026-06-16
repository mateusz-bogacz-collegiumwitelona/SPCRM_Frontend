import React, { useState, useMemo, useEffect, type ComponentType } from 'react';
import { MainLayout } from '~/components/main-layout';
import { Button } from '~/components/ui/button';
import { Filter, ChevronLeft, ChevronRight, MapPinned, ArrowDownWideNarrow } from 'lucide-react';
import { api } from '~/api/api';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

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

interface PagedResult<T> {
  items: T[];
}

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
  } = useQuery({
    queryKey: ['company-details', clientId],
    queryFn: async () => {
      const response = await api.get('/company', {
        params: { id: clientId },
      });

      return response.data.data as CompanyDetailResponse;
    },
    enabled: !!clientId,
  });

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

  // 2. Dynamiczne ładowanie komponentu mapy (zapobiega błędom SSR / window is not defined)
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

  // 3. Formatowanie danych pod Twój komponent 'osm-map-client'
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

  // 4. Ustawienie środka mapy na pierwszy prawidłowy adres (lub domyślnie na środek PL)
  const mapCenter = useMemo<[number, number]>(() => {
    const firstWithCoords = addresses.find((a) => a.latitude && a.longitude);
    return firstWithCoords
      ? [firstWithCoords.latitude!, firstWithCoords.longitude!]
      : [51.9194, 19.1451];
  }, [addresses]);

  // 1. MOCK DATA
  const [clientData] = useState({
    clientId: '12345',
    companyName: 'Stal-Bud Sp. z o. o.',
    status: 'Twój klient',
    addresses: [
      {
        id: 1,
        street: 'Prosta 12/4',
        postalCode: '00-000',
        city: 'Warszawa',
        type: 'Siedziba',
        addedDate: '02.03.2026',
        editedDate: '02.03.2026',
        latitude: 52.2297,
        longitude: 21.0122,
      },
      {
        id: 2,
        street: 'Prosta 13/4',
        postalCode: '32-020',
        city: 'Sobięcin',
        type: 'Oddział',
        addedDate: '02.03.2026',
        editedDate: '02.03.2026',
        latitude: 50.761,
        longitude: 16.2575,
      },
      {
        id: 3,
        street: 'Krzywa 12/4',
        postalCode: '50-002',
        city: 'Wrocław',
        type: 'Magazyn',
        addedDate: '05.04.2026',
        editedDate: '05.04.2026',
        latitude: 51.1079,
        longitude: 17.0385,
      },
      {
        id: 4,
        street: 'Prosta 12/4',
        postalCode: '00-000',
        city: 'Warszawa',
        type: 'Wysyłka',
        addedDate: '06.05.2026',
        editedDate: '06.05.2026',
        latitude: 52.24,
        longitude: 21.02,
      },
      {
        id: 5,
        street: 'Długa 8',
        postalCode: '31-010',
        city: 'Kraków',
        type: 'Oddział',
        addedDate: '10.05.2026',
        editedDate: '11.05.2026',
        latitude: 50.0647,
        longitude: 19.945,
      },
    ],
    contacts: [
      {
        id: 1,
        name: 'Mateusz Flamel',
        department: 'Dział handlu',
        type: 'Główny',
        guardian: 'Stanisław Warga',
        company: 'Stal-Bud Sp. z o. o.',
      },
      {
        id: 2,
        name: 'Anna Nowak',
        department: 'Księgowość',
        type: 'Dodatkowy',
        guardian: 'Stanisław Warga',
        company: 'Stal-Bud Sp. z o. o.',
      },
      {
        id: 3,
        name: 'Jan Kowalski',
        department: 'Zarząd',
        type: 'Główny',
        guardian: 'Piotr Kruk',
        company: 'Stal-Bud Sp. z o. o.',
      },
      {
        id: 4,
        name: 'Katarzyna Lis',
        department: 'Logistyka',
        type: 'Dodatkowy',
        guardian: 'Piotr Kruk',
        company: 'Stal-Bud Sp. z o. o.',
      },
      {
        id: 5,
        name: 'Michał Anioł',
        department: 'IT',
        type: 'Dodatkowy',
        guardian: 'Stanisław Warga',
        company: 'Stal-Bud Sp. z o. o.',
      },
    ],
    sales: [
      {
        id: 1,
        person: 'Jan Brzechwa',
        amount: '2 137 zł',
        status: 'W trakcie',
        dateCreated: '21.04.2024',
      },
      {
        id: 2,
        person: 'Jan Brzechwa',
        amount: '2 137 zł',
        status: 'Zakończona',
        dateCreated: '21.04.2024',
      },
      {
        id: 3,
        person: 'Tomasz Lis',
        amount: '5 000 zł',
        status: 'W trakcie',
        dateCreated: '15.05.2024',
      },
      {
        id: 4,
        person: 'Anna Nowak',
        amount: '12 000 zł',
        status: 'Zakończona',
        dateCreated: '10.06.2024',
      },
      {
        id: 5,
        person: 'Krzysztof Krawczyk',
        amount: '850 zł',
        status: 'Anulowana',
        dateCreated: '01.07.2024',
      },
    ],
    debts: [
      { id: 1, amount: '20 131', currency: 'PLN', lastUpdate: '21.04.2022' },
      { id: 2, amount: '2 137', currency: 'JPY', lastUpdate: '21.04.2022' },
      { id: 3, amount: '500', currency: 'PLN', lastUpdate: '10.05.2023' },
      { id: 4, amount: '1 200', currency: 'EUR', lastUpdate: '15.06.2023' },
      { id: 5, amount: '8 000', currency: 'PLN', lastUpdate: '01.01.2024' },
    ],
  });

  // 2. STANY DLA MOBILE
  const [mobileLimits, setMobileLimits] = useState({
    addresses: 3,
    contacts: 3,
    sales: 3,
    debts: 3,
  });
  const loadMoreMobile = (section: keyof typeof mobileLimits) => {
    setMobileLimits((prev) => ({ ...prev, [section]: prev[section] + 3 }));
  };

  // 3. STANY WYSZUKIWANIA I PAGINACJI (Desktop)
  const [contactSearch, setContactSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');
  const [debtSearch, setDebtSearch] = useState('');

  const [contactPage, setContactPage] = useState(1);
  const [contactPageSize, setContactPageSize] = useState(4);

  const [salePage, setSalePage] = useState(1);
  const [salePageSize, setSalePageSize] = useState(4);

  const [debtPage, setDebtPage] = useState(1);
  const [debtPageSize, setDebtPageSize] = useState(4);

  useEffect(() => setContactPage(1), [contactSearch, contactPageSize]);
  useEffect(() => setSalePage(1), [saleSearch, salePageSize]);
  useEffect(() => setDebtPage(1), [debtSearch, debtPageSize]);

  // KONTAKTY
  const filteredContacts = useMemo(
    () =>
      clientData.contacts.filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase())),
    [clientData.contacts, contactSearch],
  );
  const totalContactPages = Math.ceil(filteredContacts.length / contactPageSize) || 1;
  const paginatedContacts = filteredContacts.slice(
    (contactPage - 1) * contactPageSize,
    contactPage * contactPageSize,
  );

  // SPRZEDAŻ
  const filteredSales = useMemo(
    () => clientData.sales.filter((s) => s.person.toLowerCase().includes(saleSearch.toLowerCase())),
    [clientData.sales, saleSearch],
  );
  const totalSalePages = Math.ceil(filteredSales.length / salePageSize) || 1;
  const paginatedSales = filteredSales.slice(
    (salePage - 1) * salePageSize,
    salePage * salePageSize,
  );

  // DŁUGI
  const filteredDebts = useMemo(
    () =>
      clientData.debts.filter(
        (d) =>
          d.currency.toLowerCase().includes(debtSearch.toLowerCase()) ||
          d.amount.includes(debtSearch),
      ),
    [clientData.debts, debtSearch],
  );
  const totalDebtPages = Math.ceil(filteredDebts.length / debtPageSize) || 1;
  const paginatedDebts = filteredDebts.slice(
    (debtPage - 1) * debtPageSize,
    debtPage * debtPageSize,
  );

  // POMOCNICZE FUNKCJE
  const getDisplayRange = (page: number, size: number, total: number) => {
    if (total === 0) return 'Wyświetlanie 0 do 0 z 0 wyników';
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `Wyświetlanie ${start} do ${end} z ${total} wyników`;
  };

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
                {clientData.addresses.slice(0, mobileLimits.addresses).map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-black rounded-lg p-3 bg-white text-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[#004a8f] leading-tight space-y-1">
                        <p>Ulica: {addr.street}</p>
                        <p>Kod pocztowy: {addr.postalCode}</p>
                        <p>Miasto: {addr.city}</p>
                      </div>
                      <span className="bg-[#d4edda] text-[#28a745] text-xs px-2 py-0.5 rounded-full">
                        {addr.type}
                      </span>
                    </div>
                    <div className="border-t border-black pt-2 flex justify-between items-end">
                      <div className="text-black text-xs space-y-0.5 font-medium">
                        <p>Dodano: {addr.addedDate}</p>
                        <p>Edytowano: {addr.editedDate}</p>
                      </div>
                      <a href="#" className="text-[#004a8f] text-sm">
                        Otwórz nawigację
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {mobileLimits.addresses < clientData.addresses.length && (
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
              <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6">Kontakty:</h2>
              <div className="space-y-3">
                {clientData.contacts.slice(0, mobileLimits.contacts).map((contact) => (
                  <div
                    key={contact.id}
                    className="border border-black rounded-lg p-3 bg-white text-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[#004a8f] leading-tight space-y-1">
                        <p>{contact.name}</p>
                        <p>{contact.department}</p>
                      </div>
                      <span className="bg-[#d4edda] text-[#28a745] text-xs px-2 py-0.5 rounded-full">
                        {contact.type}
                      </span>
                    </div>
                    <div className="border-t border-black pt-2 flex justify-between items-center">
                      <p className="text-black text-xs font-medium">Opiekun: {contact.guardian}</p>
                      <a href="#" className="text-[#004a8f] text-sm">
                        Szczegóły
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {mobileLimits.contacts < clientData.contacts.length && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
                  onClick={() => loadMoreMobile('contacts')}
                >
                  Pokaż więcej
                </button>
              )}
            </section>

            {/* SPRZEDAŻ - MOBILE */}
            <section>
              <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6">Sprzedaż:</h2>
              <div className="space-y-3">
                {clientData.sales.slice(0, mobileLimits.sales).map((sale) => (
                  <div
                    key={sale.id}
                    className="border border-black rounded-lg p-3 bg-white text-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[#004a8f] leading-tight space-y-1">
                        <p>Kto: {sale.person}</p>
                        <p>Kwota: {sale.amount}</p>
                      </div>
                      <span className="bg-[#d4edda] text-[#28a745] text-xs px-2 py-0.5 rounded-full">
                        {sale.status}
                      </span>
                    </div>
                    <div className="border-t border-black pt-2 flex justify-between items-center">
                      <p className="text-black text-xs font-medium">
                        Data zawarcia: {sale.dateCreated}
                      </p>
                      <a href="#" className="text-[#004a8f] text-sm">
                        Szczegóły
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {mobileLimits.sales < clientData.sales.length && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
                  onClick={() => loadMoreMobile('sales')}
                >
                  Pokaż więcej
                </button>
              )}
            </section>

            {/* DŁUGI - MOBILE */}
            <section>
              <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6">Długi:</h2>
              <div className="space-y-3">
                {clientData.debts.slice(0, mobileLimits.debts).map((debt) => (
                  <div
                    key={debt.id}
                    className="border border-black rounded-lg p-3 bg-white text-sm"
                  >
                    <div className="text-[#004a8f] leading-tight space-y-1 mb-3">
                      <p>
                        Kwota: {debt.amount} {debt.currency}
                      </p>
                    </div>
                    <div className="border-t border-black pt-2 flex justify-between items-center">
                      <p className="text-black text-xs font-medium">
                        Ostatnia aktualizacja: {debt.lastUpdate}
                      </p>
                      <a href="#" className="text-[#004a8f] text-sm">
                        Szczegóły
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {mobileLimits.debts < clientData.debts.length && (
                <button
                  className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
                  onClick={() => loadMoreMobile('debts')}
                >
                  Pokaż więcej
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
                {/* 1. Toolbar */}
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

                {/* 2. Tabela */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">
                          Imię i nazwisko
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Firma</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">
                          Główny kontakt
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[#004a8f] font-normal text-sm">
                                {contact.name}
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5">
                                {contact.department}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{contact.company}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${contact.type === 'Główny' ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {contact.type === 'Główny' ? 'Tak' : 'Nie'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <a href="#" className="text-[#004a8f] hover:underline font-medium">
                              Szczegóły
                            </a>
                          </td>
                        </tr>
                      ))}
                      {paginatedContacts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">
                            Brak wyników.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Paginacja */}
                <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={contactPageSize}
                      onChange={(e) => {
                        setContactPageSize(Number(e.target.value));
                        setContactPage(1);
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    >
                      <option value={4}>4</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getDisplayRange(contactPage, contactPageSize, filteredContacts.length)}
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
                {/* 1. Toolbar */}
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

                {/* 2. Tabela */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">
                          Sprzedawca
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Kwota</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Status</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">
                          Data zawarcia
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-[#004a8f] font-normal text-sm">
                              {sale.person}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{sale.amount}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${sale.status === 'Zakończona' ? 'bg-[#d4edda] text-[#28a745]' : sale.status === 'W trakcie' ? 'bg-blue-100 text-[#004a8f]' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {sale.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{sale.dateCreated}</td>
                          <td className="px-6 py-4 text-sm">
                            <a href="#" className="text-[#004a8f] hover:underline font-medium">
                              Szczegóły
                            </a>
                          </td>
                        </tr>
                      ))}
                      {paginatedSales.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            Brak wyników.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Paginacja */}
                <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={salePageSize}
                      onChange={(e) => {
                        setSalePageSize(Number(e.target.value));
                        setSalePage(1);
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    >
                      <option value={4}>4</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getDisplayRange(salePage, salePageSize, filteredSales.length)}
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

              {/* === SEKCJA DŁUGÓW === */}
              <div className="mb-10 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
                {/* 1. Toolbar */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <h2 className="text-xl font-normal text-gray-800 shrink-0 w-32">Długi</h2>
                    <div className="w-80">
                      <input
                        type="text"
                        placeholder="Wyszukaj walutę lub kwotę..."
                        value={debtSearch}
                        onChange={(e) => setDebtSearch(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-500">Sortuj po:</span>
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]">
                      <option>Ostatnia aktualizacja</option>
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

                {/* 2. Tabela */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Kwota</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Waluta</th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">
                          Ostatnia aktualizacja
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-800">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDebts.map((debt) => (
                        <tr
                          key={debt.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-red-600 font-bold text-sm">{debt.amount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-gray-100 text-gray-700 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                              {debt.currency}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{debt.lastUpdate}</td>
                          <td className="px-6 py-4 text-sm">
                            <a href="#" className="text-[#004a8f] hover:underline font-medium">
                              Szczegóły
                            </a>
                          </td>
                        </tr>
                      ))}
                      {paginatedDebts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">
                            Brak wyników.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Paginacja */}
                <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                    <select
                      value={debtPageSize}
                      onChange={(e) => {
                        setDebtPageSize(Number(e.target.value));
                        setDebtPage(1);
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    >
                      <option value={4}>4</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getDisplayRange(debtPage, debtPageSize, filteredDebts.length)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDebtPage((p) => Math.max(1, p - 1))}
                      disabled={debtPage === 1}
                      className="h-8 w-8 rounded-full border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>
                    <span className="text-sm text-gray-700 font-medium">
                      Strona {debtPage} z {totalDebtPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDebtPage((p) => Math.min(totalDebtPages, p + 1))}
                      disabled={debtPage === totalDebtPages}
                      className="h-8 w-8 rounded-full border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
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
