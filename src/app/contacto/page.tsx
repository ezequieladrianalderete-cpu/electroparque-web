'use client';
import { MessageCircle, Mail, MapPin, Clock } from 'lucide-react';
export default function ContactoPage() {
  return (<div className="max-w-4xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold text-ep-navy text-center mb-2">Contacto</h1>
    <p className="text-gray-500 text-center mb-10">Estamos para ayudarte. Respondemos en menos de 24 horas.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[[MessageCircle,'WhatsApp','+54 11 3884-8412','https://wa.me/541138848412','text-green-600','bg-green-50'],
          [Mail,'Email','contacto@electroparque.com','mailto:contacto@electroparque.com','text-blue-600','bg-blue-50'],
          [MapPin,'Ubicación','Morón, Buenos Aires',null,'text-ep-red','bg-red-50'],
          [Clock,'Horario','Lun–Sáb 9:00 a 20:00 hs',null,'text-purple-600','bg-purple-50'],
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
        <a href="https://wa.me/541138848412" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#20BB5A] text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2">
          <MessageCircle className="w-5 h-5"/>Ir al WhatsApp
        </a>
      </div>
    </div>
  </div>);
}
