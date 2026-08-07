'use client';
import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface DateRange { from: Date; to: Date; label: string }

const PRESETS = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: '7d', label: 'Últimos 7 días', days: 7 },
  { key: '30d', label: 'Últimos 30 días', days: 30 },
  { key: '90d', label: 'Últimos 90 días', days: 90 },
];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

export function defaultRange(): DateRange {
  return { from: startOfDay(new Date(Date.now() - 30 * 86400000)), to: endOfDay(new Date()), label: 'Últimos 30 días' };
}

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const pick = (preset: typeof PRESETS[number]) => {
    onChange({ from: startOfDay(new Date(Date.now() - preset.days * 86400000)), to: endOfDay(new Date()), label: preset.label });
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const label = `${new Date(customFrom).toLocaleDateString('es-AR')} a ${new Date(customTo).toLocaleDateString('es-AR')}`;
    onChange({ from: startOfDay(new Date(customFrom + 'T00:00:00')), to: endOfDay(new Date(customTo + 'T00:00:00')), label });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-ep-navy transition-colors">
        <Calendar className="w-4 h-4 text-gray-400" /> {value.label} <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-20 overflow-hidden">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => pick(p)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors">
                {p.label} {value.label === p.label && <span className="text-ep-navy font-bold">✓</span>}
              </button>
            ))}
            <div className="border-t p-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Rango personalizado</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Desde</label>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input-field text-xs w-full px-2 py-1.5" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Hasta</label>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input-field text-xs w-full px-2 py-1.5" />
                </div>
              </div>
              <button onClick={applyCustom} disabled={!customFrom || !customTo} className="w-full bg-ep-navy text-white text-xs font-bold py-2 rounded-lg hover:bg-ep-navy-light transition-colors disabled:opacity-40">Aplicar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
