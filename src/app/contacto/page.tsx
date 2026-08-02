export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { MessageCircle, Mail, MapPin, Clock } from 'lucide-react';

export default async function ContactoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('key,value');
  const settings: Record<string, string> = {};
  (data || []).forEach(d => { if (d.value) settings[d.key] = d.value; });

  const wa = settings.whatsapp_number || '541144128645';
  const waFormatted = wa.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3-$4');
  const email = settings.store_email || 'contacto@electroparque.com';
  const location = settings.store_location || 'Argentina';
  const hours = settings.business_hours || 'Lun–Sáb 9:00 a 20:00 hs';

  return (<div className="max-w-4xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold text-ep-navy text-center mb-2">Contacto</h1>
    <p className="text-gray-500 text-center mb-10">Estamos para ayudarte. Respondemos en menos de 24 horas.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[[MessageCircle,'WhatsApp',waFormatted,`https://wa.me/${wa}`,'text-green-600','bg-green-50'],
          [Mail,'Email',email,`mailto:${email}`,'text-blue-600','bg-blue-50'],
          [MapPin,'Ubicación',location,null,'text-ep-red','bg-red-50'],
          [Clock,'Horario',hours,null,'text-purple-600','bg-purple-50'],
        ].map(([Icon,title,desc,href,color,bg]:any)=>(
          <div key={title} className="flex items-start gap-4 p-4 bg-white rounded-xl border">
            <div className={`p-3 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`}/></div>
            <div><p className="font-semibold text-sm">{title}</p>
              {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-ep-navy">{desc}</a> : <p className="text-sm text-gray-500">{desc}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-ep-navy text-white rounded-2xl p-6 flex flex-col justify-center items-center text-center">
        <p className="text-xl font-bold mb-2">💬 Respuesta rápida</p>
        <p className="text-blue-200 text-sm mb-4">La forma más rápida de contactarnos es por WhatsApp. Respondemos en minutos.</p>
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#20BB5A] text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2">
          <MessageCircle className="w-5 h-5"/>Ir al WhatsApp
        </a>
      </div>
    </div>
  </div>);
}
