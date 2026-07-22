import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';

export const metadata: Metadata = {
  title: { default: 'Electro Parque — Tecnología de punta', template: '%s | Electro Parque' },
  description: 'Importación y distribución de tecnología. Carplay para moto y más.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased" style={{ fontFamily: "system-ui, sans-serif" }}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
