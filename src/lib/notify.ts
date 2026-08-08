import { createClient } from '@supabase/supabase-js';

interface OrderForNotify {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total: number;
  items: { name: string; quantity: number; variant?: string | null }[];
  shipping_address?: { address?: string; city?: string; province?: string; zip?: string } | null;
}

// Best-effort: si falla o no está configurado, nunca debe romper el webhook de pago que lo llama
// — pero sí queda registrado en los logs para poder ver por qué, en vez de fallar en silencio.
export async function notifyNewSale(order: OrderForNotify) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error('notifyNewSale: falta RESEND_API_KEY'); return; }

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await supabase.from('store_settings').select('value').eq('key', 'order_notification_emails').single();
    const emails = (data?.value || '').split(',').map((e: string) => e.trim()).filter(Boolean);
    if (emails.length === 0) { console.error('notifyNewSale: no hay emails cargados en order_notification_emails'); return; }

    const itemsHtml = order.items.map(i => `<li>${i.quantity}x ${i.name}${i.variant ? ` (${i.variant})` : ''}</li>`).join('');
    const addr = order.shipping_address;
    const addrText = addr ? [addr.address, addr.city, addr.province, addr.zip].filter(Boolean).join(', ') : '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque.com';
    const total = Number(order.total).toLocaleString('es-AR');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Electro Parque <onboarding@resend.dev>',
        to: emails,
        subject: `🎉 Nueva venta #${order.order_number} — $${total}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#1c2f6b">🎉 Nueva venta confirmada</h2>
            <p><strong>Pedido:</strong> #${order.order_number}</p>
            <p><strong>Cliente:</strong> ${order.customer_name} — ${order.customer_phone}${order.customer_email ? ` — ${order.customer_email}` : ''}</p>
            ${addrText ? `<p><strong>Envío a:</strong> ${addrText}</p>` : ''}
            <p><strong>Productos:</strong></p>
            <ul>${itemsHtml}</ul>
            <p style="font-size:18px"><strong>Total: $${total}</strong></p>
            <p><a href="${baseUrl}/admin/pedidos" style="color:#1c2f6b">Ver en el panel →</a></p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`notifyNewSale: Resend respondió HTTP ${res.status}: ${body}`);
    }
  } catch (err: any) {
    console.error('notifyNewSale: error inesperado:', err?.message || err);
  }
}
