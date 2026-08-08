import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { notifyNewSale } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_reference_id, status, order_id } = body;

    if (!order_reference_id) return NextResponse.json({ ok: true });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let newStatus = 'pending';
    if (status === 'approved') newStatus = 'paid';
    else if (status === 'rejected' || status === 'cancelled' || status === 'expired') newStatus = 'cancelled';

    const { data: existingOrder } = await supabase.from('orders')
      .select('status,order_number,customer_name,customer_phone,customer_email,total,items,shipping_address')
      .eq('id', order_reference_id).single();

    await supabase.from('orders').update({
      status: newStatus,
      payment_id: order_id ? String(order_id) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', order_reference_id);

    if (newStatus === 'paid' && existingOrder && existingOrder.status !== 'paid') {
      await notifyNewSale(existingOrder as any);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Siempre devolver 200 para que GoCuotas no reintente infinitamente
    return NextResponse.json({ ok: true });
  }
}
