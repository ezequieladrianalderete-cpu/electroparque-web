export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { TrackPurchase } from '@/components/store/TrackPurchase';

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

  const paymentStatus = params.collection_status || params.status || 'unknown';
  const paymentId = params.payment_id || params.collection_id || '';
  const orderId = params.external_reference || params.order || '';

  let order: any = null;

  const { data: waSetting } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
  const whatsappNumber = waSetting?.value || '541144128645';

  // Actualizar y obtener el pedido
  if (orderId) {
    let newStatus = 'pending';
    if (paymentStatus === 'approved') newStatus = 'paid';
    else if (paymentStatus === 'pending' || paymentStatus === 'in_process') newStatus = 'pending';
    else if (paymentStatus === 'rejected') newStatus = 'cancelled';

    if (paymentStatus !== 'unknown') {
      await supabase.from('orders').update({
        status: newStatus,
        payment_id: paymentId || null,
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);
    }

    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    order = data;
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
