'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const SUPERMARKETS = ['Mercadona', 'Aldi', 'HiperDino', 'Carrefour'];

export function FilterMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentSupermarket = searchParams.get('supermarket') || '';
  const currentSortBy = searchParams.get('sortBy') || '';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
      setIsOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filtros y Orden
        {(currentSupermarket || currentSortBy) && (
          <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in duration-200">
            <div className="space-y-6">
              {/* Supermarkets */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Supermercado</h3>
                <div className="flex flex-wrap gap-2">
                      {SUPERMARKETS.map((shop) => (
                        <button
                          key={shop}
                          disabled={isPending}
                          onClick={() => updateFilters('supermarket', currentSupermarket === shop ? '' : shop)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${
                            currentSupermarket === shop
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {shop}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sorting */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ordenar por precio</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={isPending}
                        onClick={() => updateFilters('sortBy', currentSortBy === 'price_asc' ? '' : 'price_asc')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-center transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${
                          currentSortBy === 'price_asc'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Más barato primero
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => updateFilters('sortBy', currentSortBy === 'price_desc' ? '' : 'price_desc')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-center transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${
                          currentSortBy === 'price_desc'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Más caro primero
                      </button>
                    </div>
                  </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <button
                  onClick={resetFilters}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Restablecer todo
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
