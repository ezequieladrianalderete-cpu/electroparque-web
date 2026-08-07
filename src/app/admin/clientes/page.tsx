'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { ArrowLeft, Users, Mail, MessageCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

const REVENUE_STATUSES = ['paid', 'preparing', 'dispatched', 'in_transit', 'delivered'];

interface Customer {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  totalSpent: number;
  ordersCount: number;
  lastOrder: any;
  orders: any[];
}

export default function ClientesPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);

  const load = async () => {
    const { data } = await supabase.from('orders').select('order_number,customer_name,customer_email,customer_phone,customer_dni,total,created_at')
      .in('status', REVENUE_STATUSES).order('created_at', { ascending: false });

    const groups: Record<string, Customer> = {};
    (data || []).forEach(o => {
      const key = (o.customer_phone || o.customer_email || o.customer_name || 'sin-datos').replace(/\D/g, '') || (o.customer_email || o.customer_name || 'sin-datos');
      if (!groups[key]) {
        groups[key] = { key, name: o.customer_name || 'Sin nombre', email: o.customer_email, phone: o.customer_phone, dni: o.customer_dni, totalSpent: 0, ordersCount: 0, lastOrder: o, orders: [] };
      }
      groups[key].totalSpent += Number(o.total);
      groups[key].ordersCount += 1;
      groups[key].orders.push(o);
      if (!groups[key].email && o.customer_email) groups[key].email = o.customer_email;
    });

    setCustomers(Object.values(groups).sort((a, b) => b.totalSpent - a.totalSpent));
    setLoaded(true);
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  const filtered = search.trim()
    ? customers.filter(c => [c.name, c.email, c.dni].some(v => v?.toLowerCase().includes(search.trim().toLowerCase())))
    : customers;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5" />Clientes ({customers.length})</h1>
          <p className="text-xs text-gray-500">Personas que ya te compraron al menos una vez</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, e-mail o DNI..." className="input-field text-sm max-w-sm mb-6" />

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{customers.length === 0 ? 'Todavía no tenés clientes con compras pagadas' : 'Sin resultados'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b bg-gray-50 text-[11px] font-bold text-gray-400 uppercase">
              <span>Cliente</span><span>Última compra</span><span>Total consumido</span><span>Contactar</span>
            </div>
            {filtered.map(c => {
              const isExpanded = expandedKey === c.key;
              return (
                <div key={c.key} className="border-b last:border-0">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedKey(isExpanded ? null : c.key)}>
                    <div className="min-w-0 flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.phone || c.email || '—'}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">#{c.lastOrder.order_number} · {new Date(c.lastOrder.created_at).toLocaleDateString('es-AR')}</span>
                    <span className="text-sm font-extrabold text-ep-navy whitespace-nowrap">{formatPrice(c.totalSpent)}</span>
                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                      {c.email && <a href={`mailto:${c.email}`} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50" title="Enviar email"><Mail className="w-3.5 h-3.5 text-gray-500" /></a>}
                      {c.phone && <a href={`https://wa.me/54${c.phone.replace(/\D/g, '')}`} target="_blank" className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5 text-gray-500" /></a>}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-gray-50 border-t px-4 py-3 space-y-3 animate-slideDown">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div><p className="text-gray-400">Email</p><p className="font-medium">{c.email || '—'}</p></div>
                        <div><p className="text-gray-400">DNI/CUIT</p><p className="font-medium">{c.dni || '—'}</p></div>
                        <div><p className="text-gray-400">Compras realizadas</p><p className="font-medium">{c.ordersCount}</p></div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase mb-1.5">Historial de compras</p>
                        {c.orders.map((o, i) => (
                          <div key={i} className="flex justify-between py-1 text-sm">
                            <span className="text-gray-600">#{o.order_number} · {new Date(o.created_at).toLocaleDateString('es-AR')}</span>
                            <span className="font-medium">{formatPrice(Number(o.total))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
