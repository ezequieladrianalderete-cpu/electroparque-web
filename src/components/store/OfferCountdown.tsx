'use client';
import { useState, useEffect } from 'react';

export function OfferCountdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60),
        expired: false,
      };
    };
    setTime(calc());
    const interval = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (time.expired) return null;

  if (compact) {
    return (
      <p className="text-ep-red text-[11px] font-bold flex items-center gap-1">
        ⏱ Termina en {time.d > 0 && `${time.d}d `}{String(time.h).padStart(2, '0')}h {String(time.m).padStart(2, '0')}m {String(time.s).padStart(2, '0')}s
      </p>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-white/60 text-xs mb-2">⏱ Termina en:</p>
      <div className="flex gap-2">
        {[
          [time.d, 'días'],
          [time.h, 'hs'],
          [time.m, 'min'],
          [time.s, 'seg'],
        ].map(([val, label]) => (
          <div key={label as string} className="text-center">
            <div className="bg-white/20 backdrop-blur-sm text-white font-bold text-lg px-3 py-2 rounded-lg min-w-[44px] shadow-inner">
              {String(val).padStart(2, '0')}
            </div>
            <div className="text-white/50 text-[9px] mt-1 font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
