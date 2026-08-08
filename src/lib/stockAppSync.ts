import { createClient } from '@supabase/supabase-js';

// Base de stock-app (otro proyecto, otra Supabase). Usa su anon key porque ahí la
// tabla "stock"/"movimientos" ya tiene RLS abierta a propósito (es una herramienta
// interna) — mismo criterio que ya se usa para publicar productos en sentido inverso.
//
// Se crea el cliente recién cuando hace falta (no al importar el módulo): Next.js
// ejecuta el código de la ruta durante el build para "recolectar datos de la página",
// y createClient() tira una excepción de inmediato si la URL falta o es inválida —
// eso rompía el build entero apenas faltaba STOCK_APP_SUPABASE_URL/ANON_KEY en Vercel,
// aunque esta función nunca llegara a ejecutarse en tiempo de request.
let _stockDb: any = null;
function stockDb() {
  if (!_stockDb) {
    if (!process.env.STOCK_APP_SUPABASE_URL || !process.env.STOCK_APP_SUPABASE_ANON_KEY) {
      throw new Error('Falta STOCK_APP_SUPABASE_URL y/o STOCK_APP_SUPABASE_ANON_KEY');
    }
    _stockDb = createClient(process.env.STOCK_APP_SUPABASE_URL, process.env.STOCK_APP_SUPABASE_ANON_KEY);
  }
  return _stockDb;
}

// Cuando un pedido de la tienda se paga, descuenta el stock real en stock-app y
// registra la venta (canal 'web') para que aparezca en Facturación — mismo mecanismo
// que usan las ventas de MercadoLibre/mostrador. orderId siempre pasa por acá con la
// service role de electroparque-web (ver webhooks de MP/GoCuotas y /api/orders/status).
//
// El "claim" atómico (update ... where stock_synced_at is null) evita descontar stock
// dos veces si el webhook de pago llega repetido (MP reintenta notificaciones seguido).
export async function syncOrderToStockApp(epSupabase: any, orderId: string) {
  if (!orderId) return;

  const { data: claimed } = await epSupabase
    .from('orders')
    .update({ stock_synced_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('stock_synced_at', null)
    .select()
    .maybeSingle();
  if (!claimed) return;

  const items: any[] = Array.isArray(claimed.items) ? claimed.items : [];
  const productIds = items.map(i => i.product_id).filter(Boolean);
  if (!productIds.length) return;

  const { data: products } = await epSupabase.from('products').select('id,stock_app_id').in('id', productIds);
  const stockAppIdByProduct: Record<string, number> = {};
  (products || []).forEach((p: any) => { if (p.stock_app_id) stockAppIdByProduct[p.id] = p.stock_app_id; });

  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR');
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  for (const item of items) {
    const stockAppId = stockAppIdByProduct[item.product_id];
    if (!stockAppId) continue;
    const qty = Math.max(1, Math.floor(Number(item.quantity)) || 1);

    const { data: prod } = await stockDb().from('stock').select('id,sku,articulo,cantidades').eq('id', stockAppId).maybeSingle();
    if (!prod) continue;

    const anterior = prod.cantidades || 0;
    const nuevo = Math.max(0, anterior - qty);
    await stockDb().from('stock').update({ cantidades: nuevo, estado: nuevo > 0 ? 'STOCK' : 'SIN STOCK' }).eq('id', stockAppId);
    await stockDb().from('movimientos').insert({
      fecha, hora, usuario: 'Tienda Web', articulo: item.name || prod.articulo,
      sku: prod.sku, tipo: 'venta', cantidad: qty, stock_anterior: anterior, stock_nuevo: nuevo,
      canal: 'web', monto: Number(item.subtotal) || 0,
    });
  }
}
