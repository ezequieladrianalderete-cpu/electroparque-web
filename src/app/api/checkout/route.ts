import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, orderId, customerEmail } = body;

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'MercadoPago no configurado. Falta MERCADOPAGO_ACCESS_TOKEN en Vercel.' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque.vercel.app';

    const preferenceBody = {
      items: (items || []).map((item: any) => ({
        id: item.product_id || item.id || 'prod',
        title: item.name || 'Producto',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.price) || 0,
        currency_id: 'ARS',
      })),
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

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return NextResponse.json({ error: 'Error de MercadoPago: ' + (mpData.message || JSON.stringify(mpData)) }, { status: 400 });
    }

    return NextResponse.json({
      id: mpData.id,
      init_point: mpData.init_point,
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno: ' + (err.message || 'desconocido') }, { status: 500 });
  }
}
