export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { Shield, Truck, Award, MessageCircle } from 'lucide-react';

export default async function NosotrosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('key,value').in('key', ['about_title', 'about_subtitle', 'about_history_1', 'about_history_2']);
  const settings: Record<string, string> = {};
  (data || []).forEach(d => { if (d.value) settings[d.key] = d.value; });

  const title = settings.about_title || 'Electro Parque';
  const subtitle = settings.about_subtitle || 'Importación y distribución de tecnología de punta';
  const history1 = settings.about_history_1 || 'Somos una empresa argentina dedicada a la importación y distribución de tecnología de alta calidad. Nacimos de la pasión por conectar a los motociclistas argentinos con la mejor tecnología disponible.';
  const history2 = settings.about_history_2 || 'Cada producto que vendemos pasa por un riguroso proceso de selección para garantizar calidad, durabilidad y tecnología de vanguardia.';

  return (<div>
    <div className="bg-gradient-to-br from-ep-navy to-ep-navy-light text-white py-16 px-4 text-center">
      <h1 className="text-4xl font-extrabold mb-3">{title}</h1>
      <p className="text-blue-200 text-lg">{subtitle}</p>
    </div>
    <section className="max-w-4xl mx-auto px-4 py-14">
      <h2 className="text-2xl font-bold text-ep-navy mb-4">Nuestra historia</h2>
      <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-line">{history1}</p>
      <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">{history2}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[[Shield,'Productos originales'],[Truck,'Envío a todo el país'],[Award,'Garantía 12 meses'],[MessageCircle,'Soporte WhatsApp']].map(([Icon,title]:any)=>(
          <div key={title} className="text-center p-4 bg-gray-50 rounded-xl"><Icon className="w-8 h-8 text-ep-navy mx-auto mb-2"/><p className="text-sm font-semibold">{title}</p></div>
        ))}
      </div>
    </section>
  </div>);
}
