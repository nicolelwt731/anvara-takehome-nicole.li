'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdSlots } from '@/lib/api';
import { trackMarketplaceEvent, trackButtonClick, trackMicroConversion } from '@/lib/analytics';
import { getImageByCategory } from '@/lib/utils';

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
        <Link
          key={slot.id}
          href={`/marketplace/${slot.id}`}
          onClick={() => {
            trackButtonClick('View Listing', 'marketplace_grid', {
              listing_id: slot.id,
              listing_type: slot.type,
              listing_name: slot.name,
            });
            trackMicroConversion('cta_click', {
              cta_name: 'view_listing',
              listing_id: slot.id,
              listing_type: slot.type,
            });
            trackMarketplaceEvent('view_listing', slot.id, slot.type, {
              listing_name: slot.name,
              base_price: slot.basePrice,
              is_available: slot.isAvailable,
            });
          }}
          className="group block rounded-lg border border-[--color-border] bg-[--color-card] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[--color-primary]/30 hover:shadow-lg"
        >
          <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-md bg-gray-800">
            {slot.imageUrl ? (
              <img
                src={slot.imageUrl}
                alt={slot.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-600">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            <div className="absolute right-2 top-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  typeColors[slot.type] || 'bg-[--color-card-hover] text-[--color-muted]'
                }`}
              >
                {slot.type}
              </span>
            </div>
          </div>

          <div className="mb-2 flex items-start justify-between">
            <h3 className="font-semibold text-white">{slot.name}</h3>
          </div>

          {slot.publisher && (
            <p className="mb-2 text-sm text-[--color-muted]">by {slot.publisher.name}</p>
          )}

          {slot.description && (
            <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{slot.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  slot.isAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`text-sm ${
                  slot.isAvailable ? 'text-green-400' : 'text-[--color-muted]'
                }`}
              >
                {slot.isAvailable ? 'Available' : 'Booked'}
              </span>
            </div>
            <span className="text-lg font-bold text-white">
              ${Number(slot.basePrice).toLocaleString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
