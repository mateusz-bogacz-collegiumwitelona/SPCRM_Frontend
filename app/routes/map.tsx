import { type ComponentType, type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AlertCircle, MapPinned, Search, X } from 'lucide-react';

import { api } from '~/api/api';
import { useAuth } from '~/context/auth-context';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
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
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const searchTerm = searchParams.get('searchTerm') || '';

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setFormError(null);

      try {
        const endpoint = searchTerm
          ? `company/map?searchTerm=${encodeURIComponent(searchTerm)}`
          : `company/map`;

        const response = await api.get<ApiResponse>(endpoint);

        if (response.data.success) {
          setCompanies(response.data.data);
        } else {
          setCompanies([]);
          setFormError({
            title: getErrorMessage(
              response.data.errorCode,
              response.data.message || 'Nie udało się załadować danych',
            ),
            details:
              response.data.errors && response.data.errors.length > 0
                ? response.data.errors
                : undefined,
          });
        }
      } catch (error_: unknown) {
        const err = error_ as ApiError;
        const errorData = err.response?.data;

        const code = errorData?.errorCode;
        const fallback = errorData?.message || err.message || 'Wystąpił nieznany błąd.';

        setFormError({
          title: getErrorMessage(code, fallback),
          details:
            errorData?.errors && errorData.errors.length > 0
              ? errorData.errors.map((item) => getErrorMessage(item, item))
              : undefined,
        });
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

            {formError && (
              <div className="absolute top-20 right-4 z-400 md:right-6 w-72 md:w-96 flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-xs shadow-lg transition-all text-left">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 pr-3">
                  <p className="font-medium leading-tight">{formError.title}</p>
                  {formError.details && formError.details.length > 0 && (
                    <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-[11px] text-red-700">
                      {formError.details.map((detailErr, idx) => (
                        <li key={idx}>{detailErr}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                  title="Zamknij"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {renderMapArea()}
          </section>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
