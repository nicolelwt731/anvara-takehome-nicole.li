'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdSlots } from '@/lib/api';
import { trackMarketplaceEvent, trackButtonClick, trackMicroConversion } from '@/lib/analytics';
import { getImageByCategory } from '@/lib/utils';
import { ABSlotCard } from './ab-slot-card';

const typeColors: Record<string, string> = {
  DISPLAY: 'bg-[--color-primary]/20 text-[--color-primary]',
  VIDEO: 'bg-red-500/20 text-red-400',
  NEWSLETTER: 'bg-purple-500/20 text-purple-400',
  PODCAST: 'bg-orange-500/20 text-orange-400',
  NATIVE: 'bg-green-500/20 text-green-400',
};

interface AdSlot {
  id: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  isAvailable: boolean;
  publisher?: {
    name: string;
  };
  imageUrl?: string;
}

interface AdSlotGridProps {
  filter?: string;
  searchQuery?: string;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (value != null && typeof (value as { toString: () => string }).toString === 'function') {
    return parseFloat((value as { toString: () => string }).toString()) || 0;
  }
  return 0;
}

export function AdSlotGrid({ filter = 'all', searchQuery = '' }: AdSlotGridProps) {
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getAdSlots()
      .then((raw) => {
        if (cancelled) return;
        const list = Array.isArray(raw) ? raw : [];
        const slots: AdSlot[] = list.map((item: unknown) => {
          const i = item as Record<string, unknown>;
          return {
            id: String(i.id ?? ''),
            name: String(i.name ?? ''),
            description: i.description != null ? String(i.description) : undefined,
            type: String(i.type ?? ''),
            basePrice: toNumber(i.basePrice),
            isAvailable: Boolean(i.isAvailable),
            publisher: (i.publisher as { name?: string } | undefined)?.name
              ? { name: (i.publisher as { name: string }).name }
              : undefined,
            imageUrl: getImageByCategory(String(i.type ?? ''), String(i.name ?? '')),
          };
        });
        setAdSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load marketplace');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSlots = adSlots.filter((slot) => {
    const matchesFilter =
      filter === 'all' || slot.type === filter || (filter === 'In-Venue' && slot.type === 'VIDEO');
    const matchesSearch =
      !searchQuery.trim() ||
      slot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (slot.publisher?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      slot.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-[--color-border] bg-[--color-card] p-4"
          >
            <div className="mb-2 h-4 w-3/4 rounded bg-[--color-card-hover]" />
            <div className="mb-2 h-3 w-full rounded bg-[--color-card-hover]" />
            <div className="mb-2 h-3 w-5/6 rounded bg-[--color-card-hover]" />
            <div className="mt-3 h-4 w-1/2 rounded bg-[--color-card-hover]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in rounded-lg border-2 border-red-500/50 bg-red-500/10 p-6 text-center">
        <div className="mb-2 text-4xl">⚠️</div>
        <h3 className="mb-2 text-lg font-semibold text-red-400">Unable to load marketplace</h3>
        <p className="mb-4 text-red-300">{error}</p>
      </div>
    );
  }

  if (adSlots.length === 0) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-dashed border-[--color-border] bg-[--color-card] p-12 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-xl font-semibold text-white">No ad slots available</h3>
        <p className="text-[--color-muted]">
          Check back later or create an account to list your own ad slots
        </p>
      </div>
    );
  }

  if (filteredSlots.length === 0) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-dashed border-[--color-border] bg-[--color-card] p-12 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-xl font-semibold text-white">No matching placements</h3>
        <p className="text-[--color-muted]">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredSlots.map((slot) => (
        <ABSlotCard key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
