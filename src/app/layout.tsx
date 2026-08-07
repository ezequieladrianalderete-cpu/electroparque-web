import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { AnalyticsScripts } from '@/components/store/AnalyticsScripts';
import { PageViewTracker } from '@/components/store/PageViewTracker';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('value').eq('key', 'meta_domain_verification').single();
  // Admite que pegaron el código solo, o la etiqueta <meta ...> completa que da Meta.
  const raw = data?.value || '';
  const match = raw.match(/content=["']([^"']+)["']/);
  const verificationCode = match ? match[1] : raw;

  return {
    title: { default: 'Electro Parque — Tecnología de punta', template: '%s | Electro Parque' },
    description: 'Importación y distribución de tecnología. Carplay para moto y más.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app'),
    ...(verificationCode ? { other: { 'facebook-domain-verification': verificationCode } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('key,value');
  const settings: Record<string, string> = {};
  data?.forEach(d => { if (d.value) settings[d.key] = d.value; });

  return (
    <html lang="es">
      <body className="antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
        <AnalyticsScripts ga4Id={settings.ga4_measurement_id} pixelId={settings.facebook_pixel_id} />
        <PageViewTracker />
        <Header settings={settings} />
        <main className="min-h-screen">{children}</main>
        <Footer settings={settings} />
        <WhatsAppButton />
      </body>
    </html>
  );
}
