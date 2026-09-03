import React, { type ComponentType, useEffect, useMemo, useState } from 'react';
import { MainLayout } from '~/components/layout/main-layout';
import { MapPinned, Pencil, Plus } from 'lucide-react';
import { api } from '~/api/api';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CompanyClientHeader } from '~/components/companies/company-client-header';
import { CompanyAddressesMobile } from '~/components/companies/company-addresses-mobile';
import { CompanyContactsSection } from '~/components/companies/company-contacts-section';
import { CompanySalesSection } from '~/components/companies/company-sales-section';
import { CompanyDebtsSection } from '~/components/companies/company-debts-section';
import type { OSMMapClientProps } from '~/components/osm-map-client';
import { AuthGuard } from '~/lib/auth-guard';
import {
  EditCompanyDialog,
  type EditCompanyRequest,
} from '~/components/companies/edit-company-dialog';

import { formatAddressType, getAddressTypeBadgeClass } from '~/utils/address-helpers';
import { Button } from '~/components/ui/button';
import {
  type AddressItemToEdit,
  CompanyAddressDialog,
  type CompanyAddressFormData,
} from '~/components/companies/company-address-dialog';

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
  onEditAddress?: (addressId: string) => void,
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
        onEditAddress={onEditAddress}
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center text-gray-600 animate-pulse gap-2">
      <MapPinned className="animate-bounce" /> Ładowanie mapy...
    </div>
  );
};

export default function CompanyDetails() {
  const { clientId } = useParams<{ clientId: string }>();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const [selectedAddressForDialog, setSelectedAddressForDialog] =
    useState<AddressItemToEdit | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

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
      name: addr.street,
      nip: '',
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

  const editCompanyMutation = useMutation({
    mutationFn: async (payload: EditCompanyRequest) => {
      const res = await api.patch('/company', payload);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company-details', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['company-edit-details', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsEditDialogOpen(false);
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (formData: CompanyAddressFormData) => {
      if (formData.addressId) {
        const res = await api.patch('/company/address', formData);
        return res.data;
      }

      const res = await api.post(`/company/address/${clientId}`, {
        street: formData.street,
        city: formData.city,
        zipCode: formData.zipCode,
        longitude: formData.longitude,
        latitude: formData.latitude,
        type: formData.type,
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company-addresses', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['company-details', clientId] });
      setIsAddressModalOpen(false);
      setSelectedAddressForDialog(null);
    },
  });

  const handleOpenAddAddress = () => {
    setSelectedAddressForDialog(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: CompanyAddress) => {
    setSelectedAddressForDialog(addr);
    setIsAddressModalOpen(true);
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
            <CompanyClientHeader
              isLoading={isBasicInfoLoading}
              isError={isError}
              basicInfo={basicInfo}
              onEditClick={() => setIsEditDialogOpen(true)}
            />

            <div className="block lg:hidden space-y-6">
              <CompanyAddressesMobile addresses={addresses} onEditAddress={handleOpenEditAddress} />
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

              <div className="w-100 xl:w-112.5 shrink-0 sticky top-24 space-y-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-normal text-gray-800">Lokalizacje adresów</h2>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenAddAddress}
                      className="h-7 text-xs bg-[#004a8f] text-white hover:bg-blue-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Dodaj adres
                    </Button>
                  </div>

                  {/* Mapa */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden h-96 bg-gray-100 relative mb-4">
                    {renderMapContent(
                      isAddressesLoading,
                      addresses,
                      MapComponent,
                      mapCenter,
                      mapCompaniesData,
                      (addressId) => {
                        const target = addresses.find((a) => a.id.toString() === addressId);
                        if (target) handleOpenEditAddress(target);
                      },
                    )}
                  </div>

                  {/* Lista kafelków adresów */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 border border-gray-200 rounded-md bg-gray-50/50 flex justify-between items-start text-xs"
                      >
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border mb-1 ${getAddressTypeBadgeClass(
                              addr.type,
                            )}`}
                          >
                            {formatAddressType(addr.type)}
                          </span>
                          <p className="font-semibold text-gray-800">{addr.street}</p>
                          <p className="text-gray-500">
                            {addr.zipCode} {addr.city}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="h-7 text-xs text-[#004a8f] hover:text-blue-900 hover:bg-blue-50 px-2"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edytuj
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EditCompanyDialog
          companyId={clientId ?? null}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={async (data) => {
            await editCompanyMutation.mutateAsync(data);
          }}
          isLoading={editCompanyMutation.isPending}
        />

        <CompanyAddressDialog
          address={selectedAddressForDialog}
          isOpen={isAddressModalOpen}
          onClose={() => {
            setIsAddressModalOpen(false);
            setSelectedAddressForDialog(null);
          }}
          onSave={async (data) => {
            await saveAddressMutation.mutateAsync(data);
          }}
          isLoading={saveAddressMutation.isPending}
        />
      </MainLayout>
    </AuthGuard>
  );
}
