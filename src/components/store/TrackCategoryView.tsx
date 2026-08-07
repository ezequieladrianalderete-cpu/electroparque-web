'use client';
import { useEffect, useRef } from 'react';
import { logEvent } from '@/lib/track';

export function TrackCategoryView({ categoryId }: { categoryId: string }) {
  const tracked = useRef('');
  useEffect(() => {
    if (tracked.current === categoryId) return;
    tracked.current = categoryId;
    logEvent('view_category', { category_id: categoryId });
  }, [categoryId]);
  return null;
}
