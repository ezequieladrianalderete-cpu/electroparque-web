'use client';
import Link from 'next/link';
import { MessageCircle, Mail, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function Footer() {
  const [settings, setSettings] = useState<Record<string,string>>({});

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.from('store_settings').select('key,value').then(({ data }) => {
      const s: Record<string,string> = {};
      data?.forEach(d => { if(d.value) s[d.key] = d.value; });
      setSettings(s);
    });
  }, []);

  const wa = settings.whatsapp_number || '541138848412';
  const name = settings.store_name || 'Electro Parque';
  const logo = settings.logo_url;

  return (
    <footer className="bg-ep-navy text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            {logo ? <img src={logo} alt={name} className="h-10 w-auto max-w-[180px] mb-3 brightness-0 invert"/> : (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-ep-red rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">EP</span></div>
                <div className="font-bold text-lg">{name}</div>
              </div>
            )}
            <p className="text-blue-200 text-sm leading-relaxed">{settings.store_tagline || 'Tecnología de punta al mejor precio.'}</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Tienda</h4>
            {[['Productos','/productos'],['Ofertas','/ofertas'],['Blog','/blog']].map(([l,h])=>(
              <Link key={h} href={h} className="block text-blue-200 text-sm mb-2 hover:text-white">{l}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-bold mb-3">Ayuda</h4>
            {[['Quiénes somos','/nosotros'],['Contacto','/contacto']].map(([l,h])=>(
              <Link key={l} href={h} className="block text-blue-200 text-sm mb-2 hover:text-white">{l}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-bold mb-3">Contacto</h4>
            <div className="space-y-2 text-blue-200 text-sm">
              <a href={`https://wa.me/${wa}`} className="flex items-center gap-2 hover:text-white"><MessageCircle className="w-4 h-4"/>+{wa.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/,'$1 $2 $3-$4')}</a>
              {settings.store_email && <div className="flex items-center gap-2"><Mail className="w-4 h-4"/>{settings.store_email}</div>}
              {settings.store_location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/>{settings.store_location}</div>}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 text-center text-blue-300 text-xs">{settings.footer_text || `© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.`}</div>
      </div>
    </footer>
  );
}
