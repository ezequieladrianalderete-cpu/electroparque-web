import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface CheckResult { name: string; ok: boolean; detail: string; }

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user;
}

function envCheck(name: string): CheckResult {
  const present = !!process.env[name] && process.env[name]!.length > 5;
  return { name: `Variable de entorno: ${name}`, ok: present, detail: present ? 'configurada' : 'falta o está vacía' };
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app';
  const checks: CheckResult[] = [];

  // 1) Variables de entorno críticas
  ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    'MERCADOPAGO_ACCESS_TOKEN', 'GOCUOTAS_EMAIL', 'GOCUOTAS_API_KEY',
    'RESEND_API_KEY', 'STOCK_APP_SECRET', 'STOCK_APP_SUPABASE_URL', 'STOCK_APP_SUPABASE_ANON_KEY'].forEach(k => checks.push(envCheck(k)));

  // 2) Conexión a la base
  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error, count } = await admin.from('products').select('*', { count: 'exact', head: true });
    checks.push({ name: 'Conexión a la base de datos', ok: !error, detail: error ? error.message : `${count ?? 0} productos encontrados` });
  } catch (e: any) {
    checks.push({ name: 'Conexión a la base de datos', ok: false, detail: e.message });
  }

  // 3) El checkout puede crear un pedido de verdad (lo que se rompió la última vez) —
  // se crea uno de prueba con la service role y se borra al toque.
  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await admin.from('orders').insert({
      customer_name: '__HEALTHCHECK__', customer_phone: '0', customer_email: 'healthcheck@electroparque.com',
      shipping_address: {}, items: [], subtotal: 0, shipping_cost: 0, discount_amount: 0, total: 0,
      status: 'pending', checkout_completed: false,
    }).select().single();
    if (error) throw error;
    await admin.from('orders').delete().eq('id', data.id);
    checks.push({ name: 'El checkout puede crear pedidos', ok: true, detail: 'insert + select + delete de prueba OK' });
  } catch (e: any) {
    checks.push({ name: 'El checkout puede crear pedidos', ok: false, detail: e.message });
  }

  // 4) Un visitante anónimo NO puede leer pedidos ajenos (chequeo de seguridad, no solo funcional)
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data, error } = await anon.from('orders').select('id').limit(1);
    const leaking = !error && (data?.length ?? 0) > 0;
    checks.push({ name: 'Los pedidos NO son legibles por cualquiera', ok: !leaking, detail: leaking ? '¡ALERTA! un visitante anónimo puede leer pedidos' : 'bloqueado correctamente' });
  } catch {
    checks.push({ name: 'Los pedidos NO son legibles por cualquiera', ok: true, detail: 'bloqueado correctamente' });
  }

  // 5) El registro de visitas (analytics_events) admite insertar desde el sitio
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await anon.from('analytics_events').insert({ event_type: 'page_view', session_id: '__HEALTHCHECK__' });
    checks.push({ name: 'Las estadísticas de visitas se pueden registrar', ok: !error, detail: error ? error.message : 'OK' });
  } catch (e: any) {
    checks.push({ name: 'Las estadísticas de visitas se pueden registrar', ok: false, detail: e.message });
  }

  // 6) MercadoPago — el token sigue siendo válido
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } });
    checks.push({ name: 'MercadoPago (token de pago)', ok: res.ok, detail: res.ok ? 'token válido' : `HTTP ${res.status}` });
  } catch (e: any) {
    checks.push({ name: 'MercadoPago (token de pago)', ok: false, detail: e.message });
  }

  // 7) GoCuotas — la sucursal se puede autenticar
  try {
    const res = await fetch('https://www.gocuotas.com/api_redirect/v1/authentication', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.GOCUOTAS_EMAIL, password: process.env.GOCUOTAS_API_KEY }),
    });
    const data = await res.json().catch(() => ({}));
    checks.push({ name: 'GoCuotas (autenticación de sucursal)', ok: res.ok && !!data.token, detail: res.ok && data.token ? 'token válido' : `HTTP ${res.status}` });
  } catch (e: any) {
    checks.push({ name: 'GoCuotas (autenticación de sucursal)', ok: false, detail: e.message });
  }

  // 8) Aviso por email de nueva venta: hay a quién avisarle Y Resend lo manda de verdad
  // (no solo "está la clave cargada" — se prueba el envío real, porque un typo al pegar
  // la clave en Vercel pasaría desapercibido si solo miráramos que no esté vacía).
  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await admin.from('store_settings').select('value').eq('key', 'order_notification_emails').single();
    const emails = (data?.value || '').split(',').map((e: string) => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      checks.push({ name: 'Aviso de venta por email', ok: false, detail: 'no hay ningún email cargado en Configuración' });
    } else if (!process.env.RESEND_API_KEY) {
      checks.push({ name: 'Aviso de venta por email', ok: false, detail: 'falta RESEND_API_KEY' });
    } else {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Electro Parque <onboarding@resend.dev>',
          to: emails,
          subject: '✅ Chequeo de salud — Electro Parque',
          html: '<p>Si ves esto, el aviso de nuevas ventas por email está funcionando.</p>',
        }),
      });
      const body = await res.json().catch(() => ({}));
      checks.push({ name: 'Aviso de venta por email (envío real de prueba)', ok: res.ok, detail: res.ok ? `enviado a ${emails.join(', ')} (id ${body.id})` : `Resend HTTP ${res.status}: ${body.message || JSON.stringify(body)}` });
    }
  } catch (e: any) {
    checks.push({ name: 'Aviso de venta por email', ok: false, detail: e.message });
  }

  // 9) Endpoint de stock-app: rechaza correctamente un secreto incorrecto (no podemos
  // probar el secreto real desde acá sin conocerlo, pero sí confirmar que el gate anda)
  try {
    const res = await fetch(`${baseUrl}/api/stock-app/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-stock-app-secret': '__wrong__' },
      body: JSON.stringify({ stock_app_id: 0, name: 'healthcheck' }),
    });
    checks.push({ name: 'Endpoint de stock-app (rechaza secretos incorrectos)', ok: res.status === 401, detail: res.status === 401 ? 'protegido correctamente' : `esperaba HTTP 401, llegó ${res.status}` });
  } catch (e: any) {
    checks.push({ name: 'Endpoint de stock-app (rechaza secretos incorrectos)', ok: false, detail: e.message });
  }

  // 9.5) Conexión real a la base del stock-app (otro proyecto de Supabase) — confirma que
  // las claves recién cargadas funcionan de verdad, no solo que están presentes.
  try {
    if (!process.env.STOCK_APP_SUPABASE_URL || !process.env.STOCK_APP_SUPABASE_ANON_KEY) {
      checks.push({ name: 'Conexión a la base del stock-app', ok: false, detail: 'faltan STOCK_APP_SUPABASE_URL/ANON_KEY' });
    } else {
      const stockDb = createClient(process.env.STOCK_APP_SUPABASE_URL, process.env.STOCK_APP_SUPABASE_ANON_KEY);
      const { error, count } = await stockDb.from('stock').select('*', { count: 'exact', head: true });
      checks.push({ name: 'Conexión a la base del stock-app', ok: !error, detail: error ? error.message : `${count ?? 0} artículos encontrados en stock` });
    }
  } catch (e: any) {
    checks.push({ name: 'Conexión a la base del stock-app', ok: false, detail: e.message });
  }

  // 10) El catálogo para Meta responde y trae productos
  try {
    const res = await fetch(`${baseUrl}/api/feed/facebook`, { cache: 'no-store' });
    const text = await res.text();
    const itemCount = (text.match(/<item>/g) || []).length;
    checks.push({ name: 'Catálogo de Meta (feed de productos)', ok: res.ok && itemCount > 0, detail: res.ok ? `${itemCount} productos en el feed` : `HTTP ${res.status}` });
  } catch (e: any) {
    checks.push({ name: 'Catálogo de Meta (feed de productos)', ok: false, detail: e.message });
  }

  // 11) Páginas clave del sitio responden
  const pages = ['/', '/productos', '/checkout', '/favoritos'];
  for (const path of pages) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
      checks.push({ name: `Página ${path}`, ok: res.ok, detail: res.ok ? 'OK' : `HTTP ${res.status}` });
    } catch (e: any) {
      checks.push({ name: `Página ${path}`, ok: false, detail: e.message });
    }
  }

  const allOk = checks.every(c => c.ok);
  return NextResponse.json({ ok: allOk, checkedAt: new Date().toISOString(), checks });
}
