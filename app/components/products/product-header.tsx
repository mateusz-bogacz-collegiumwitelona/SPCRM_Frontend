import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ProductDetailResponse } from '~/interfaces/product';
import { Link } from 'react-router';

export const ProductHeader = ({ product }: { product: ProductDetailResponse }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
      {product.activePromotion && (
        <div className="absolute top-4 -right-8 bg-red-600 text-white text-xs font-bold px-10 py-1 rotate-45 shadow-md">
          PROMOCJA
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/products" className="text-gray-500 hover:text-blue-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {product.category}
            </span>
            {product.activePromotion && (
              <span className="bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                {product.activePromotion.name}
              </span>
            )}
          </div>
          <p className="text-gray-500 ml-8">
            Gatunek: <span className="font-medium text-gray-900">{product.steelGrade}</span> |
            Wymiary: <span className="font-medium text-gray-900">{product.dimensions}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
