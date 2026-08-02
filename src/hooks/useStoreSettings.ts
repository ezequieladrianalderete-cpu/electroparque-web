'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export const STORE_SETTINGS_DEFAULTS = {
  whatsapp_number: '541144128645',
  store_email: 'contacto@electroparque.com',
  store_location: '',
  store_name: 'Electro Parque',
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<Record<string, string>>(STORE_SETTINGS_DEFAULTS);

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.from('store_settings').select('key,value').then(({ data }) => {
      if (!data) return;
      setSettings(s => {
        const next = { ...s };
        data.forEach(d => { if (d.value) next[d.key] = d.value; });
        return next;
      });
    });
  }, []);

  return settings;
}
