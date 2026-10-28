import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { notifyNewSale } from '@/lib/notify';
import { syncOrderToStockApp } from '@/lib/stockAppSync';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MercadoPago envía notificación de tipo "payment"
    if (body.type === 'payment' || body.action === 'payment.updated' || body.action === 'payment.created') {
      const paymentId = body.data?.id;
      if (!paymentId) return NextResponse.json({ ok: true });

      // Consultar el pago en MercadoPago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
      });

      // Si esta consulta falla (pasa, sobre todo si MP avisa antes de que el pago esté
      // indexado del todo), antes seguíamos de largo en silencio y le decíamos "ok" a MP
      // — así el pedido se quedaba en "pendiente" para siempre porque MP nunca reintentaba.
      // Devolviendo un error acá, MP reintenta solo con backoff.
      if (!mpRes.ok) {
        console.error(`Webhook MP: no se pudo consultar el pago ${paymentId} (HTTP ${mpRes.status})`);
        return NextResponse.json({ error: 'No se pudo consultar el pago, reintentar' }, { status: 502 });
      }
      const payment = await mpRes.json();

      if (payment.external_reference) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let newStatus = 'pending';
        if (payment.status === 'approved') newStatus = 'paid';
        else if (payment.status === 'pending' || payment.status === 'in_process') newStatus = 'pending';
        else if (payment.status === 'rejected' || payment.status === 'cancelled') newStatus = 'cancelled';
        else if (payment.status === 'refunded') newStatus = 'cancelled';

        // Se pide el estado anterior para no mandar el aviso de nuevo si MP reintenta
        // el mismo webhook (algo que hace seguido).
        const { data: existingOrder } = await supabase.from('orders')
          .select('status,payment_id,order_number,customer_name,customer_phone,customer_email,total,items,shipping_address')
          .eq('id', payment.external_reference).single();

        // MP repite avisos del mismo pago y también avisa de intentos anteriores (ej. una tarjeta
        // rechazada antes del pago bueno). Solo se cambia el estado si corresponde:
        //  - pagado: si el pedido estaba pendiente (o cancelado y ahora se pagó)
        //  - pendiente: solo si seguía pendiente
        //  - cancelado: si seguía pendiente, o si es la devolución/anulación del MISMO pago que lo había pagado
        // Así un aviso repetido no devuelve a "Pagado" un pedido que ya está "Preparando" o "Enviado".
        const previo = existingOrder?.status || 'pending';
        const mismoPago = String(existingOrder?.payment_id || '') === String(paymentId);
        const cambia = newStatus === 'paid' ? (previo === 'pending' || previo === 'cancelled')
          : newStatus === 'cancelled' ? (previo === 'pending' || mismoPago)
          : previo === 'pending';

        const { error: updateError } = !cambia ? { error: null } : await supabase.from('orders').update({
          status: newStatus,
          payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        }).eq('id', payment.external_reference);

        if (updateError) {
          console.error(`Webhook MP: no se pudo actualizar el pedido ${payment.external_reference}: ${updateError.message}`);
          return NextResponse.json({ error: 'No se pudo actualizar el pedido, reintentar' }, { status: 502 });
        }

        if (newStatus === 'paid' && cambia && existingOrder && existingOrder.status !== 'paid') {
          await notifyNewSale(existingOrder as any);
        }
        if (newStatus === 'paid') {
          try { await syncOrderToStockApp(supabase, payment.external_reference); }
          catch (syncErr: any) { console.error(`Webhook MP: fallo la sync de stock del pedido ${payment.external_reference}: ${syncErr?.message || syncErr}`); }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook MP: error inesperado:', err?.message || err);
    // Un error inesperado de nuestro código no se arregla solo con un reintento de MP
    // (volvería a fallar igual) — devolvemos 200 para no generar una tormenta de reintentos.
    return NextResponse.json({ ok: true });
  }
}
