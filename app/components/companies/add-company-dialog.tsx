import React, { type ComponentType, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, MapPin, MapPinned, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { OSMMapClientProps } from '~/components/osm-map-client';
import { forwardGeocode, reverseGeocode } from '~/utils/geocoding';

import { formatAddressType, getAddressTypeBadgeClass } from '~/utils/address-helpers';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

export interface AddCompanyAddressRequest {
  street: string;
  city: string;
  zipCode: string;
  longitude: number;
  latitude: number;
  type: string;
}

export interface AddCompanyRequest {
  name: string;
  nip: string;
  addresses: AddCompanyAddressRequest[];
}

interface FormAddressItem extends AddCompanyAddressRequest {
  id: string;
}

interface AddCompanyDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (companyData: AddCompanyRequest) => Promise<void>;
  readonly isLoading?: boolean;
}

export const AddCompanyDialog: React.FC<AddCompanyDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');

  const isUpdatingFromMapRef = useRef(false);

  const createEmptyAddress = (type = 'Branch'): FormAddressItem => ({
    id: crypto.randomUUID(),
    street: '',
    city: '',
    zipCode: '',
    latitude: 52.0693,
    longitude: 19.4803,
    type,
  });

  const [addresses, setAddresses] = useState<FormAddressItem[]>([
    createEmptyAddress('Headquarters'),
  ]);

  const [activeAddressId, setActiveAddressId] = useState<string>(addresses[0].id);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [MapComponent, setMapComponent] = useState<ComponentType<OSMMapClientProps> | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      import('~/components/osm-map-client').then((module) => {
        if (isMounted) setMapComponent(() => module.default as ComponentType<OSMMapClientProps>);
      });
    }
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isOpen]);

  const activeAddress = addresses.find((a) => a.id === activeAddressId) || addresses[0];

  const handleAddAddress = () => {
    const newAddr = createEmptyAddress('Branch');
    setAddresses((prev) => [...prev, newAddr]);
    setActiveAddressId(newAddr.id);
  };

  const handleRemoveAddress = (idToRemove: string) => {
    if (addresses.length <= 1) return;

    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== idToRemove);
      if (!filtered.some((a) => a.type === 'Headquarters')) {
        filtered[0].type = 'Headquarters';
      }
      return filtered;
    });

    if (activeAddressId === idToRemove) {
      const remaining = addresses.filter((a) => a.id !== idToRemove);
      setActiveAddressId(remaining[0].id);
    }
  };

  const handleAddressChange = (
    id: string,
    field: keyof AddCompanyAddressRequest,
    val: string | number,
  ) => {
    setAddresses((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)));

    if (field === 'street' || field === 'city' || field === 'zipCode') {
      if (isUpdatingFromMapRef.current) return;

      const target = addresses.find((a) => a.id === id);
      if (!target) return;

      const updated = { ...target, [field]: val };
      const fullQuery = `${updated.street} ${updated.city} ${updated.zipCode}`.trim();

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        if (fullQuery.length >= 4) {
          setIsGeocoding(true);
          const geo = await forwardGeocode(fullQuery);
          setIsGeocoding(false);

          if (geo) {
            setAddresses((curr) =>
              curr.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      latitude: geo.lat,
                      longitude: geo.lng,
                    }
                  : item,
              ),
            );
          }
        }
      }, 700);
    }
  };

  const activeAddressIdRef = useRef(activeAddressId);
  useEffect(() => {
    activeAddressIdRef.current = activeAddressId;
  }, [activeAddressId]);

  const handleLocationPicked = async (lat: number, lng: number) => {
    const currentId = activeAddressIdRef.current;
    if (!currentId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setAddresses((prev) =>
      prev.map((item) =>
        item.id === currentId ? { ...item, latitude: lat, longitude: lng } : item,
      ),
    );

    setIsGeocoding(true);
    const data = await reverseGeocode(lat, lng);
    setIsGeocoding(false);

    if (data) {
      isUpdatingFromMapRef.current = true;

      setAddresses((prev) =>
        prev.map((item) => {
          if (item.id !== currentId) return item;
          return {
            ...item,
            street: data.street || item.street,
            city: data.city || item.city,
            zipCode: data.zipCode || item.zipCode,
          };
        }),
      );

      setTimeout(() => {
        isUpdatingFromMapRef.current = false;
      }, 100);
    }
  };

  const handleSetHeadquarters = (idToSet: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        type: a.id === idToSet ? 'Headquarters' : a.type === 'Headquarters' ? 'Branch' : a.type,
      })),
    );
  };

  const resetForm = () => {
    setName('');
    setNip('');
    const defaultAddr = createEmptyAddress('Headquarters');
    setAddresses([defaultAddr]);
    setActiveAddressId(defaultAddr.id);
    setFormError(null);
  };

  const handleClose = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push('Nazwa firmy jest wymagana.');
    if (!nip.trim()) validationErrors.push('Numer NIP jest wymagany.');

    const hqCount = addresses.filter((a) => a.type === 'Headquarters').length;
    if (hqCount !== 1) {
      validationErrors.push('Firma musi posiadać dokładnie jedną siedzibę główną (Headquarters).');
    }

    const hasInvalid = addresses.some(
      (a) => !a.street.trim() || !a.city.trim() || !a.zipCode.trim(),
    );
    if (hasInvalid) {
      validationErrors.push(
        'Uzupełnij wszystkie dane adresowe (ulica, miasto, kod pocztowy) dla każdej z lokalizacji.',
      );
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    const payload: AddCompanyRequest = {
      name: name.trim(),
      nip: nip.replace(/[\s-]/g, ''),
      addresses: addresses.map(({ street, city, zipCode, latitude, longitude, type }) => ({
        street: street.trim(),
        city: city.trim(),
        zipCode: zipCode.trim(),
        latitude,
        longitude,
        type,
      })),
    };

    try {
      await onSave(payload);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback = responseData?.message || apiError.message || 'Nie udało się dodać firmy.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  const { data: addressTypes = [], isLoading: isTypesLoading } = useQuery({
    queryKey: ['company-address-types'],
    queryFn: async () => {
      const res = await api.get('/company/address/types');
      return (res.data?.data || res.data?.value || []) as string[];
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-300 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Dodaj nową firmę z lokalizacjami
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 py-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
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

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3">
              Dane podmiotu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="company-name" className="text-xs font-medium text-gray-700">
                  Nazwa firmy *
                </label>
                <input
                  id="company-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Pol-Stal Sp. z o.o."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-[#004a8f]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="company-nip" className="text-xs font-medium text-gray-700">
                  NIP *
                </label>
                <input
                  id="company-nip"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="10 cyfr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-1 focus:ring-[#004a8f]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Adresy i placówki ({addresses.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAddress}
                  className="h-8 text-xs flex items-center gap-1 text-[#004a8f]"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj kolejny adres
                </Button>
              </div>

              <div className="space-y-4 max-h-120 overflow-y-auto pr-1">
                {addresses.map((addr, index) => {
                  const isCurrent = addr.id === activeAddressId;
                  const isHq = addr.type === 'Headquarters';

                  return (
                    <div
                      key={addr.id}
                      onClick={() => setActiveAddressId(addr.id)}
                      className={`p-4 border rounded-lg transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'border-[#004a8f] bg-blue-50/20 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isHq ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            #{index + 1} {isHq ? 'Siedziba główna' : 'Oddział'}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] text-[#004a8f] font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Wybrany na mapie
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isHq && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetHeadquarters(addr.id);
                              }}
                              className="text-xs text-blue-800 hover:underline"
                            >
                              Ustaw jako centralę
                            </button>
                          )}
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAddress(addr.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Usuń ten adres"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label
                            htmlFor={`street-${addr.id}`}
                            className="text-[11px] font-medium text-gray-600"
                          >
                            Ulica i numer *
                          </label>
                          <input
                            id={`street-${addr.id}`}
                            value={addr.street}
                            onChange={(e) => handleAddressChange(addr.id, 'street', e.target.value)}
                            placeholder="np. Kolejowa 5"
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-[#004a8f]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor={`type-${addr.id}`}
                            className="text-[11px] font-medium text-gray-600"
                          >
                            Typ adresu
                          </label>
                          <select
                            id={`type-${addr.id}`}
                            value={addr.type}
                            onChange={(e) => handleAddressChange(addr.id, 'type', e.target.value)}
                            disabled={isTypesLoading}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-[#004a8f]"
                          >
                            {addressTypes.map((t) => (
                              <option key={t} value={t}>
                                {formatAddressType(t)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor={`zip-${addr.id}`}
                            className="text-[11px] font-medium text-gray-600"
                          >
                            Kod pocztowy *
                          </label>
                          <input
                            id={`zip-${addr.id}`}
                            value={addr.zipCode}
                            onChange={(e) =>
                              handleAddressChange(addr.id, 'zipCode', e.target.value)
                            }
                            placeholder="00-000"
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-[#004a8f]"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label
                            htmlFor={`city-${addr.id}`}
                            className="text-[11px] font-medium text-gray-600"
                          >
                            Miejscowość *
                          </label>
                          <input
                            id={`city-${addr.id}`}
                            value={addr.city}
                            onChange={(e) => handleAddressChange(addr.id, 'city', e.target.value)}
                            placeholder="np. Warszawa"
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-[#004a8f]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-2 sticky top-0">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Lokalizacja zaznaczonego adresu
                </h3>
                {isGeocoding && (
                  <span className="text-xs text-[#004a8f] flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synchronizacja...
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Wpisz dane po lewej lub kliknij bezpośrednio na mapie, aby automatycznie uzupełnić
                adres.
              </p>

              <div className="h-100 w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative">
                {MapComponent ? (
                  <MapComponent
                    center={[activeAddress.latitude, activeAddress.longitude]}
                    zoom={13}
                    className="h-full w-full"
                    isPicker={true}
                    selectedCoords={[activeAddress.latitude, activeAddress.longitude]}
                    onLocationSelect={handleLocationPicked}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-500 text-sm gap-2">
                    <MapPinned className="animate-bounce text-[#004a8f]" /> Ładowanie mapy...
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>
                  Współrzędne: {activeAddress.latitude.toFixed(4)},{' '}
                  {activeAddress.longitude.toFixed(4)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Edytujesz adres:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium border text-[11px] ${getAddressTypeBadgeClass(activeAddress.type)}`}
                  >
                    {formatAddressType(activeAddress.type)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isGeocoding}
              className="bg-[#004a8f] text-white hover:bg-blue-800"
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz firmę i adresy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
