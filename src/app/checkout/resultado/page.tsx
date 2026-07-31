export const dynamic = 'force-dynamic';
import Link from 'next/link';

interface Props { searchParams: Promise<{ status?: string; order?: string }> }

export default async function ResultadoPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status || 'unknown';

  const config: Record<string, { icon: string; title: string; desc: string; color: string }> = {
    success: { icon: '✅', title: '¡Pago aprobado!', desc: 'Tu pago fue procesado correctamente. Te contactaremos para coordinar el envío.', color: 'text-green-600' },
    pending: { icon: '⏱', title: 'Pago pendiente', desc: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.', color: 'text-yellow-600' },
    failure: { icon: '❌', title: 'Pago rechazado', desc: 'Hubo un problema con tu pago. Podés intentar de nuevo o contactarnos por WhatsApp.', color: 'text-red-600' },
    unknown: { icon: '❓', title: 'Estado desconocido', desc: 'No pudimos verificar el estado de tu pago. Contactanos por WhatsApp.', color: 'text-gray-600' },
  };

  const c = config[status] || config.unknown;

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">{c.icon}</div>
      <h1 className={`text-3xl font-extrabold mb-4 ${c.color}`}>{c.title}</h1>
      <p className="text-gray-600 mb-8">{c.desc}</p>
      {params.order && <p className="text-sm text-gray-400 mb-6">Pedido: <span className="font-mono font-bold">{params.order.substring(0,8)}...</span></p>}
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/productos" className="bg-gradient-to-r from-ep-navy to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform">Seguir comprando</Link>
        <a href="https://wa.me/541144128645" target="_blank" className="border-2 border-green-500 text-green-600 font-bold px-6 py-3 rounded-xl hover:bg-green-50">💬 WhatsApp</a>
      </div>
    </div>
  );
}
