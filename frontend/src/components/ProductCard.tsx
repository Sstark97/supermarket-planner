import React from 'react';
import { IProduct } from '../types';
import { SupermarketBadge } from './SupermarketBadge';
import { AddToCartButton } from './AddToCartButton';

// Utility to translate ProductCategory enum values to Spanish labels
const categoryLabels: Record<string, string> = {
  dairy: 'Lácteos', meat: 'Carnes', fish: 'Pescados', fruits_veg: 'Frutas y Verduras',
  bakery: 'Panadería', drinks: 'Bebidas', frozen: 'Congelados',
  cleaning: 'Limpieza', personal_care: 'Higiene', snacks: 'Snacks y Dulces',
  canned_goods: 'Conservas', condiments: 'Salsas y Especias',
  cereals_pasta: 'Cereales', baby: 'Bebé', pet: 'Mascotas', other: 'Otros'
};

export function ProductCard({ product }: { product: IProduct }) {
  const categoryLabel = categoryLabels[product.category] || product.category;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-2">
          <SupermarketBadge supermarket={product.supermarket} />
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md line-clamp-1 max-w-[120px]">
            {categoryLabel}
          </span>
        </div>
        <h3 className="font-medium text-slate-800 text-sm leading-tight mb-3 line-clamp-2">
          {product.name}
        </h3>
        
        {product.image && (
          <div className="w-full h-32 mb-3 rounded-lg bg-slate-50 flex items-center justify-center p-2 isolate overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-110"
              loading="lazy"
            />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900">
                {product.price.toFixed(2)}€
              </span>
              <span className="text-[10px] text-slate-400">
                {product.pricePerUnit.toFixed(2)}€ / {product.unit} · {product.taxType}
              </span>
            </div>
            <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
