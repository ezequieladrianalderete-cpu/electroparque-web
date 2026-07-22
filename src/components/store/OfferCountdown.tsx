'use client';
import { useState, useEffect } from 'react';

export function OfferCountdown({ endsAt }: { endsAt: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };
    setTime(calc());
    const interval = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (time.expired) return <p className="text-red-300 text-xs font-bold">⏱ Oferta finalizada</p>;

  return (
    <div>
      <p className="text-white/60 text-xs mb-2">⏱ Termina en:</p>
      <div className="flex gap-2">
        {[
          [time.d, 'días'],
          [time.h, 'hs'],
          [time.m, 'min'],
          [time.s, 'seg'],
        ].map(([val, label]) => (
          <div key={label as string} className="text-center">
            <div className="bg-white/15 text-white font-bold text-lg px-2.5 py-1.5 rounded-lg min-w-[40px]">
              {String(val).padStart(2, '0')}
            </div>
            <div className="text-white/40 text-[9px] mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
