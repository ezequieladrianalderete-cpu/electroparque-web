import type { Metadata } from 'next';
import './globals.css';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { InstagramButton } from '@/components/store/InstagramButton';
import { AnalyticsScripts } from '@/components/store/AnalyticsScripts';
import { PageViewTracker } from '@/components/store/PageViewTracker';

// La configuración de la tienda (WhatsApp, redes, analíticas, etc.) se lee en cada página: se guarda 1 minuto
// para no ir hasta la base del depósito en cada visita. Si la consulta falla no se guarda nada.
const configuracionTienda = unstable_cache(async () => {
  const { data, error } = await createPublicClient().from('store_settings').select('key,value');
  if (error) throw new Error('store_settings: ' + error.message);
  const settings: Record<string, string> = {};
  data?.forEach((d) => { if (d.value) settings[d.key] = d.value; });
  return settings;
}, ['store-settings-v1'], { revalidate: 60 });
const leerConfiguracion = () => configuracionTienda().catch(() => ({} as Record<string, string>));

export async function generateMetadata(): Promise<Metadata> {
  const settings = await leerConfiguracion();
  // Admite que pegaron el código solo, o la etiqueta <meta ...> completa que da Meta.
  const raw = settings.meta_domain_verification || '';
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
  const settings = await leerConfiguracion();

  return (
    <html lang="es">
      <body className="antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
        <AnalyticsScripts ga4Id={settings.ga4_measurement_id} pixelId={settings.facebook_pixel_id} clarityId={settings.clarity_project_id} />
        <PageViewTracker />
        <Header settings={settings} />
        <main className="min-h-screen">{children}</main>
        <Footer settings={settings} />
        <WhatsAppButton />
        <InstagramButton />
      </body>
    </html>
  );
}
