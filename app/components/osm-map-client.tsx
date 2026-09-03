import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ExternalLink } from 'lucide-react';
import type { CompanyMapData } from '~/routes/map';
import 'leaflet/dist/leaflet.css';

export type OSMMapClientProps = {
  center: [number, number];
  zoom: number;
  className?: string;
  companies?: CompanyMapData[];
  isPicker?: boolean;
  selectedCoords?: [number, number] | null;
  onLocationSelect?: (lat: number, lng: number) => void;
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
                <div className="font-sans min-w-50">
                  <h3 className="mb-1 text-base font-bold text-[#004a8f]">{company.name}</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      <span className="font-semibold text-gray-800">NIP:</span> {company.nip}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-800">Typ:</span>{' '}
                      <span className="rounded bg-[#004a8f]/10 px-1.5 py-0.5 font-medium text-[#004a8f]">
                        {company.type}
                      </span>
                    </p>
                    <p className="mt-2 border-t border-gray-100 pt-1">
                      {company.street} <br />
                      {company.zipCode} {company.city}
                    </p>

                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <a
                        href={getGoogleMapsLink(company.latitude, company.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#004a8f] text-sm font-medium flex items-center gap-1.5 hover:underline"
                      >
                        Pokaż na mapie <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
