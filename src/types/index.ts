export interface Category {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; sort_order: number; is_active: boolean;
}
export interface ProductImage {
  id: string; product_id: string; url: string; alt: string | null;
  sort_order: number; is_primary: boolean;
}
export interface ProductVariant {
  id: string; product_id: string; name: string; value: string;
  price_modifier: number; stock: number; sku: string | null; is_active: boolean;
}
export interface Product {
  id: string; name: string; slug: string; description: string | null;
  short_description: string | null; price: number; compare_at_price: number | null;
  sku: string | null; category_id: string | null; is_active: boolean; is_featured: boolean;
  tags: string[] | null; specs: Record<string, string>; sort_order: number;
  category?: Category; images?: ProductImage[]; variants?: ProductVariant[];
}
export interface Banner {
  id: string; title: string | null; subtitle: string | null; image_url: string;
  link_url: string | null; link_text: string | null; is_active: boolean; sort_order: number;
}
export interface Review {
  id: string; product_id: string; customer_name: string; rating: number;
  title: string | null; comment: string; is_approved: boolean; is_featured: boolean;
  created_at: string;
}
export interface CartItem { product: Product; variant?: ProductVariant; quantity: number; }
