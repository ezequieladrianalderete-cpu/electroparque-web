'use client';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, total } = useCart();
  if (items.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-2xl mb-2">🛒</p><p className="text-gray-600 font-medium">Tu carrito está vacío</p>
      <Link href="/productos" className="mt-4 inline-block bg-ep-navy text-white px-6 py-2.5 rounded-xl text-sm font-bold">Ver productos</Link>
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Finalizar compra</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-bold mb-4">Datos de envío</h2>
            {[['Nombre *','text'],['Email *','email'],['Teléfono *','tel'],['Dirección *','text'],['Ciudad *','text'],['Código Postal *','text']].map(([l,t])=>(
              <div key={l} className="mb-3"><label className="label">{l}</label><input type={t} className="input-field"/></div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl p-5 sticky top-20">
            <h2 className="font-bold mb-4">Resumen</h2>
            {items.map((item,i)=>(
              <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
                <span className="text-gray-600">{item.product.name} ×{item.quantity}</span>
                <span className="font-bold">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-4 pt-3 border-t">
              <span>Total</span><span className="text-ep-navy">{formatPrice(total())}</span>
            </div>
            <a href={`https://wa.me/541138848412?text=${encodeURIComponent('Hola! Quiero realizar una compra por ' + formatPrice(total()))}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full bg-ep-red hover:bg-ep-red-dark text-white font-bold py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2 text-center block">
              💬 Comprar por WhatsApp
            </a>
            <p className="text-xs text-gray-400 text-center mt-2">Te redirigimos a WhatsApp para finalizar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
