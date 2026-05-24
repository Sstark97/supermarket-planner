import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Store, ArrowRight, Trash2 } from 'lucide-react';

// --- DATOS SIMULADOS (Mock Data) ---
// En una app real, estos datos vendrían de tu servidor/API.
const SUPERMERCADOS = {
  MERCADONA: { nombre: 'Mercadona', color: 'bg-green-100 text-green-800 border-green-200' },
  HIPERDINO: { nombre: 'Hiperdino', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CARREFOUR: { nombre: 'Carrefour', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  LIDL: { nombre: 'Lidl', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ALDI: { nombre: 'Aldi', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' }
};

const mockProducts = [
  { id: 1, nombre: 'Pan de molde blanco familiar', precio: 1.30, super: SUPERMERCADOS.MERCADONA, categoria: 'Panadería' },
  { id: 2, nombre: 'Pan rústico 100% natural', precio: 0.95, super: SUPERMERCADOS.HIPERDINO, categoria: 'Panadería' },
  { id: 3, nombre: 'Baguette clásica', precio: 0.45, super: SUPERMERCADOS.CARREFOUR, categoria: 'Panadería' },
  { id: 4, nombre: 'Pan de centeno rebanado', precio: 1.55, super: SUPERMERCADOS.LIDL, categoria: 'Panadería' },
  { id: 5, nombre: 'Panecillos integrales (6 ud)', precio: 1.15, super: SUPERMERCADOS.ALDI, categoria: 'Panadería' },
  { id: 6, nombre: 'Leche semidesnatada 1L', precio: 0.90, super: SUPERMERCADOS.MERCADONA, categoria: 'Lácteos' },
  { id: 7, nombre: 'Leche entera fresca 1L', precio: 1.10, super: SUPERMERCADOS.HIPERDINO, categoria: 'Lácteos' },
  { id: 8, nombre: 'Huevos frescos clase L (12 ud)', precio: 2.35, super: SUPERMERCADOS.CARREFOUR, categoria: 'Huevos' },
  { id: 9, nombre: 'Plátanos de Canarias (1kg)', precio: 1.85, super: SUPERMERCADOS.LIDL, categoria: 'Frutería' },
  { id: 10, nombre: 'Plátanos de Canarias IGP (1kg)', precio: 1.99, super: SUPERMERCADOS.HIPERDINO, categoria: 'Frutería' },
  { id: 11, nombre: 'Agua mineral natural 1.5L', precio: 0.35, super: SUPERMERCADOS.ALDI, categoria: 'Bebidas' },
  { id: 12, nombre: 'Aceite de oliva virgen extra 1L', precio: 8.95, super: SUPERMERCADOS.MERCADONA, categoria: 'Despensa' },
  { id: 13, nombre: 'Aceite de oliva suave 1L', precio: 7.50, super: SUPERMERCADOS.CARREFOUR, categoria: 'Despensa' },
  { id: 14, nombre: 'Pan de hamburguesa (4 ud)', precio: 1.10, super: SUPERMERCADOS.LIDL, categoria: 'Panadería' },
  { id: 15, nombre: 'Pechuga de pollo (1kg)', precio: 6.50, super: SUPERMERCADOS.HIPERDINO, categoria: 'Carnicería' },
  { id: 16, nombre: 'Papel higiénico doble capa (12 rls)', precio: 3.50, super: SUPERMERCADOS.MERCADONA, categoria: 'Higiene' },
  { id: 17, nombre: 'Gel de ducha protector 1L', precio: 1.20, super: SUPERMERCADOS.CARREFOUR, categoria: 'Higiene' },
  { id: 18, nombre: 'Champú cabello normal 500ml', precio: 1.95, super: SUPERMERCADOS.LIDL, categoria: 'Higiene' },
  { id: 19, nombre: 'Detergente líquido (40 lavados)', precio: 5.99, super: SUPERMERCADOS.ALDI, categoria: 'Limpieza' },
  { id: 20, nombre: 'Lejía normal 2L', precio: 0.85, super: SUPERMERCADOS.HIPERDINO, categoria: 'Limpieza' },
  { id: 21, nombre: 'Friegasuelos pino 1.5L', precio: 0.95, super: SUPERMERCADOS.MERCADONA, categoria: 'Limpieza' },
];

const CATEGORIAS = [...new Set(mockProducts.map(p => p.categoria))];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return mockProducts.filter(product => {
      const matchesSearch = !searchTerm.trim() || 
        product.nombre.toLowerCase().includes(lowercasedTerm) ||
        product.super.nombre.toLowerCase().includes(lowercasedTerm);
      
      const matchesCategory = !selectedCategory || product.categoria === selectedCategory;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.precio - b.precio);
  }, [searchTerm, selectedCategory]);

  // Funciones del carrito
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.product.precio * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* HEADER FIJO */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <Store size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">SuperSearch</h1>
          </div>

          <div className="flex-1 max-w-md mx-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Busca un producto (ej. pan, leche...)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ShoppingCart size={24} className="text-slate-700" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* FILTROS DE CATEGORÍA */}
        <div className="max-w-3xl mx-auto px-4 pb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Todos
            </button>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-500 mb-4">
            Resultados {selectedCategory ? `en ${selectedCategory}` : 'en Todas las categorías'} {searchTerm ? `para "${searchTerm}"` : ''} ({filteredProducts.length})
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">No hemos encontrado productos que coincidan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${product.super.color}`}>
                        {product.super.nombre}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {product.categoria}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-800 text-sm leading-tight mb-3">
                      {product.nombre}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50">
                    <span className="text-lg font-bold text-slate-900">
                      {product.precio.toFixed(2)}€
                    </span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 active:scale-95"
                    >
                      <Plus size={16} />
                      <span className="text-xs font-medium px-1">Añadir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* OVERLAY DEL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Fondo oscuro */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Panel lateral del carrito */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart size={20} />
                Tu Compra
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li key={item.product.id} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-800 truncate">{item.product.nombre}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${item.product.super.color}`}>
                            {item.product.super.nombre}
                          </span>
                          <span className="text-sm font-semibold text-slate-600">
                            {item.product.precio.toFixed(2)}€
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-lg transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-lg transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Resumen del Total */}
            {cart.length > 0 && (
              <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total de la lista</span>
                  <span className="text-2xl font-bold text-slate-900">{cartTotal.toFixed(2)}€</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}