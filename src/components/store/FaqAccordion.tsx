'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Faq } from '@/types';

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {faqs.map(faq => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="border rounded-xl overflow-hidden">
            <button onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-sm text-gray-900">{faq.question}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
