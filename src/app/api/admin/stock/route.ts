import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cargar desde el admin de la tienda cuánto hay de un producto. El stock vive en stock-app (un solo número
// para Mercado Libre, mostrador y tienda): se actualiza el producto vinculado, queda el movimiento en el
// historial y se avisa a la planilla, igual que cualquier ajuste hecho en stock-app.
// "cantidad" = lo que hay para vender en el depósito; lo que está en Full de ML se suma aparte.
const SHEET_SYNC_URL = 'https://script.google.com/macros/s/AKfycbxrz4MOxub5tdfiQ09gbLi0b-GXwimlfRfVyOCsRS9Ap9G3GbCkTUoYpvMrRrGs6w4/exec';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user: caller } } = await authClient.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { productId, cantidad } = await req.json();
  const cant = Math.floor(Number(cantidad));
  if (!productId || !Number.isFinite(cant) || cant < 0 || cant > 100000) {
    return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: product } = await db.from('products').select('id,name,stock_app_id').eq('id', productId).maybeSingle();
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  if (!product.stock_app_id) {
    return NextResponse.json({ error: 'Este producto no está vinculado al sistema de stock. Publicalo desde stock-app (botón "Publicar en la web" del producto) para que tome el stock de ahí.' }, { status: 400 });
  }
  const { data: s } = await db.from('stock').select('id,sku,articulo,cantidades,full_ml').eq('id', product.stock_app_id).maybeSingle();
  if (!s) return NextResponse.json({ error: 'El producto vinculado ya no existe en el sistema de stock' }, { status: 400 });

  const anterior = Number(s.cantidades) || 0;
  const nuevo = cant + (Number(s.full_ml) || 0);
  if (nuevo !== anterior) {
    const estado = nuevo > 0 ? 'STOCK' : 'SIN STOCK';
    const { error } = await db.from('stock').update({ cantidades: nuevo, estado }).eq('id', s.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const now = new Date();
    const quien = caller.email || 'admin';
    await db.from('movimientos').insert({
      fecha: now.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
      usuario: 'Tienda Web (' + quien + ')', articulo: s.articulo, sku: s.sku, tipo: 'ajuste',
      cantidad: Math.abs(nuevo - anterior), stock_anterior: anterior, stock_nuevo: nuevo, canal: 'ajuste', monto: 0,
    });
    if (s.sku) {
      const params = new URLSearchParams({ accion: 'actualizarStock', sku: s.sku, nuevaCantidad: String(nuevo), nuevoEstado: estado });
      if (process.env.HOJA_CLAVE) params.set('clave', process.env.HOJA_CLAVE);
      fetch(`${SHEET_SYNC_URL}?${params}`).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true, stock_disponible: cant, total_sistema: nuevo, full_ml: Number(s.full_ml) || 0 });
}
