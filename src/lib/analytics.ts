// Puente único a GA4 (gtag) y Facebook Pixel (fbq) para los eventos de e-commerce.
// Si alguno de los dos no está configurado (o el script todavía no cargó), la llamada
// simplemente no hace nada — nunca debe romper la navegación del cliente.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

interface TrackProduct { id: string; name: string; price: number; category?: { name: string } | null }

function gtagEvent(name: string, params: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) window.gtag('event', name, params);
}
function fbqEvent(name: string, params: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) window.fbq('track', name, params);
}

export function trackViewItem(product: TrackProduct) {
  gtagEvent('view_item', { currency: 'ARS', value: product.price, items: [{ item_id: product.id, item_name: product.name, item_category: product.category?.name, price: product.price }] });
  fbqEvent('ViewContent', { content_ids: [product.id], content_name: product.name, content_category: product.category?.name, currency: 'ARS', value: product.price });
}

export function trackAddToCart(product: TrackProduct, quantity: number) {
  gtagEvent('add_to_cart', { currency: 'ARS', value: product.price * quantity, items: [{ item_id: product.id, item_name: product.name, item_category: product.category?.name, price: product.price, quantity }] });
  fbqEvent('AddToCart', { content_ids: [product.id], content_name: product.name, currency: 'ARS', value: product.price * quantity });
}

export function trackBeginCheckout(items: { product: TrackProduct; quantity: number }[], total: number) {
  gtagEvent('begin_checkout', { currency: 'ARS', value: total, items: items.map(i => ({ item_id: i.product.id, item_name: i.product.name, price: i.product.price, quantity: i.quantity })) });
  fbqEvent('InitiateCheckout', { content_ids: items.map(i => i.product.id), currency: 'ARS', value: total, num_items: items.reduce((n, i) => n + i.quantity, 0) });
}

export function trackPurchase(order: { id: string; order_number: string; total: number; items: { product_id: string; name: string; price: number; quantity: number }[] }) {
  gtagEvent('purchase', { transaction_id: order.order_number, currency: 'ARS', value: order.total, items: order.items.map(i => ({ item_id: i.product_id, item_name: i.name, price: i.price, quantity: i.quantity })) });
  fbqEvent('Purchase', { content_ids: order.items.map(i => i.product_id), currency: 'ARS', value: order.total });
}
