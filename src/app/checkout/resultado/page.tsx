export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

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

  // MercadoPago manda collection_status o status
  const paymentStatus = params.collection_status || params.status || 'unknown';
  const paymentId = params.payment_id || params.collection_id || '';
  const orderId = params.external_reference || params.order || '';

  // Actualizar el pedido en Supabase
  if (orderId && paymentStatus !== 'unknown') {
    const supabase = await createClient();
    let newStatus = 'pending';
    if (paymentStatus === 'approved') newStatus = 'paid';
    else if (paymentStatus === 'pending' || paymentStatus === 'in_process') newStatus = 'pending';
    else if (paymentStatus === 'rejected') newStatus = 'cancelled';

    await supabase.from('orders').update({
      status: newStatus,
      payment_id: paymentId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
  }

  const config: Record<string, { icon: string; title: string; desc: string; color: string }> = {
    approved: { icon: '✅', title: '¡Pago aprobado!', desc: 'Tu pago fue procesado correctamente. Te contactaremos para coordinar el envío.', color: 'text-green-600' },
    pending: { icon: '⏱', title: 'Pago pendiente', desc: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.', color: 'text-yellow-600' },
    in_process: { icon: '⏱', title: 'Pago en proceso', desc: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.', color: 'text-yellow-600' },
    rejected: { icon: '❌', title: 'Pago rechazado', desc: 'Hubo un problema con tu pago. Podés intentar de nuevo o contactarnos por WhatsApp.', color: 'text-red-600' },
    unknown: { icon: '❓', title: 'Estado desconocido', desc: 'No pudimos verificar el estado de tu pago. Contactanos por WhatsApp.', color: 'text-gray-600' },
  };

  const c = config[paymentStatus] || config.unknown;

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">{c.icon}</div>
      <h1 className={`text-3xl font-extrabold mb-4 ${c.color}`}>{c.title}</h1>
      <p className="text-gray-600 mb-4">{c.desc}</p>
      {paymentId && <p className="text-sm text-gray-400 mb-2">ID de pago: <span className="font-mono font-bold">{paymentId}</span></p>}
      {orderId && <p className="text-sm text-gray-400 mb-6">Pedido: <span className="font-mono font-bold">{orderId.substring(0,8)}...</span></p>}
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/productos" className="bg-gradient-to-r from-ep-navy to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">Seguir comprando</Link>
        <a href="https://wa.me/541144128645" target="_blank" className="border-2 border-green-500 text-green-600 font-bold px-6 py-3 rounded-xl hover:bg-green-50">💬 WhatsApp</a>
      </div>
    </div>
  );
}
