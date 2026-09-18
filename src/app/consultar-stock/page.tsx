'use client';
import { useEffect, useRef, useState } from 'react';
import { PackageSearch, Send } from 'lucide-react';

type Msg = { role: 'user' | 'bot'; texto: string };

const STOCK_API_URL = 'https://db.electroparque.com/functions/v1/ask-stock-public';
const STOCK_API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function ConsultarStockPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function enviar() {
    const texto = input.trim();
    if (!texto || loading) return;
    const historial = messages.slice(-8);
    setMessages((m) => [...m, { role: 'user', texto }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(STOCK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: STOCK_API_KEY, Authorization: `Bearer ${STOCK_API_KEY}` },
        body: JSON.stringify({ question: texto, historial }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'bot', texto: data.answer || data.error || 'No pude responder, probá de nuevo.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', texto: 'Error de conexión, probá de nuevo en un rato.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-2">
        <PackageSearch className="w-6 h-6 text-ep-navy" />
        <h1 className="text-2xl font-extrabold text-gray-900">Consultá el stock</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Preguntanos si tenemos disponible el producto que buscás. Para precios y formas de pago, mirá la publicación de Mercado Libre o escribinos por WhatsApp.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[60vh]">
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Ej: &quot;¿Tenés joystick para PS5?&quot;</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'bot' ? 'bg-gray-100 text-gray-800' : 'bg-ep-navy text-white'
                }`}
              >
                {m.texto}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-2 text-sm">Buscando...</div>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 p-3 flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Escribí tu consulta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                enviar();
              }
            }}
          />
          <button
            onClick={enviar}
            disabled={loading}
            className="bg-ep-red hover:bg-ep-red-dark text-white rounded-lg px-4 py-2 flex items-center gap-1 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
