'use client';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { CartDrawer } from './CartDrawer';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, toggleCart } = useCart();
  const settings = useStoreSettings();
  const logo = settings.logo_url;
  const storeName = settings.store_name;
  const waFormatted = settings.whatsapp_number.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3-$4');

  return (
    <>
      <div className="bg-gradient-to-r from-ep-navy via-ep-navy-light to-ep-navy text-white text-xs text-center py-2 px-4 font-medium">
        🚚 ¡Envío GRATIS en todas las compras! · 📞 {waFormatted}
      </div>
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 sm:h-20 md:h-24 lg:h-28">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0">
            {logo ? (
              <img src={logo} alt={storeName} className="h-10 sm:h-14 md:h-20 lg:h-24 w-auto max-w-[140px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[380px] object-contain flex-shrink-0" />
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-ep-navy to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">EP</span>
                </div>
                <div>
                  <div className="font-bold text-ep-navy text-base leading-tight">{storeName}</div>
                  <div className="text-[10px] text-gray-400">Importación y distribución</div>
                </div>
              </>
            )}
          </Link>
          <nav className="hidden md:flex gap-6">
            {[['Productos','/productos'],['Ofertas','/ofertas'],['Blog','/blog'],['Nosotros','/nosotros'],['Contacto','/contacto']].map(([l,h])=>(
              <Link key={h} href={h} className="text-sm font-medium text-gray-600 hover:text-ep-navy transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-ep-red after:transition-all">{l}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/buscar" className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"><Search className="w-5 h-5 text-gray-600" /></Link>
            <button onClick={toggleCart} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {count() > 0 && <span className="absolute -top-0.5 -right-0.5 bg-ep-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">{count()}</span>}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2.5 hover:bg-gray-100 rounded-xl">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1 animate-slideDown">
            {[['Productos','/productos'],['Ofertas','/ofertas'],['Blog','/blog'],['Nosotros','/nosotros'],['Contacto','/contacto']].map(([l,h])=>(
              <Link key={h} href={h} onClick={()=>setMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">{l}</Link>
            ))}
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
