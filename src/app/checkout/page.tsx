'use client';
import { useState } from 'react';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { items, total, clearCart } = useCart();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', dni:'', address:'', city:'', province:'', zip:'', notes:'' });
  const [error, setError] = useState('');

  const set = (k:string) => (e:any) => setForm(f => ({...f, [k]: e.target.value}));

  if (items.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">🛒</p>
      <p className="text-gray-600 font-medium text-lg mb-2">Tu carrito está vacío</p>
      <p className="text-gray-400 text-sm mb-6">Agregá productos para continuar</p>
      <Link href="/productos" className="inline-block bg-gradient-to-r from-ep-navy to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Ver productos</Link>
    </div>
  );

  const handleSubmit = async () => {
    if (!form.name || !form.phone) { setError('Nombre y teléfono son obligatorios'); return; }
    setSaving(true); setError('');

    const orderItems = items.map(i => ({
      product_id: i.product.id,
      name: i.product.name,
      slug: i.product.slug,
      price: i.product.price,
      variant: i.variant ? `${i.variant.name}: ${i.variant.value}` : null,
      quantity: i.quantity,
      subtotal: (i.product.price + (i.variant?.price_modifier || 0)) * i.quantity,
    }));

    const orderData = {
      customer_name: form.name,
      customer_email: form.email || null,
      customer_phone: form.phone,
      customer_dni: form.dni || null,
      shipping_address: { address: form.address, city: form.city, province: form.province, zip: form.zip },
      items: orderItems,
      subtotal: total(),
      shipping_cost: 0,
      discount_amount: 0,
      total: total(),
      status: 'pending',
      notes: form.notes || null,
    };

    const { data: order, error: dbErr } = await supabase.from('orders').insert(orderData).select().single();

    if (dbErr) { setError('Error guardando pedido: ' + dbErr.message); setSaving(false); return; }

    // Build detailed WhatsApp message
    const itemLines = items.map(i => {
      let line = `• ${i.product.name}`;
      if (i.variant) line += ` (${i.variant.name}: ${i.variant.value})`;
      line += ` x${i.quantity} — ${formatPrice((i.product.price + (i.variant?.price_modifier || 0)) * i.quantity)}`;
      return line;
    }).join('\n');

    const msg = `🛒 *NUEVO PEDIDO #${order.order_number || ''}*

👤 *Cliente:* ${form.name}
📞 *Tel:* ${form.phone}
${form.email ? `📧 *Email:* ${form.email}` : ''}
${form.dni ? `🆔 *DNI:* ${form.dni}` : ''}

📦 *Productos:*
${itemLines}

💰 *Total: ${formatPrice(total())}*
🚚 *Envío: GRATIS*

📍 *Enviar a:*
${form.address ? form.address : 'A coordinar'}
${form.city ? `${form.city}, ${form.province}` : ''}
${form.zip ? `CP: ${form.zip}` : ''}

${form.notes ? `📝 *Notas:* ${form.notes}` : ''}

_Pedido generado desde electroparque.vercel.app_`;

    clearCart();
    window.open(`https://wa.me/541144128645?text=${encodeURIComponent(msg)}`, '_blank');
    window.location.href = '/checkout/gracias';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/productos" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">Finalizar compra</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Datos personales */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">👤 Datos personales</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1"><label className="label">Nombre completo *</label><input value={form.name} onChange={set('name')} className="input-field" placeholder="Juan Pérez"/></div>
              <div className="col-span-2 sm:col-span-1"><label className="label">Teléfono *</label><input value={form.phone} onChange={set('phone')} className="input-field" placeholder="11 4412-8645" type="tel"/></div>
              <div className="col-span-2 sm:col-span-1"><label className="label">Email</label><input value={form.email} onChange={set('email')} className="input-field" placeholder="tu@email.com" type="email"/></div>
              <div className="col-span-2 sm:col-span-1"><label className="label">DNI / CUIT</label><input value={form.dni} onChange={set('dni')} className="input-field" placeholder="12345678"/></div>
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">📍 Dirección de envío</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Dirección</label><input value={form.address} onChange={set('address')} className="input-field" placeholder="Av. Rivadavia 1234, Piso 2 Dto A"/></div>
              <div><label className="label">Ciudad</label><input value={form.city} onChange={set('city')} className="input-field" placeholder="Morón"/></div>
              <div><label className="label">Provincia</label><input value={form.province} onChange={set('province')} className="input-field" placeholder="Buenos Aires"/></div>
              <div><label className="label">Código Postal</label><input value={form.zip} onChange={set('zip')} className="input-field" placeholder="1708"/></div>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold text-sm mb-4">📝 Notas adicionales</h2>
            <textarea value={form.notes} onChange={set('notes')} className="input-field resize-none" rows={3} placeholder="Horario preferido de entrega, referencias, etc."/>
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-2xl p-6 sticky top-20">
            <h2 className="font-bold mb-4">🛒 Resumen del pedido</h2>
            <div className="space-y-3 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b last:border-0">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product.images?.[0]?.url ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover"/> : <span className="text-xl">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    {item.variant && <p className="text-xs text-gray-400">{item.variant.name}: {item.variant.value}</p>}
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">x{item.quantity}</span>
                      <span className="text-sm font-bold text-ep-navy">{formatPrice((item.product.price + (item.variant?.price_modifier || 0)) * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(total())}</span></div>
              <div className="flex justify-between text-green-600"><span>🚚 Envío</span><span className="font-bold">GRATIS</span></div>
              <div className="flex justify-between font-extrabold text-xl pt-2 border-t">
                <span>Total</span><span className="bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">{formatPrice(total())}</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={saving}
              className="w-full bg-gradient-to-r from-ep-red to-red-600 hover:from-red-600 hover:to-ep-red text-white font-bold py-4 rounded-xl mt-5 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-lg">
              {saving ? 'Procesando...' : '💬 Confirmar pedido por WhatsApp'}
            </button>

            <div className="flex items-center gap-2 justify-center mt-3 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4"/><span>Tu pedido queda registrado y te contactamos al instante</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
