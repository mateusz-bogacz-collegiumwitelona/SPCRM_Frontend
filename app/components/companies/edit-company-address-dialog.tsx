import React, { type ComponentType, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, MapPinned } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
import type { OSMMapClientProps } from '~/components/osm-map-client';
import { forwardGeocode, reverseGeocode } from '~/utils/geocoding';
import { formatAddressType, getAddressTypeBadgeClass } from '~/utils/address-helpers';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

export interface EditCompanyAddressRequest {
  addressId: string;
  street: string;
  city: string;
  zipCode: string;
  longitude: number;
  latitude: number;
  type: string;
}

export interface AddressItemToEdit {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  type: string;
}

interface EditCompanyAddressDialogProps {
  readonly address: AddressItemToEdit | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (data: EditCompanyAddressRequest) => Promise<void>;
  readonly isLoading?: boolean;
}

export const EditCompanyAddressDialog: React.FC<EditCompanyAddressDialogProps> = ({
  address,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [type, setType] = useState('Branch');
  const [coords, setCoords] = useState<[number, number]>([52.0693, 19.4803]);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [MapComponent, setMapComponent] = useState<ComponentType<OSMMapClientProps> | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromMapRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      import('~/components/osm-map-client').then((module) => {
        if (isMounted) setMapComponent(() => module.default as ComponentType<OSMMapClientProps>);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (address && isOpen) {
      setStreet(address.street || '');
      setCity(address.city || '');
      setZipCode(address.zipCode || '');
      setType(address.type || 'Branch');

      if (address.latitude && address.longitude) {
        setCoords([address.latitude, address.longitude]);
      } else {
        setCoords([52.0693, 19.4803]);
      }
      setErrorMessage(null);
    }
  }, [address, isOpen]);

  const handleFieldChange = (field: 'street' | 'city' | 'zipCode', value: string) => {
    if (field === 'street') setStreet(value);
    if (field === 'city') setCity(value);
    if (field === 'zipCode') setZipCode(value);

    if (isUpdatingFromMapRef.current) return;

    const s = field === 'street' ? value : street;
    const c = field === 'city' ? value : city;
    const z = field === 'zipCode' ? value : zipCode;
    const fullQuery = `${s} ${c} ${z}`.trim();

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      if (fullQuery.length >= 4) {
        setIsGeocoding(true);
        const geo = await forwardGeocode(fullQuery);
        setIsGeocoding(false);
        if (geo) {
          setCoords([geo.lat, geo.lng]);
        }
      }
    }, 700);
  };

  const handleLocationPicked = async (lat: number, lng: number) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    setCoords([lat, lng]);
    setIsGeocoding(true);
    const data = await reverseGeocode(lat, lng);
    setIsGeocoding(false);

    if (data) {
      isUpdatingFromMapRef.current = true;
      if (data.street) setStreet(data.street);
      if (data.city) setCity(data.city);
      if (data.zipCode) setZipCode(data.zipCode);

      setTimeout(() => {
        isUpdatingFromMapRef.current = false;
      }, 100);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address) return;

    if (!street.trim() || !city.trim() || !zipCode.trim()) {
      setErrorMessage('Wszystkie pola adresowe są wymagane.');
      return;
    }

    const payload: EditCompanyAddressRequest = {
      addressId: address.id,
      street: street.trim(),
      city: city.trim(),
      zipCode: zipCode.trim(),
      latitude: coords[0],
      longitude: coords[1],
      type,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (err as Error)?.message || 'Nie udało się zaktualizować adresu.';
      setErrorMessage(getErrorMessage(code, fallback));
    }
  };

  const { data: addressTypes = [], isLoading: isTypesLoading } = useQuery<string[]>({
    queryKey: ['company-address-types'],
    queryFn: async () => {
      const res = await api.get('/company/address/types');
      const list = res.data?.data ?? res.data?.value ?? res.data;
      return Array.isArray(list) ? list : [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-220 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Edytuj adres firmy
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="address-type-select"
                    className="text-xs font-medium text-gray-700"
                  >
                    Typ adresu *
                  </label>
                  {address?.type === 'Headquarters' && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      Aktualna centrala
                    </span>
                  )}
                </div>

                <select
                  id="address-type-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isTypesLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                  required
                >
                  {isTypesLoading && <option value="">Ładowanie typów...</option>}
                  {!isTypesLoading && addressTypes.length === 0 && (
                    <option value="">Brak dostępnych typów</option>
                  )}
                  {addressTypes.map((t) => (
                    <option key={t} value={t}>
                      {formatAddressType(t)}
                    </option>
                  ))}
                </select>

                {type === 'Headquarters' && address?.type !== 'Headquarters' && (
                  <p className="text-[11px] text-blue-700">
                    Ustawienie tego adresu jako Siedziba główna automatycznie zmieni dotychczasową
                    centralę na Oddział.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="address-street-input" className="text-xs font-medium text-gray-700">
                  Ulica i numer *
                </label>
                <input
                  id="address-street-input"
                  value={street}
                  onChange={(e) => handleFieldChange('street', e.target.value)}
                  placeholder="np. Złota 44"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="address-zip-input" className="text-xs font-medium text-gray-700">
                    Kod pocztowy *
                  </label>
                  <input
                    id="address-zip-input"
                    value={zipCode}
                    onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    placeholder="00-000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="address-city-input" className="text-xs font-medium text-gray-700">
                    Miejscowość *
                  </label>
                  <input
                    id="address-city-input"
                    value={city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="np. Warszawa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Pozycja na mapie</span>
                {isGeocoding && (
                  <span className="text-[11px] text-[#004a8f] flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Geokodowanie...
                  </span>
                )}
              </div>

              <div className="h-64 w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative">
                {MapComponent ? (
                  <MapComponent
                    center={coords}
                    zoom={13}
                    className="h-full w-full"
                    isPicker={true}
                    selectedCoords={coords}
                    onLocationSelect={handleLocationPicked}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-500 text-sm gap-2">
                    <MapPinned className="animate-bounce text-[#004a8f]" /> Ładowanie mapy...
                  </div>
                )}
              </div>

              <div className="text-[11px] text-gray-500 flex justify-between">
                <span>
                  Współrzędne: {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                </span>
                <span className={`px-1.5 py-0.5 rounded border ${getAddressTypeBadgeClass(type)}`}>
                  {formatAddressType(type)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isGeocoding}
              className="bg-[#004a8f] text-white hover:bg-blue-800"
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany adresu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
