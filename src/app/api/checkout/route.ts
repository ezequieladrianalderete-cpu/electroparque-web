import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findActiveOffer, applyOffer } from '@/lib/offers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, orderId, customerEmail } = body;

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'MercadoPago no configurado. Falta MERCADOPAGO_ACCESS_TOKEN en Vercel.' }, { status: 500 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    // Nunca confiar en el precio que manda el navegador: se vuelve a buscar
    // cada precio real en Supabase para armar el pago con el monto correcto.
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: activeOffers } = await supabase.from('offers').select('*').eq('is_active', true);

    const verifiedItems = [];
    for (const item of items) {
      const productId = item.product_id || item.id;
      const { data: product } = await supabase.from('products').select('id,name,price,category_id').eq('id', productId).eq('is_active', true).single();
      if (!product) {
        return NextResponse.json({ error: `Producto no disponible: ${item.name || productId}` }, { status: 400 });
      }
      let priceModifier = 0;
      if (item.variant_id) {
        const { data: variant } = await supabase.from('product_variants').select('price_modifier').eq('id', item.variant_id).eq('product_id', productId).single();
        priceModifier = Number(variant?.price_modifier) || 0;
      }
      const offer = findActiveOffer(activeOffers || [], { id: product.id, category_id: product.category_id });
      const basePrice = applyOffer(Number(product.price), offer);
      const quantity = Math.max(1, Math.min(100, Math.floor(Number(item.quantity)) || 1));
      verifiedItems.push({
        id: product.id,
        title: product.name,
        quantity,
        unit_price: basePrice + priceModifier,
        currency_id: 'ARS',
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app';

    const preferenceBody = {
      items: verifiedItems,
      back_urls: {
        success: `${baseUrl}/checkout/resultado?status=success&order=${orderId}`,
        failure: `${baseUrl}/checkout/resultado?status=failure&order=${orderId}`,
        pending: `${baseUrl}/checkout/resultado?status=pending&order=${orderId}`,
      },
      auto_return: 'approved',
      external_reference: orderId || '',
      notification_url: `${baseUrl}/api/webhook/mp`,
      ...(customerEmail ? { payer: { email: customerEmail } } : {}),
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    });

    // MercadoPago no siempre devuelve JSON (a veces el cuerpo viene vacío en un error);
    // leemos como texto primero para nunca reventar con un mensaje confuso.
    const mpRawText = await mpResponse.text();
    let mpData: any = {};
    try { mpData = mpRawText ? JSON.parse(mpRawText) : {}; } catch { mpData = {}; }

    if (!mpResponse.ok) {
      return NextResponse.json({ error: `Error de MercadoPago (HTTP ${mpResponse.status}): ${mpData.message || mpRawText || 'sin detalle'}` }, { status: 400 });
    }

    if (!mpData.init_point) {
      return NextResponse.json({ error: `MercadoPago no devolvió un link de pago (HTTP ${mpResponse.status}): ${mpRawText || 'respuesta vacía'}` }, { status: 400 });
    }

    return NextResponse.json({
      id: mpData.id,
      init_point: mpData.init_point,
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno: ' + (err.message || 'desconocido') }, { status: 500 });
  }
}
