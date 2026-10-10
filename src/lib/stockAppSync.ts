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
    // STOCK_APP_TOKEN es un pase propio de la tienda (rol 'tienda' en stock-app): solo puede ver
    // el stock, descontarlo y anotar la venta y el pedido. La llave pública sigue yendo como
    // apikey (la pide la puerta de entrada del servidor), pero los permisos salen del pase.
    const token = process.env.STOCK_APP_TOKEN;
    _stockDb = createClient(process.env.STOCK_APP_SUPABASE_URL, process.env.STOCK_APP_SUPABASE_ANON_KEY,
      token ? { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } } : undefined);
  }
  return _stockDb;
}

// Apps Script que respalda la planilla de Google Sheets — esa planilla es lo que
// alimenta la sincronización de stock con Mercado Libre (no se toca acá). Cuando
// stock-app descuenta stock desde el navegador (venta de mostrador, venta ML, etc.)
// también le avisa a este mismo endpoint para que la planilla quede al día; una venta
// de la web tiene que avisar igual, si no la planilla se queda con un número viejo y
// Mercado Libre puede seguir vendiendo algo que ya no hay. Fire-and-forget: si esto
// falla, no debe frenar ni deshacer el descuento real ya confirmado en Supabase.
const SHEET_SYNC_URL = 'https://script.google.com/macros/s/AKfycbxrz4MOxub5tdfiQ09gbLi0b-GXwimlfRfVyOCsRS9Ap9G3GbCkTUoYpvMrRrGs6w4/exec';
function notifySheet(sku: string, nuevaCantidad: number, nuevoEstado: string) {
  // (No hace falta mode:'no-cors' acá: eso es una restricción del navegador, esto corre
  // server-side donde no aplica CORS entre servidores.)
  const params = new URLSearchParams({ accion: 'actualizarStock', sku, nuevaCantidad: String(nuevaCantidad), nuevoEstado });
  // La planilla pide una clave para aceptar cambios (HOJA_CLAVE en Vercel).
  if (process.env.HOJA_CLAVE) params.set('clave', process.env.HOJA_CLAVE);
  fetch(`${SHEET_SYNC_URL}?${params}`).catch(() => {});
}

// Cuando un pedido de la tienda se paga, descuenta el stock real en stock-app y
// registra la venta (canal 'web') para que aparezca en Facturación — mismo mecanismo
// que usan las ventas de MercadoLibre/mostrador. orderId siempre pasa por acá con la
// service role de electroparque-web (ver webhooks de MP/GoCuotas y /api/orders/status).
//
// El "claim" atómico (update ... where stock_synced_at is null) evita descontar stock
// dos veces si el webhook de pago llega repetido (MP reintenta notificaciones seguido).
// Flex (moto) para CABA y GBA, correo para el resto del país: se decide por el código
// postal (CABA 1000-1499, GBA 1600-1899) o, si falta, por la provincia.
function tipoEnvio(addr: any): string {
  const cp = parseInt(String(addr?.zip || '').replace(/\D/g, '').slice(0, 4), 10);
  if (cp >= 1000 && cp <= 1499) return 'Flex';
  if (cp >= 1600 && cp <= 1899) return 'Flex';
  const prov = String(addr?.province || '').toLowerCase();
  if (/capital|caba|ciudad aut/.test(prov)) return 'Flex';
  if (!addr || (!addr.zip && !addr.province)) return '';
  return 'Correo';
}

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
    const qty = Math.max(1, Math.floor(Number(item.quantity)) || 1);
    let prod: any = null;

    if (!stockAppId) {
      console.error(`syncOrderToStockApp: pedido ${orderId} — producto ${item.product_id} (${item.name || 'sin nombre'}) no tiene stock_app_id, no se descontó stock`);
    } else {
      const { data: p } = await stockDb().from('stock').select('id,sku,articulo,cantidades,caja,estanteria,observaciones').eq('id', stockAppId).maybeSingle();
      if (!p) {
        console.error(`syncOrderToStockApp: pedido ${orderId} — stock_app_id ${stockAppId} (producto ${item.product_id}) no existe en stock-app, no se descontó stock`);
      } else {
        prod = p;
        const anterior = prod.cantidades || 0;
        const nuevo = Math.max(0, anterior - qty);
        const nuevoEstado = nuevo > 0 ? 'STOCK' : 'SIN STOCK';
        await stockDb().from('stock').update({ cantidades: nuevo, estado: nuevoEstado }).eq('id', stockAppId);
        if (prod.sku) notifySheet(prod.sku, nuevo, nuevoEstado);
        await stockDb().from('movimientos').insert({
          fecha, hora, usuario: 'Tienda Web', articulo: item.name || prod.articulo,
          sku: prod.sku, tipo: 'venta', cantidad: qty, stock_anterior: anterior, stock_nuevo: nuevo,
          canal: 'web', monto: Number(item.subtotal) || 0,
        });
      }
    }

    // Aparece en la Lista de retiro de stock-app para que lo preparen, se haya
    // podido descontar stock o no — el objetivo acá es que el pedido no se
    // pierda de vista, no solo llevar el conteo de inventario. web_order_id
    // conecta cada fila con el pedido real para poder marcarlo "Preparando"
    // cuando estén todos sus productos tildados (ver toggleRetirado en stock-app).
    const ubicacion = prod ? [prod.caja, prod.estanteria].filter(Boolean).join(' · ') : null;
    await stockDb().from('lista_retiro').insert({
      mla: null,
      articulo: item.name || prod?.articulo || 'Producto sin nombre',
      sku: prod?.sku || null,
      cantidad: qty,
      stock_id: prod?.id || null,
      cuenta_numero: 'web',
      cuenta_nombre: 'Tienda Web',
      usuario: 'Auto (Web)',
      orden: String(claimed.order_number ?? orderId),
      observaciones: prod?.observaciones || null,
      ubicacion: ubicacion || null,
      web_order_id: orderId,
      envio: tipoEnvio(claimed.shipping_address) || null,
      total_pedido: Number(claimed.total) || null,
    });
  }
}
