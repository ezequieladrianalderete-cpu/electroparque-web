'use client';
import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHANGE_PASSWORD_PATH = '/admin/cambiar-password';

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const settle = (session: any) => {
      if (!session) { router.replace('/admin/login'); return; }
      if (session.user.user_metadata?.must_change_password && pathname !== CHANGE_PASSWORD_PATH) {
        router.replace(CHANGE_PASSWORD_PATH); return;
      }
      setUser(session.user);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => settle(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin/login');
      else settle(session);
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return { supabase, user, loading };
}
