import React, { useState } from 'react';

interface Address {
  id: string;
  street: string;
  zipCode: string;
  city: string;
  type: string;
}

export const CompanyAddressesMobile: React.FC<{ addresses: Address[] }> = ({ addresses }) => {
  const [limit, setLimit] = useState(3);

  return (
    <section className="block xl:hidden">
      <h2 className="text-xl text-[#004a8f] font-normal mb-3">Adresy:</h2>
      <div className="space-y-3">
        {addresses.slice(0, limit).map((addr) => (
          <div key={addr.id} className="border border-black rounded-lg p-3 bg-white text-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="text-[#004a8f] leading-tight space-y-1">
                <p>Ulica: {addr.street}</p>
                <p>Kod pocztowy: {addr.zipCode}</p>
                <p>Miasto: {addr.city}</p>
              </div>
              <span className="bg-[#d4edda] text-[#28a745] text-xs px-2 py-0.5 rounded-full">
                {addr.type}
              </span>
            </div>
            <div className="border-t border-black pt-2 flex">
              <a href="#" className="text-[#004a8f] text-sm ml-auto">
                Otwórz nawigację
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
