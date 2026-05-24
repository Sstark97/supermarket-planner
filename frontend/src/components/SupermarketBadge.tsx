import React from 'react';

// En una app real vendrían del servidor, por ahora compartimos este mapping constante.
export const SUPERMERCADOS: Record<string, { nombre: string; color: string }> = {
  Mercadona: { nombre: 'Mercadona', color: 'bg-green-100 text-green-800 border-green-200' },
  HiperDino: { nombre: 'HiperDino', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Carrefour: { nombre: 'Carrefour', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  Lidl: { nombre: 'Lidl', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  Aldi: { nombre: 'Aldi', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' }
};

export function SupermarketBadge({ supermarket }: { supermarket: string }) {
  const data = SUPERMERCADOS[supermarket] || { nombre: supermarket, color: 'bg-slate-100 text-slate-800 border-slate-200' };
  
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${data.color}`}>
      {data.nombre}
    </span>
  );
}
