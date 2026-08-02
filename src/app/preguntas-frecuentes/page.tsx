export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { FaqAccordion } from '@/components/store/FaqAccordion';
import type { Faq } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Respuestas a las dudas más comunes sobre envíos, pagos, garantía y nuestros productos.',
};

export default async function PreguntasFrecuentesPage() {
  const supabase = await createClient();
  const { data: faqs } = await supabase.from('faqs').select('*').is('product_id', null).eq('is_active', true).order('sort_order');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-ep-navy mb-2 text-center">Preguntas frecuentes</h1>
      <p className="text-gray-500 text-center mb-10">Las dudas más comunes de nuestros clientes</p>
      {faqs && faqs.length > 0 ? (
        <FaqAccordion faqs={faqs as unknown as Faq[]} />
      ) : (
        <p className="text-center text-gray-400 py-10">Todavía no hay preguntas cargadas.</p>
      )}
    </div>
  );
}
