import { type ComponentType, type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MapPinned, Search } from 'lucide-react';
import { useAuth } from '~/context/auth-context';
import { RoleGuard } from '~/components/guards/role-guard';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/components/guards/auth-guard';
import type { CompanyMapData } from '~/types/map';
import { STANDARD_ROLES } from '~/constants/roles';
import { useMapCompanies } from '~/hooks/use-map';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

type OSMMapClientProps = {
  center: [number, number];
  zoom: number;
  className?: string;
  companies?: CompanyMapData[];
};

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const searchTerm = searchParams.get('searchTerm') || '';

  const [MapComponent, setMapComponent] = useState<ComponentType<OSMMapClientProps> | null>(null);

  const {
    data: companies = [],
    isLoading,
    error: queryError,
  } = useMapCompanies(searchTerm, Boolean(user));

  useEffect(() => {
    let isMounted = true;
    import('~/components/map/osm-map-client').then((module) => {
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
    const term = (formData.get('searchTerm') as string)?.trim();

    if (term) {
      setSearchParams({ searchTerm: term });
    } else {
      setSearchParams({});
    }
  };

  const renderMapArea = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-loading-bg text-loading-text">
          <div className="animate-pulse flex items-center gap-2 text-brand">
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
      <div className="flex h-full w-full items-center justify-center bg-loading-bg text-loading-text">
        <div className="flex items-center gap-2 text-brand">
          <MapPinned /> Brak komponentu mapy
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout
          wrapperClassName="relative min-h-screen overflow-hidden bg-loading-bg pt-20 md:pl-32"
          contentClassName="relative w-full h-[calc(100vh-5rem)] p-0 m-0"
          navDesktopWidthClass="w-52"
          navDesktopClassName="top-20 border-r-0 pt-4"
        >
          <section className="w-full h-full relative">
            <div className="absolute top-4 right-4 z-400 md:right-6 w-72 md:w-96 shadow-lg rounded-md">
              <form
                id="search-form"
                role="search"
                className="flex w-full bg-white rounded-md overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-brand"
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
                  className="px-4 py-3 bg-white text-brand hover:bg-gray-50 flex items-center justify-center"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>

            <QueryErrorBanner
              error={queryError}
              fallbackMessage="Nie udało się pobrać listy firm."
              className="mb-6"
            />

            {renderMapArea()}
          </section>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
