import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crea o actualiza el pedido/borrador del checkout (se autoguarda mientras el cliente
// completa el formulario, y de nuevo al tocar pagar/coordinar). Va todo por acá con la
// service role porque el cliente anónimo no tiene permiso directo de INSERT+SELECT ni
// UPDATE sobre "orders" (ver migración restrict_anon_orders_access) — esta ruta es la
// única forma de crear o tocar un pedido antes de que se confirme el pago.
export async function POST(req: NextRequest) {
  try {
    const { orderId, order } = await req.json();
    if (!order) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    if (!orderId) {
      const { data, error } = await supabase.from('orders').insert({ ...order, status: 'pending' }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data);
    }

    // Solo se puede tocar un pedido que todavía está "pending" — evita que alguien use
    // esta ruta para pisar los datos de un pedido ya pagado/confirmado, y evita que el
    // cuerpo mande cualquier otro estado (siempre se fuerza a 'pending').
    const { data: existing } = await supabase.from('orders').select('status').eq('id', orderId).single();
    if (!existing || existing.status !== 'pending') {
      return NextResponse.json({ error: 'Este pedido ya no se puede modificar' }, { status: 400 });
    }

    const { data, error } = await supabase.from('orders').update({ ...order, status: 'pending' }).eq('id', orderId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno: ' + (err.message || 'desconocido') }, { status: 500 });
  }
}
