import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncOrderToStockApp } from '@/lib/stockAppSync';

// Cambia el estado de un pedido desde el panel de admin. Va por acá (en vez de un
// update directo desde el navegador) para poder disparar la sincronización de stock
// cuando el estado pasa a "paid" — cubre las ventas coordinadas por WhatsApp, que no
// pasan por el webhook de MercadoPago/GoCuotas.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user: caller } } = await authClient.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { orderId, status } = await req.json().catch(() => ({}));
  if (!orderId || !status) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Si la sincronización con stock-app falla, no debe impedir que el cambio de
  // estado del pedido en sí se guarde correctamente.
  if (status === 'paid') {
    try { await syncOrderToStockApp(supabase, orderId); }
    catch (syncErr: any) {
      console.error(`/api/orders/status: fallo la sync de stock del pedido ${orderId}: ${syncErr?.message || syncErr}`);
      return NextResponse.json({ ok: true, stockSyncFailed: true });
    }
  }

  return NextResponse.json({ ok: true });
}
