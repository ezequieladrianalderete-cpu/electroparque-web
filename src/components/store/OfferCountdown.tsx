'use client';
import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export function OfferCountdown({ endsAt, compact = false, badge = false }: { endsAt: string; compact?: boolean; badge?: boolean }) {
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

  if (badge) {
    // Estilo tipo "oferta relámpago" de Mercado Libre: chip amarillo sobre la foto,
    // con horas:minutos:segundos en vez de las etiquetas "d/h/m/s".
    return (
      <div className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[11px] font-extrabold px-2 py-1 rounded-md shadow-sm flex items-center gap-1 tabular-nums leading-none">
        <Zap className="w-3 h-3 fill-white flex-shrink-0" />
        {time.d > 0 && `${time.d}d `}{String(time.h).padStart(2, '0')}:{String(time.m).padStart(2, '0')}:{String(time.s).padStart(2, '0')}
      </div>
    );
  }

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
