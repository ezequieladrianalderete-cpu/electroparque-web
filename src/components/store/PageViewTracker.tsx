'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logEvent } from '@/lib/track';

export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    logEvent('page_view');
  }, [pathname]);
  return null;
}
