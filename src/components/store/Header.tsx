'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { CartDrawer } from './CartDrawer';
import { createBrowserClient } from '@supabase/ssr';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logo, setLogo] = useState('');
  const [storeName, setStoreName] = useState('Electro Parque');
  const { count, toggleCart } = useCart();

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.from('store_settings').select('key,value').in('key', ['logo_url', 'store_name']).then(({ data }) => {
      data?.forEach(s => {
        if (s.key === 'logo_url' && s.value) setLogo(s.value);
        if (s.key === 'store_name' && s.value) setStoreName(s.value);
      });
    });
  }, []);

  return (
    <>
      <div className="bg-ep-navy text-white text-xs text-center py-2 px-4 font-medium">
        🚚 Envío gratis en compras mayores a $50.000 · 📞 11 3884-8412
      </div>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            {logo ? (
              <img src={logo} alt={storeName} className="h-10 w-auto max-w-[180px] object-contain" />
            ) : (
              <>
                <div className="w-9 h-9 bg-ep-navy rounded-lg flex items-center justify-center">
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
              <Link key={h} href={h} className="text-sm font-medium text-gray-600 hover:text-ep-navy transition-colors">{l}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/buscar" className="p-2 hover:bg-gray-100 rounded-lg"><Search className="w-5 h-5 text-gray-600" /></Link>
            <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-lg relative">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {count() > 0 && <span className="absolute -top-1 -right-1 bg-ep-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count()}</span>}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
            {[['Productos','/productos'],['Ofertas','/ofertas'],['Blog','/blog'],['Nosotros','/nosotros'],['Contacto','/contacto']].map(([l,h])=>(
              <Link key={h} href={h} onClick={()=>setMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-700">{l}</Link>
            ))}
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
