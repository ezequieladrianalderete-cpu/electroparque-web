export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  const statusMap: Record<string,string> = { pending:'⏱ Pendiente', paid:'💳 Pagado', processing:'🔧 Procesando', shipped:'📦 Enviado', delivered:'✅ Entregado', cancelled:'❌ Cancelado' };
  const statusColor: Record<string,string> = { pending:'bg-yellow-100 text-yellow-800', paid:'bg-blue-100 text-blue-800', shipped:'bg-purple-100 text-purple-800', delivered:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Pedidos</h1>
        <span className="text-sm text-gray-500">({(orders||[]).length} total)</span>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        {(orders||[]).length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p className="text-lg">No hay pedidos todavía</p></div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                {['#','Cliente','Total','Estado','Fecha'].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y">
                {(orders||[]).map((o:any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-ep-navy font-bold">#{o.order_number}</td>
                    <td className="px-4 py-3"><p className="font-medium">{o.customer_name}</p><p className="text-xs text-gray-400">{o.customer_email}</p></td>
                    <td className="px-4 py-3 font-bold">${o.total?.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor[o.status]||'bg-gray-100'}`}>{statusMap[o.status]||o.status}</span></td>
                    <td className="px-4 py-3 text-gray-400">{new Date(o.created_at).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
