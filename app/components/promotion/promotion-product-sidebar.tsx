import React from 'react';
import { Link } from 'react-router';
import { Package, Tag, User } from 'lucide-react';
import type { PromotionDetailResponse } from '~/interfaces/promotion';

export const PromotionProductSidebar: React.FC<{ readonly promotion: PromotionDetailResponse }> = ({
  promotion,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-900" /> Objęty produkt
        </h2>
        <Link
          to={`/products/${promotion.productId}`}
          className="text-xs text-blue-900 hover:underline font-medium"
        >
          Karta produktu &rarr;
        </Link>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Nazwa produktu</p>
          <p className="font-semibold text-gray-900">{promotion.productName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Kategoria</p>
            <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
              {promotion.category}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Gatunek stali</p>
            <p className="font-semibold text-gray-900">{promotion.steelGrade}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-0.5">Wymiary</p>
          <p className="font-medium text-gray-700">{promotion.dimensions || 'Brak danych'}</p>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-0.5">Dostępność na magazynie</p>
          <p className="text-base font-bold text-green-700">
            {promotion.productStockQuantity} {promotion.unitSymbol}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <User className="w-4 h-4" /> Przypisanie klienta
        </h3>

        {promotion.contactId ? (
          <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
            <p className="text-sm font-semibold text-blue-900">
              {promotion.contactFirstName} {promotion.contactLastName}
            </p>
            {promotion.contactCompanyName && (
              <p className="text-xs text-gray-600 mt-0.5">{promotion.contactCompanyName}</p>
            )}
            <Link
              to={`/contact/${promotion.contactId}`}
              className="inline-block mt-2 text-xs text-blue-800 underline font-medium"
            >
              Zobacz profil klienta
            </Link>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-md border border-gray-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">
              Promocja ogólna (dla wszystkich klientów)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
