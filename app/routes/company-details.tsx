import React, { useState, useMemo, useEffect, type ComponentType } from 'react';
import { MainLayout } from '~/components/layout/main-layout';
import { MapPinned } from 'lucide-react';
import { api } from '~/api/api';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import { CompanyClientHeader } from '~/components/companies/company-client-header';
import { CompanyAddressesMobile } from '~/components/companies/company-addresses-mobile';
import { CompanyContactsSection } from '~/components/companies/company-contacts-section';
import { CompanySalesSection } from '~/components/companies/company-sales-section';
import { CompanyDebtsSection } from '~/components/companies/company-debts-section';
import type { OSMMapClientProps } from '~/components/osm-map-client';
import { AuthGuard } from '~/lib/auth-guard';

interface CompanyAddress {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  type: string;
}

const getDisplayRange = (page: number, size: number, total: number) => {
  if (total === 0) return 'Wyświetlanie 0 do 0 z 0 wyników';
  return `Wyświetlanie ${(page - 1) * size + 1} do ${Math.min(page * size, total)} z ${total} wyników`;
};

const renderMapContent = (
  isAddressesLoading: boolean,
  addresses: CompanyAddress[],
  MapComponent: ComponentType<OSMMapClientProps> | null,
  mapCenter: [number, number],
  mapCompaniesData: OSMMapClientProps['companies'],
) => {
  if (isAddressesLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-600 animate-pulse gap-2">
        <MapPinned className="animate-bounce" /> Pobieranie adresów...
      </div>
    );
  }
  if (addresses.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-500 text-sm text-center p-6">
        Brak adresów do wyświetlenia na mapie.
      </div>
    );
  }
  if (MapComponent) {
    return (
      <MapComponent
        center={mapCenter}
        zoom={6}
        className="h-full w-full"
        companies={mapCompaniesData}
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center text-gray-600 animate-pulse gap-2">
      <MapPinned className="animate-bounce" /> Ładowanie mapy...
    </div>
  );
};

const CompanyDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
  } = useQuery({
    queryKey: ['company-details', clientId],
    queryFn: async () => (await api.get('/company', { params: { companyId: clientId } })).data.data,
    enabled: !!clientId,
  });

  const { data: addressesData, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['company-addresses', clientId],
    queryFn: async () =>
      (
        await api.get('/company/addresses', {
          params: { companyId: clientId, PageNumber: 1, PageSize: 100 },
        })
      ).data.data,
    enabled: !!clientId,
  });

  const addresses: CompanyAddress[] = addressesData?.items || [];

  const [MapComponent, setMapComponent] = useState<ComponentType<OSMMapClientProps> | null>(null);

  useEffect(() => {
    let isMounted = true;
    import('~/components/osm-map-client').then((module) => {
      if (isMounted) setMapComponent(() => module.default as ComponentType<OSMMapClientProps>);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const mapCompaniesData = useMemo<OSMMapClientProps['companies']>(() => {
    return addresses.map((addr) => ({
      id: addr.id.toString(),
      name: 'Adres firmy',
      nip: 'Brak',
      street: addr.street,
      city: addr.city,
      zipCode: addr.zipCode,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      type: addr.type,
    }));
  }, [addresses]);

  const mapCenter = useMemo<[number, number]>(() => {
    const firstWithCoords = addresses.find((a) => a.latitude && a.longitude);
    return firstWithCoords
      ? [firstWithCoords.latitude!, firstWithCoords.longitude!]
      : [51.9194, 19.1451];
  }, [addresses]);

  return (
    <AuthGuard>
      <MainLayout>
        <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
            <CompanyClientHeader
              isLoading={isBasicInfoLoading}
              isError={isError}
              basicInfo={basicInfo}
            />

            <div className="block lg:hidden space-y-6">
              <CompanyAddressesMobile addresses={addresses} />
              <CompanyContactsSection clientId={clientId} getDisplayRange={getDisplayRange} />
              <CompanySalesSection clientId={clientId} getDisplayRange={getDisplayRange} />
              <CompanyDebtsSection clientId={clientId} getDisplayRange={getDisplayRange} />
            </div>

            <div className="hidden lg:flex flex-row gap-8 items-start relative">
              <div className="flex-1 min-w-0">
                <CompanyContactsSection clientId={clientId} getDisplayRange={getDisplayRange} />
                <CompanySalesSection clientId={clientId} getDisplayRange={getDisplayRange} />
                <CompanyDebtsSection clientId={clientId} getDisplayRange={getDisplayRange} />
              </div>

              <div className="w-100 xl:w-112.5 shrink-0 sticky top-24">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-normal text-gray-800 mb-4">Lokalizacje adresów</h2>
                  <div className="border border-gray-300 rounded-lg overflow-hidden h-125 bg-gray-100 relative">
                    {renderMapContent(
                      isAddressesLoading,
                      addresses,
                      MapComponent,
                      mapCenter,
                      mapCompaniesData,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default CompanyDetails;
