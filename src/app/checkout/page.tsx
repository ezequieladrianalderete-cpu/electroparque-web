'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, CreditCard, MessageCircle, Percent } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { trackBeginCheckout } from '@/lib/analytics';
import { logEvent } from '@/lib/track';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const settings = useStoreSettings();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', dni:'', address:'', city:'', province:'', zip:'', notes:'' });
  const [error, setError] = useState('');
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);

  const set = (k:string) => (e:any) => setForm(f => ({...f, [k]: e.target.value}));

  useEffect(() => { if (items.length > 0) { trackBeginCheckout(items, total()); logEvent('begin_checkout'); } }, []);

  // Guarda el pedido como borrador a medida que la persona completa sus datos, aunque
  // nunca llegue a tocar un botón de pago — así queda como "carrito abandonado" con sus
  // datos de contacto en vez de perderse sin dejar rastro.
  useEffect(() => {
    if (!form.name || !form.phone || items.length === 0) return;
    const timer = setTimeout(() => { saveOrder().catch(() => {}); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, items.length]);

  if (items.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">🛒</p>
      <p className="text-gray-600 font-medium text-lg mb-2">Tu carrito está vacío</p>
      <Link href="/productos" className="inline-block bg-gradient-to-r from-ep-navy to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform mt-4">Ver productos</Link>
    </div>
  );

  const buildOrder = () => {
    return {
      customer_name: form.name,
      customer_email: form.email || null,
      customer_phone: form.phone,
      customer_dni: form.dni || null,
      shipping_address: { address: form.address, city: form.city, province: form.province, zip: form.zip },
      items: items.map(i => ({
        product_id: i.product.id, name: i.product.name, slug: i.product.slug,
        price: i.product.price, variant: i.variant ? `${i.variant.name}: ${i.variant.value}` : null,
        variant_id: i.variant?.id || null,
        quantity: i.quantity, subtotal: (i.product.price + (i.variant?.price_modifier || 0)) * i.quantity,
      })),
      subtotal: total(), shipping_cost: 0, discount_amount: 0, total: total(),
      status: 'pending', notes: form.notes || null,
    };
  };

  const saveOrder = async (completed = false) => {
    const payload = { ...buildOrder(), checkout_completed: completed };
    // Crear y actualizar el pedido va siempre por esta ruta de servidor — el navegador
    // anónimo no tiene permiso directo de leer de vuelta la fila que acaba de crear
    // (insert().select()) ni de editarla, así que un insert/update directo desde acá falla.
    const res = await fetch('/api/checkout/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: draftOrderId, order: payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar el pedido');
    if (!draftOrderId) setDraftOrderId(data.id);
    return data;
  };

  // PAGAR CON MERCADOPAGO
  const handleMercadoPago = async () => {
    if (!form.name || !form.phone) { setError('Nombre y teléfono son obligatorios'); return; }
    setSaving(true); setError('');
    try {
      const order = await saveOrder(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.items,
          orderId: order.id,
          customerEmail: form.email,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        clearCart();
        window.location.href = data.init_point;
      } else {
        setError('Error al crear el pago: ' + (data.error || 'intente de nuevo'));
      }
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  // PAGAR EN CUOTAS CON GOCUOTAS
  const handleGoCuotas = async () => {
    if (!form.name || !form.phone) { setError('Nombre y teléfono son obligatorios'); return; }
    setSaving(true); setError('');
    try {
      const order = await saveOrder(true);
      const res = await fetch('/api/checkout/gocuotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: order.items,
          orderId: order.id,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      });
      const data = await res.json();
      if (data.url_init) {
        clearCart();
        window.location.href = data.url_init;
      } else {
        setError('Error al crear el pago en cuotas: ' + (data.error || 'intente de nuevo'));
      }
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  // PAGAR POR WHATSAPP
  const handleWhatsApp = async () => {
    if (!form.name || !form.phone) { setError('Nombre y teléfono son obligatorios'); return; }
    setSaving(true); setError('');
    try {
      const order = await saveOrder(true);
      const itemLines = items.map(i => {
        let line = `• ${i.product.name}`;
        if (i.variant) line += ` (${i.variant.name}: ${i.variant.value})`;
        line += ` x${i.quantity} — ${formatPrice((i.product.price + (i.variant?.price_modifier || 0)) * i.quantity)}`;
        return line;
      }).join('\n');

      const msg = `🛒 *NUEVO PEDIDO #${order.order_number || ''}*\n\n👤 *Cliente:* ${form.name}\n📞 *Tel:* ${form.phone}\n${form.email ? `📧 *Email:* ${form.email}\n` : ''}${form.dni ? `🆔 *DNI:* ${form.dni}\n` : ''}\n📦 *Productos:*\n${itemLines}\n\n💰 *Total: ${formatPrice(total())}*\n🚚 *Envío: GRATIS*\n\n📍 *Enviar a:*\n${form.address || 'A coordinar'}\n${form.city ? `${form.city}, ${form.province}` : ''}\n${form.zip ? `CP: ${form.zip}` : ''}\n${form.notes ? `\n📝 *Notas:* ${form.notes}` : ''}`;

      clearCart();
      window.open(`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank');
      window.location.href = '/checkout/gracias';
    } catch (e: any) { setError(e.message); }
    setSaving(false);
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
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold text-sm mb-4">👤 Datos personales</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1"><label className="label">Nombre completo *</label><input value={form.name} onChange={set('name')} className="input-field" placeholder="Juan Pérez"/></div>
              <div className="col-span-2 sm:col-span-1"><label className="label">Teléfono *</label><input value={form.phone} onChange={set('phone')} className="input-field" placeholder="11 4412-8645" type="tel"/></div>
              <div className="col-span-2 sm:col-span-1"><label className="label">Email</label><input value={form.email} onChange={set('email')} className="input-field" placeholder="tu@email.com" type="email"/></div>
              <div className="col-span-2 sm:col-span-1"><label className="label">DNI / CUIT</label><input value={form.dni} onChange={set('dni')} className="input-field" placeholder="12345678"/></div>
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold text-sm mb-4">📍 Dirección de envío</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Dirección</label><input value={form.address} onChange={set('address')} className="input-field" placeholder="Av. Rivadavia 1234"/></div>
              <div><label className="label">Ciudad</label><input value={form.city} onChange={set('city')} className="input-field" placeholder="Morón"/></div>
              <div><label className="label">Provincia</label><input value={form.province} onChange={set('province')} className="input-field" placeholder="Buenos Aires"/></div>
              <div><label className="label">Código Postal</label><input value={form.zip} onChange={set('zip')} className="input-field" placeholder="1708"/></div>
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="font-bold text-sm mb-4">📝 Notas</h2>
            <textarea value={form.notes} onChange={set('notes')} className="input-field resize-none" rows={3} placeholder="Horario de entrega, referencias, etc."/>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border rounded-2xl p-6 sticky top-20">
            <h2 className="font-bold mb-4">🛒 Resumen</h2>
            <div className="space-y-3 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b last:border-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product.images?.[0]?.url ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover"/> : <span>📦</span>}
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

            {/* MERCADOPAGO */}
            <button onClick={handleMercadoPago} disabled={saving}
              className="w-full bg-[#009ee3] hover:bg-[#0082c3] text-white font-bold py-4 rounded-xl mt-5 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-base">
              <CreditCard className="w-5 h-5"/> Pagar con MercadoPago
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t"></div><span className="text-xs text-gray-400">o</span><div className="flex-1 border-t"></div>
            </div>

            {/* GOCUOTAS */}
            <button onClick={handleGoCuotas} disabled={saving}
              className="w-full bg-[#e6007e] hover:bg-[#c40069] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
              <Percent className="w-5 h-5"/> Pagar en cuotas con GoCuotas
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t"></div><span className="text-xs text-gray-400">o</span><div className="flex-1 border-t"></div>
            </div>

            {/* WHATSAPP */}
            <button onClick={handleWhatsApp} disabled={saving}
              className="w-full bg-[#25D366] hover:bg-[#20BB5A] text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5"/> Coordinar por WhatsApp
            </button>

            <div className="flex items-center gap-2 justify-center mt-3 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4"/><span>Pago seguro · Tu pedido queda registrado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
