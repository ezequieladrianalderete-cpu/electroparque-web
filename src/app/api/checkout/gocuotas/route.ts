import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, orderId, customerEmail, customerPhone } = body;

    const apiKey = process.env.GOCUOTAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GoCuotas no configurado. Falta GOCUOTAS_API_KEY en Vercel.' }, { status: 500 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    // Igual que con MercadoPago: nunca confiar en el precio que manda el navegador,
    // se vuelve a buscar cada precio real en Supabase para armar el monto correcto.
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    let totalPesos = 0;
    for (const item of items) {
      const productId = item.product_id || item.id;
      const { data: product } = await supabase.from('products').select('id,price').eq('id', productId).eq('is_active', true).single();
      if (!product) {
        return NextResponse.json({ error: `Producto no disponible: ${item.name || productId}` }, { status: 400 });
      }
      let priceModifier = 0;
      if (item.variant_id) {
        const { data: variant } = await supabase.from('product_variants').select('price_modifier').eq('id', item.variant_id).eq('product_id', productId).single();
        priceModifier = Number(variant?.price_modifier) || 0;
      }
      const quantity = Math.max(1, Math.min(100, Math.floor(Number(item.quantity)) || 1));
      totalPesos += (Number(product.price) + priceModifier) * quantity;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app';
    const amountInCents = Math.round(totalPesos * 100);

    const gcResponse = await fetch('https://www.gocuotas.com/api_redirect/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_in_cents: amountInCents,
        url_success: `${baseUrl}/checkout/resultado?status=success&order=${orderId}`,
        url_failure: `${baseUrl}/checkout/resultado?status=failure&order=${orderId}`,
        order_reference_id: orderId || '',
        webhook_url: `${baseUrl}/api/webhook/gocuotas`,
        email: customerEmail || '',
        phone_number: customerPhone || '',
      }),
    });

    // GoCuotas no siempre devuelve JSON (puede devolver una página de error/mantenimiento);
    // leemos como texto primero para nunca reventar con un mensaje confuso.
    const gcRawText = await gcResponse.text();
    let gcData: any = {};
    try { gcData = gcRawText ? JSON.parse(gcRawText) : {}; } catch { gcData = {}; }

    if (!gcResponse.ok) {
      return NextResponse.json({ error: `Error de GoCuotas (HTTP ${gcResponse.status}): ${gcData.message || 'sin detalle'}` }, { status: 400 });
    }

    if (!gcData.url_init) {
      return NextResponse.json({ error: `GoCuotas no devolvió un link de pago (HTTP ${gcResponse.status})` }, { status: 400 });
    }

    return NextResponse.json({ url_init: gcData.url_init });

  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno: ' + (err.message || 'desconocido') }, { status: 500 });
  }
}
