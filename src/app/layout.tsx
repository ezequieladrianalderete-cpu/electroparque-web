import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';

export const metadata: Metadata = {
  title: { default: 'Electro Parque — Tecnología de punta', template: '%s | Electro Parque' },
  description: 'Importación y distribución de tecnología. Carplay para moto y más.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app'),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('key,value');
  const settings: Record<string, string> = {};
  data?.forEach(d => { if (d.value) settings[d.key] = d.value; });

  return (
    <html lang="es">
      <body className="antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
        <Header settings={settings} />
        <main className="min-h-screen">{children}</main>
        <Footer settings={settings} />
        <WhatsAppButton />
      </body>
    </html>
  );
}
