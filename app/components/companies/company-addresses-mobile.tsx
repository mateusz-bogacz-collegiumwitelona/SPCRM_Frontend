import React, { useState } from 'react';
import { formatAddressType, getAddressTypeBadgeClass } from '~/utils/address-helpers';
import { ExternalLink, Navigation, Pencil } from 'lucide-react';

interface Address {
  id: string;
  street: string;
  zipCode: string;
  city: string;
  type: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface CompanyAddressesMobileProps {
  addresses: Address[];
  onEditAddress?: (addr: Address) => void;
}

const getGoogleMapsDirectionsUrl = (addr: Address) => {
  if (addr.latitude && addr.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${addr.latitude},${addr.longitude}`;
  }
  const destinationQuery = `${addr.street}, ${addr.zipCode} ${addr.city}`.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;
};

export const CompanyAddressesMobile: React.FC<CompanyAddressesMobileProps> = ({
  addresses,
  onEditAddress,
}) => {
  const [limit, setLimit] = useState(3);

  return (
    <section className="block xl:hidden">
      <h2 className="text-xl text-[#004a8f] font-normal mb-3">Adresy:</h2>
      <div className="space-y-3">
        {addresses.slice(0, limit).map((addr) => (
          <div
            key={addr.id}
            className="border border-gray-200 rounded-lg p-3 bg-white text-sm shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="text-[#004a8f] leading-tight space-y-1">
                <p className="text-gray-800 font-semibold">{addr.street}</p>
                <p className="text-gray-500 text-xs">
                  {addr.zipCode} {addr.city}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${getAddressTypeBadgeClass(
                  addr.type,
                )}`}
              >
                {formatAddressType(addr.type)}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-xs">
              {onEditAddress && (
                <button
                  type="button"
                  onClick={() => onEditAddress(addr)}
                  className="text-[#004a8f] font-medium hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edytuj ten adres</span>
                </button>
              )}
              <a
                href={getGoogleMapsDirectionsUrl(addr)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#004a8f] font-medium hover:underline flex items-center gap-1 ml-auto"
              >
                <Navigation className="w-3 h-3 text-[#004a8f]" />
                <span>Nawiguj</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {limit < addresses.length && (
        <button
          className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
          onClick={() => setLimit((prev) => prev + 3)}
        >
          Pokaż więcej
        </button>
      )}
    </section>
  );
};
