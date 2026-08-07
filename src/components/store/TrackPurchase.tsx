'use client';
import { useEffect, useRef } from 'react';
import { trackPurchase } from '@/lib/analytics';

interface OrderForTracking {
  id: string;
  order_number: string;
  total: number;
  items: { product_id: string; name: string; price: number; quantity: number }[];
}

export function TrackPurchase({ order }: { order: OrderForTracking }) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackPurchase(order);
  }, [order]);
  return null;
}
