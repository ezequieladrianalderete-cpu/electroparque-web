'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { ArrowLeft, ChevronDown, Package, Eye } from 'lucide-react';
import Link from 'next/link';

const STATUSES = [
  { value: 'pending', label: '⏱ Pendiente', color: 'bg-yellow-100 text-yellow-800', desc: 'Pedido recibido, esperando pago' },
  { value: 'paid', label: '💳 Pagado', color: 'bg-blue-100 text-blue-800', desc: 'Pago confirmado' },
  { value: 'preparing', label: '📋 Preparando', color: 'bg-indigo-100 text-indigo-800', desc: 'Armando el pedido' },
  { value: 'dispatched', label: '📦 Despachado', color: 'bg-purple-100 text-purple-800', desc: 'Entregado al correo' },
  { value: 'in_transit', label: '🚚 En camino', color: 'bg-cyan-100 text-cyan-800', desc: 'En tránsito al destino' },
  { value: 'delivered', label: '✅ Entregado', color: 'bg-green-100 text-green-800', desc: 'Recibido por el cliente' },
  { value: 'cancelled', label: '❌ Cancelado', color: 'bg-red-100 text-red-800', desc: 'Pedido cancelado' },
];

export default function PedidosPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [orders, setOrders] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []); setLoaded(true);
  };

  const changeStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    await load();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const getStatus = (s: string) => STATUSES.find(st => st.value === s) || STATUSES[0];

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Pedidos ({orders.length})</h1>
          <p className="text-xs text-gray-500">{orders.filter(o => o.status === 'pending').length} pendientes · {orders.filter(o => o.status === 'paid').length} pagados</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'all' ? 'bg-ep-navy text-white' : 'bg-white border text-gray-600'}`}>Todos ({orders.length})</button>
          {STATUSES.filter(s => s.value !== 'cancelled').map(s => {
            const count = orders.filter(o => o.status === s.value).length;
            return <button key={s.value} onClick={() => setFilter(s.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === s.value ? 'bg-ep-navy text-white' : 'bg-white border text-gray-600'}`}>{s.label} ({count})</button>;
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
            <p className="font-medium">No hay pedidos {filter !== 'all' ? 'con este estado' : 'todavía'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => {
              const status = getStatus(o.status);
              const isExpanded = expandedId === o.id;
              const items = o.items || [];
              return (
                <div key={o.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-ep-navy">#{o.order_number}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-sm font-medium">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.customer_phone} · {new Date(o.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-ep-navy">${Number(o.total).toLocaleString('es-AR')}</p>
                      <p className="text-xs text-gray-400">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 bg-gray-50 space-y-4 animate-slideDown">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Productos</p>
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between py-1.5 text-sm">
                            <span className="text-gray-700">{item.name} {item.variant ? `(${item.variant})` : ''} <span className="text-gray-400">x{item.quantity}</span></span>
                            <span className="font-medium">${Number(item.subtotal).toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Customer details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-gray-400">Email</p><p className="font-medium">{o.customer_email || '—'}</p></div>
                        <div><p className="text-xs text-gray-400">DNI/CUIT</p><p className="font-medium">{o.customer_dni || '—'}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-400">Dirección</p><p className="font-medium">{o.shipping_address?.address || '—'}, {o.shipping_address?.city || ''} {o.shipping_address?.province || ''} {o.shipping_address?.zip || ''}</p></div>
                        {o.notes && <div className="col-span-2"><p className="text-xs text-gray-400">Notas</p><p className="font-medium">{o.notes}</p></div>}
                      </div>

                      {/* Status changer */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cambiar estado</p>
                        <div className="flex gap-2 flex-wrap">
                          {STATUSES.map(s => (
                            <button key={s.value} onClick={() => changeStatus(o.id, s.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${o.status === s.value ? s.color + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}
                              title={s.desc}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick WhatsApp */}
                      <a href={`https://wa.me/54${o.customer_phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${o.customer_name}! Te escribimos de Electro Parque por tu pedido #${o.order_number}. `)}`}
                        target="_blank" className="inline-flex items-center gap-2 bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                        💬 Contactar cliente
                      </a>
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
