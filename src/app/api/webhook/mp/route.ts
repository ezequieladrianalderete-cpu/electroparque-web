import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { notifyNewSale } from '@/lib/notify';

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
          .select('status,order_number,customer_name,customer_phone,customer_email,total,items,shipping_address')
          .eq('id', payment.external_reference).single();

        await supabase.from('orders').update({
          status: newStatus,
          payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        }).eq('id', payment.external_reference);

        if (newStatus === 'paid' && existingOrder && existingOrder.status !== 'paid') {
          await notifyNewSale(existingOrder as any);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Siempre devolver 200 para que MP no reintente infinitamente
    return NextResponse.json({ ok: true });
  }
}
