import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ExternalLink } from 'lucide-react';
import type { CompanyMapData } from '~/routes/map';
import 'leaflet/dist/leaflet.css';
import { formatAddressType, getAddressTypeBadgeClass } from '~/utils/address-helpers';
export type OSMMapClientProps = {
  center: [number, number];
  zoom: number;
  className?: string;
  companies?: CompanyMapData[];
  isPicker?: boolean;
  selectedCoords?: [number, number] | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  onEditAddress?: (addressId: string) => void;
};

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapViewUpdater({ coords }: { coords?: [number, number] | null }) {
  const map = useMap();
  const prevCoordsRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!coords || !coords[0] || !coords[1]) return;

    const [lat, lng] = coords;
    const prev = prevCoordsRef.current;

    if (prev && Math.abs(prev[0] - lat) < 0.0001 && Math.abs(prev[1] - lng) < 0.0001) {
      return;
    }

    prevCoordsRef.current = [lat, lng];
    map.flyTo([lat, lng], 14, { duration: 0.5 });
  }, [coords?.[0], coords?.[1], map]);

  return null;
}

function LocationPickerHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const selectRef = useRef(onSelect);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useMapEvents({
    click(e) {
      if (selectRef.current) {
        selectRef.current(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

export default function OSMMapClient({
  center,
  zoom,
  className,
  companies = [],
  isPicker = false,
  selectedCoords,
  onLocationSelect,
  onEditAddress,
}: Readonly<OSMMapClientProps>) {
  const getGoogleMapsLink = (lat: number, lng: number) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <InvalidateSizeOnMount />
      <MapViewUpdater coords={selectedCoords} />

      {isPicker && onLocationSelect && <LocationPickerHandler onSelect={onLocationSelect} />}

      {isPicker && selectedCoords && (
        <Marker position={selectedCoords}>
          <Popup>Wybrana lokalizacja adresu</Popup>
        </Marker>
      )}

      {!isPicker &&
        companies.map((company) => {
          if (!company.latitude || !company.longitude) return null;

          return (
            <Marker key={company.id} position={[company.latitude, company.longitude]}>
              <Popup>
                <div className="font-sans min-w-48 p-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getAddressTypeBadgeClass(
                        company.type,
                      )}`}
                    >
                      {formatAddressType(company.type)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 leading-snug mb-3">
                    <p className="font-semibold text-gray-900">{company.street}</p>
                    <p className="text-gray-500">
                      {company.zipCode} {company.city}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-2 flex items-center justify-between gap-3 text-xs">
                    {onEditAddress && (
                      <button
                        type="button"
                        onClick={() => onEditAddress(company.id)}
                        className="text-[#004a8f] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Edytuj adres
                      </button>
                    )}

                    <a
                      href={getGoogleMapsLink(company.latitude, company.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-[#004a8f] font-medium flex items-center gap-1 ml-auto hover:underline"
                    >
                      Nawiguj <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
