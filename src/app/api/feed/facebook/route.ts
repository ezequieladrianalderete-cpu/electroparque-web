import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findActiveOffer, applyOffer } from '@/lib/offers';

// Feed de catálogo de productos en formato RSS + namespace de Google/Meta (g:), el que
// pide Meta Commerce Manager para sincronizar Instagram/Facebook Shop. Se recalcula en
// cada request para que precios/stock/ofertas estén siempre al día — no hace falta
// resubir nada a mano.
export const dynamic = 'force-dynamic';

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, ']]&gt;')}]]>`;
}

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app';

  const [{ data: products }, { data: offers }] = await Promise.all([
    supabase.from('products')
      .select('id,name,slug,short_description,description,price,category_id,is_active,images:product_images(url,is_primary,sort_order)')
      .eq('is_active', true),
    supabase.from('offers').select('*').eq('is_active', true),
  ]);

  const items = (products || []).map((p: any) => {
    const images = (p.images || []).slice().sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);
    const mainImage = images[0]?.url;
    if (!mainImage) return '';
    const description = stripHtml(p.short_description || p.description) || p.name;
    const link = `${baseUrl}/productos/${p.slug}`;

    // Meta muestra "price" tachado y "sale_price" como el precio final solo si mandamos
    // los dos — si el producto tiene una oferta activa, price queda como el de lista.
    const offer = findActiveOffer(offers || [], { id: p.id, category_id: p.category_id });
    const salePrice = offer ? applyOffer(Number(p.price), offer) : null;
    const salePriceTag = salePrice !== null && salePrice < Number(p.price)
      ? `\n    <g:sale_price>${salePrice.toFixed(2)} ARS</g:sale_price>` : '';

    return `  <item>
    <g:id>${xmlEscape(p.id)}</g:id>
    <title>${cdata(p.name)}</title>
    <description>${cdata(description)}</description>
    <link>${xmlEscape(link)}</link>
    <g:image_link>${xmlEscape(mainImage)}</g:image_link>
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:price>${Number(p.price).toFixed(2)} ARS</g:price>${salePriceTag}
    <g:brand>Electro Parque</g:brand>
  </item>`;
  }).filter(Boolean).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Electro Parque — Catálogo de productos</title>
  <link>${xmlEscape(baseUrl)}</link>
  <description>Catálogo de productos de Electro Parque para Meta Commerce Manager</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
