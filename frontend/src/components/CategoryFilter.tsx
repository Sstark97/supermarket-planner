'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCategory } from '../types';

const CATEGORIES = Object.values(ProductCategory);

// Translates enum values to display strings, or adds custom ones prioritizing UX
const categoryLabels: Record<string, string> = {
  dairy: 'Lácteos', meat: 'Carnes', fish: 'Pescados', fruits_veg: 'Frutas y Verduras',
  bakery: 'Panadería', drinks: 'Bebidas', frozen: 'Congelados',
  cleaning: 'Limpieza', personal_care: 'Higiene', snacks: 'Snacks y Dulces',
  canned_goods: 'Conservas', condiments: 'Salsas y Especias',
  cereals_pasta: 'Cereales', baby: 'Bebé', pet: 'Mascotas', other: 'Otros'
};

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get('category') || null;
  const currentQuery = searchParams.get('q') || '';

  const handleCategoryClick = (category: string | null) => {
    const params = new URLSearchParams();
    if (currentQuery) params.set('q', currentQuery);
    if (category) params.set('category', category);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex gap-2">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!currentCategory ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Todos
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${currentCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>
    </div>
  );
}
