import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Recibe publicaciones de producto desde stock-app (sistema interno de inventario,
// otro dominio). Protegido con un secreto compartido (no con Supabase Auth) porque
// stock-app no maneja sesiones de este proyecto — por eso lleva CORS abierto: la
// seguridad real la da el header x-stock-app-secret, no el origen de la request.
// Usa la service role porque "products" solo permite escritura a usuarios
// autenticados — ver política auth_products/auth_all_products.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-stock-app-secret',
};

function json(body: any, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-stock-app-secret');
    if (!secret || secret !== process.env.STOCK_APP_SECRET) {
      return json({ error: 'No autorizado' }, 401);
    }

    const body = await req.json().catch(() => null);
    const stockAppId = body?.stock_app_id;
    const name = (body?.name || '').trim();
    if (!stockAppId || !name) return json({ error: 'Faltan datos' }, 400);

    const price = Number(body?.price) || 0;
    const sku = body?.sku ? String(body.sku) : null;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Ya publicado antes (vinculado por stock_app_id) -> actualiza nombre/precio/sku,
    // sin tocar is_active, imágenes ni descripción (eso lo maneja marketing en la web).
    const { data: existing } = await supabase.from('products').select('id').eq('stock_app_id', stockAppId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('products').update({ name, price, sku }).eq('id', existing.id);
      if (error) return json({ error: error.message }, 500);
      return json({ id: existing.id, created: false });
    }

    // Primera publicación: se crea inactiva (borrador) para que marketing la revise,
    // le sume fotos/descripción y recién ahí la active.
    const slugBase = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase || 'producto'}-${stockAppId}`;

    const { data, error } = await supabase.from('products')
      .insert({ name, slug, price, sku, is_active: false, stock_app_id: stockAppId })
      .select('id').single();
    if (error) return json({ error: error.message }, 500);
    return json({ id: data.id, created: true });
  } catch (err: any) {
    return json({ error: 'Error interno: ' + (err.message || 'desconocido') }, 500);
  }
}
