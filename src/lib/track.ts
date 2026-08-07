import { createBrowserClient } from '@supabase/ssr';
import { getSessionId } from './session';

let client: ReturnType<typeof createBrowserClient> | null = null;
function supabase() {
  if (!client) client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}

export type AnalyticsEventType = 'page_view' | 'view_category' | 'view_product' | 'add_to_cart' | 'begin_checkout';

// Best-effort: nunca debe romper la navegación del visitante si falla o tarda.
export function logEvent(eventType: AnalyticsEventType, extra: { product_id?: string; category_id?: string } = {}) {
  if (typeof window === 'undefined') return;
  supabase().from('analytics_events').insert({ event_type: eventType, session_id: getSessionId(), ...extra }).then(() => {}, () => {});
}
