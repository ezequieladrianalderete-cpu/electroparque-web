export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function GraciasPage() {
  const supabase = await createClient();
  const { data: waSetting } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
  const whatsappNumber = waSetting?.value || '541144128645';
  const waFormatted = whatsappNumber.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3-$4');

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6 animate-bounce">✅</div>
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent mb-4">¡Pedido registrado!</h1>
      <p className="text-gray-600 mb-2">Tu pedido fue guardado y te redirigimos a WhatsApp para coordinar el pago.</p>
      <p className="text-gray-400 text-sm mb-8">Si no se abrió WhatsApp, contactanos al <strong>{waFormatted}</strong></p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/productos" className="bg-gradient-to-r from-ep-navy to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">Seguir comprando</Link>
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" className="border-2 border-green-500 text-green-600 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors">💬 Abrir WhatsApp</a>
      </div>
    </div>
  );
}
