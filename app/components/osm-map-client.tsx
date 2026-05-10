import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { CompanyMapData } from '~/routes/map';
import 'leaflet/dist/leaflet.css';

type OSMMapClientProps = {
  center: [number, number];
  zoom: number;
  className?: string;
  companies?: CompanyMapData[];
};

export default function OSMMapClient({
  center,
  zoom,
  className,
  companies = [],
}: Readonly<OSMMapClientProps>) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {companies.map((company) => {
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
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
