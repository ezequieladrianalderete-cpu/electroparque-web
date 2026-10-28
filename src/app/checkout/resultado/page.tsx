export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { TrackPurchase } from '@/components/store/TrackPurchase';
import { notifyNewSale } from '@/lib/notify';
import { syncOrderToStockApp } from '@/lib/stockAppSync';

// Esta página actualiza y lee un pedido a partir de un ID en la URL (venís acá redirigido
// desde MercadoPago/GoCuotas), algo que ya no puede hacerse con la clave pública (ver
// migración restrict_anon_orders_access) — corre en el servidor, así que usar la service
// role acá es seguro y no queda expuesta al navegador.
function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

interface Props { searchParams: Promise<{
  status?: string;
  collection_status?: string;
  payment_id?: string;
  collection_id?: string;
  external_reference?: string;
  order?: string;
}> }

export default async function ResultadoPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = adminClient();

  // MercadoPago usa "approved"/"rejected"; GoCuotas redirige acá con "success"/"failure" —
  // se normaliza al vocabulario de MP para que el resto de la página (cálculo de estado,
  // texto mostrado, mensaje de WhatsApp) funcione igual sin importar de dónde vino. Antes
  // "success" no coincidía con nada y el pedido de GoCuotas quedaba mal marcado "pending"
  // (podía incluso pisar un "paid" correcto que ya hubiera puesto el webhook).
  const rawStatus = params.collection_status || params.status || 'unknown';
  let paymentStatus = rawStatus === 'success' ? 'approved' : rawStatus === 'failure' ? 'rejected' : rawStatus;
  const paymentId = params.payment_id || params.collection_id || '';
  const orderId = params.external_reference || params.order || '';

  // Lo que viene en la dirección de esta página lo puede escribir cualquiera, así que NO alcanza para
  // dar un pedido por pagado. Con Mercado Pago se le pregunta a MP el estado real del pago (y que sea
  // de este pedido). GoCuotas no manda un ID de pago acá: ese pedido lo confirma su aviso (webhook).
  let pagoConfirmado = false;
  if (paymentId && orderId && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    try {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }, cache: 'no-store',
      });
      if (r.ok) {
        const pago = await r.json();
        if (String(pago.external_reference || '') === orderId) {
          paymentStatus = pago.status || paymentStatus;
          pagoConfirmado = pago.status === 'approved';
        }
      }
    } catch { /* si MP no responde, el pedido lo confirma el webhook */ }
  }

  let order: any = null;

  const { data: waSetting } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
  const whatsappNumber = waSetting?.value || '541144128645';

  // Actualizar y obtener el pedido
  if (orderId) {
    let newStatus = 'pending';
    if (paymentStatus === 'approved') newStatus = pagoConfirmado ? 'paid' : 'pending';
    else if (paymentStatus === 'pending' || paymentStatus === 'in_process') newStatus = 'pending';
    else if (paymentStatus === 'rejected') newStatus = 'cancelled';

    // Se guarda el estado previo para saber si esto es una confirmación nueva de verdad
    // (y avisar por mail) o si el webhook ya la había procesado antes que esta redirección
    // llegara — esta página suele llegar primero, así que sin este chequeo el aviso de
    // venta nunca salía desde ningún lado (ni acá, que no lo tenía enganchado, ni el
    // webhook, que se encontraba el pedido ya "paid" y lo daba por avisado).
    const { data: before } = await supabase.from('orders').select('status').eq('id', orderId).single();

    // Solo se toca un pedido que todavía no avanzó: si el cliente vuelve a abrir esta página más tarde,
    // no tiene que pisar un "Preparando"/"Enviado" ni volver atrás un pago ya confirmado.
    const previo = before?.status || 'pending';
    const cambia = newStatus === 'paid' ? (previo === 'pending' || previo === 'cancelled') : previo === 'pending';
    if (paymentStatus !== 'unknown' && cambia) {
      await supabase.from('orders').update({
        status: newStatus,
        ...(paymentId ? { payment_id: paymentId } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);
    }

    // Pago confirmado con Mercado Pago: el pedido pasa a la Lista de retiro y se descuenta el stock en el
    // momento, aunque el aviso de MP (webhook) se demore o falle. No se hace dos veces: syncOrderToStockApp
    // solo actúa la primera vez (marca stock_synced_at).
    if (pagoConfirmado) {
      try { await syncOrderToStockApp(supabase, orderId); }
      catch (e: any) { console.error(`Resultado: fallo la sync de stock del pedido ${orderId}: ${e?.message || e}`); }
    }

    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    order = data;

    if (newStatus === 'paid' && cambia && previo !== 'paid' && order) {
      await notifyNewSale(order);
    }
  }

  const config: Record<string, { icon: string; title: string; desc: string; color: string }> = {
    approved: { icon: '✅', title: '¡Pago aprobado!', desc: 'Tu pago fue procesado correctamente. Te contactaremos para coordinar el envío.', color: 'text-green-600' },
    pending: { icon: '⏱', title: 'Pago pendiente', desc: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.', color: 'text-yellow-600' },
    in_process: { icon: '⏱', title: 'Pago en proceso', desc: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.', color: 'text-yellow-600' },
    rejected: { icon: '❌', title: 'Pago rechazado', desc: 'Hubo un problema con tu pago. Podés intentar de nuevo o contactarnos por WhatsApp.', color: 'text-red-600' },
    unknown: { icon: '❓', title: 'Estado desconocido', desc: 'No pudimos verificar el estado. Contactanos por WhatsApp.', color: 'text-gray-600' },
  };

  const c = config[paymentStatus] || config.unknown;

  // Armar mensaje de WhatsApp con detalle de la compra
  const items = order?.items || [];
  const itemLines = items.map((i: any) => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity}`).join('\n');

  const waMsg = paymentStatus === 'approved'
    ? `Hola! Acabo de realizar una compra en Electro Parque.\n\n🛒 *Pedido #${order?.order_number || ''}*\n📦 *Productos:*\n${itemLines}\n💰 *Total:* $${Number(order?.total || 0).toLocaleString('es-AR')}\n💳 *Estado:* Pagado ✅\n🆔 *ID pago:* ${paymentId}\n\n👤 *${order?.customer_name || ''}*\n📞 ${order?.customer_phone || ''}\n\n¿Cuándo estaría llegando mi pedido?`
    : `Hola! Intenté hacer una compra en Electro Parque pero el pago quedó en estado: ${paymentStatus}.\n\nPedido: ${order?.order_number || orderId}\n\n¿Me pueden ayudar?`;

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {order && paymentStatus === 'approved' && <TrackPurchase order={order} />}
      <div className="text-6xl mb-6">{c.icon}</div>
      <h1 className={`text-3xl font-extrabold mb-4 ${c.color}`}>{c.title}</h1>
      <p className="text-gray-600 mb-4">{c.desc}</p>

      {order && paymentStatus === 'approved' && (
        <div className="bg-gray-50 border rounded-xl p-4 text-left mb-6 text-sm">
          <p className="font-bold text-ep-navy mb-2">📋 Resumen de tu compra:</p>
          {items.map((i: any, idx: number) => (
            <div key={idx} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-gray-600">{i.name} {i.variant ? `(${i.variant})` : ''} x{i.quantity}</span>
              <span className="font-medium">${Number(i.subtotal || i.price * i.quantity).toLocaleString('es-AR')}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold text-ep-navy">
            <span>Total pagado</span>
            <span>${Number(order.total).toLocaleString('es-AR')}</span>
          </div>
        </div>
      )}

      {paymentId && <p className="text-sm text-gray-400 mb-2">ID de pago: <span className="font-mono font-bold">{paymentId}</span></p>}
      {order?.order_number && <p className="text-sm text-gray-400 mb-6">Pedido #<span className="font-bold">{order.order_number}</span></p>}

      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/productos" className="bg-gradient-to-r from-ep-navy to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">Seguir comprando</Link>
        <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMsg)}`} target="_blank"
          className="border-2 border-green-500 text-green-600 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors">
          💬 Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}
