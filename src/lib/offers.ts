export interface OfferLike {
  id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  applies_to: string | null;
  product_id: string | null;
  category_id: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export function findActiveOffer(offers: OfferLike[], product: { id: string; category_id: string | null }): OfferLike | null {
  const now = Date.now();
  const applicable = offers.filter(o => {
    if (!o.is_active) return false;
    if (o.starts_at && new Date(o.starts_at).getTime() > now) return false;
    if (o.ends_at && new Date(o.ends_at).getTime() < now) return false;
    if (o.applies_to === 'product') return o.product_id === product.id;
    if (o.applies_to === 'category') return !!o.category_id && o.category_id === product.category_id;
    return !o.applies_to || o.applies_to === 'all';
  });
  if (applicable.length === 0) return null;
  return applicable.reduce((best, o) => (discountAmount(1000000, o) > discountAmount(1000000, best) ? o : best));
}

function discountAmount(price: number, offer: OfferLike): number {
  return offer.discount_type === 'percentage' ? price * (Number(offer.discount_value) / 100) : Number(offer.discount_value);
}

export function applyOffer(price: number, offer: OfferLike | null): number {
  if (!offer) return price;
  const discounted = price - discountAmount(price, offer);
  return Math.max(0, Math.round(discounted * 100) / 100);
}
