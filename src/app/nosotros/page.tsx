import { Shield, Truck, Award, MessageCircle } from 'lucide-react';
export default function NosotrosPage() {
  return (<div>
    <div className="bg-gradient-to-br from-ep-navy to-ep-navy-light text-white py-16 px-4 text-center">
      <h1 className="text-4xl font-extrabold mb-3">Electro Parque</h1>
      <p className="text-blue-200 text-lg">Importación y distribución de tecnología de punta</p>
    </div>
    <section className="max-w-4xl mx-auto px-4 py-14">
      <h2 className="text-2xl font-bold text-ep-navy mb-4">Nuestra historia</h2>
      <p className="text-gray-600 leading-relaxed mb-4">Somos una empresa argentina dedicada a la importación y distribución de tecnología de alta calidad. Nacimos de la pasión por conectar a los motociclistas argentinos con la mejor tecnología disponible.</p>
      <p className="text-gray-600 leading-relaxed mb-8">Cada producto que vendemos pasa por un riguroso proceso de selección para garantizar calidad, durabilidad y tecnología de vanguardia.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[[Shield,'Productos originales'],[Truck,'Envío a todo el país'],[Award,'Garantía 12 meses'],[MessageCircle,'Soporte WhatsApp']].map(([Icon,title]:any)=>(
          <div key={title} className="text-center p-4 bg-gray-50 rounded-xl"><Icon className="w-8 h-8 text-ep-navy mx-auto mb-2"/><p className="text-sm font-semibold">{title}</p></div>
        ))}
      </div>
    </section>
  </div>);
}
