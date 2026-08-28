import { type ComponentType, type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MapPinned, Search } from 'lucide-react';

import { api } from '~/api/api';
import { useAuth } from '~/context/auth-context';
import type ApiError from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import { RoleGuard } from '~/lib/role-guard';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/lib/auth-guard';

export interface CompanyMapData {
  id: string;
  name: string;
  nip: string;
  street: string;
  city: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: CompanyMapData[];
  errorCode?: string;
  errors?: string[];
}

type OSMMapClientProps = {
  center: [number, number];
  zoom: number;
  className?: string;
  companies?: CompanyMapData[];
};

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [MapComponent, setMapComponent] = useState<ComponentType<OSMMapClientProps> | null>(null);
  const [companies, setCompanies] = useState<CompanyMapData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const searchTerm = searchParams.get('searchTerm') || '';

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const endpoint = searchTerm
          ? `company/map?searchTerm=${encodeURIComponent(searchTerm)}`
          : `company/map`;

        const response = await api.get<ApiResponse>(endpoint);

        if (response.data.success) {
          setCompanies(response.data.data);
        } else {
          setCompanies([]);
          setErrorMessage(response.data.message || 'Nie udało się załadować danych');
        }
      } catch (error_: unknown) {
        const err = error_ as ApiError;
        const errorData = err.response?.data;

        let errMsg = err.message || 'Wystąpił nieznany błąd.';

        if (errorData?.errorCode) {
          errMsg = getErrorMessage(errorData.errorCode, errorData.message);
        }

        setErrorMessage(errMsg);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      void fetchCompanies();
    }
  }, [searchTerm, user]);

  useEffect(() => {
    let isMounted = true;
    import('~/components/osm-map-client').then((module) => {
      if (isMounted) setMapComponent(() => module.default);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const center = useMemo<[number, number]>(() => [52.0693, 19.4803], []);

  const handleSearch = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const term = formData.get('searchTerm') as string;

    if (term) {
      setSearchParams({ searchTerm: term });
    } else {
      setSearchParams({});
    }
  };

  const renderMapArea = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#f1f5f9] text-[#0f172a]">
          <div className="animate-pulse flex items-center gap-2 text-[#004a8f]">
            <MapPinned className="animate-bounce" /> Ładowanie mapy...
          </div>
        </div>
      );
    }

    if (MapComponent) {
      return (
        <MapComponent
          center={center}
          zoom={6}
          className="h-full w-full z-0"
          companies={companies}
        />
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f1f5f9] text-[#0f172a]">
        <div className="flex items-center gap-2 text-[#004a8f]">
          <MapPinned /> Brak komponentu mapy
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Manager', 'User']}>
        <MainLayout
          wrapperClassName="relative min-h-screen overflow-hidden bg-[#f1f5f9] pt-20 md:pl-32"
          contentClassName="relative w-full h-[calc(100vh-5rem)] p-0 m-0"
          navDesktopWidthClass="w-32"
          navDesktopClassName="top-20 border-r-0 pt-4"
        >
          <section className="w-full h-full relative">
            <div className="absolute top-4 right-4 z-400 md:right-6 w-72 md:w-96 shadow-lg rounded-md">
              <form
                id="search-form"
                role="search"
                className="flex w-full bg-white rounded-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#004a8f]"
                onSubmit={handleSearch}
              >
                <input
                  type="search"
                  name="searchTerm"
                  placeholder="Szukaj (nazwa, miasto, NIP)..."
                  defaultValue={searchTerm}
                  className="w-full px-4 py-3 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-white text-[#004a8f] hover:bg-gray-50 flex items-center justify-center"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>

            {errorMessage && (
              <div className="absolute top-20 right-4 z-400 md:right-6 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-md text-sm">
                {errorMessage}
              </div>
            )}

            {renderMapArea()}
          </section>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
