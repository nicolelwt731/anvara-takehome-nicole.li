'use client';

import { useABTest } from '@/lib/ab-test';
import { trackButtonClick, trackMicroConversion, trackMarketplaceEvent } from '@/lib/analytics';
import { getImageByCategory } from '@/lib/utils';
import Link from 'next/link';

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

interface ABSlotCardProps {
  slot: AdSlot;
}

export function ABSlotCard({ slot }: ABSlotCardProps) {
  const ctaVariant = useABTest('marketplace-cta');

  const ctaText = ctaVariant === 'A' ? 'Request This Placement' : 'Get Started Now';

  const handleClick = () => {
    trackButtonClick('View Listing', 'marketplace_grid', {
      listing_id: slot.id,
      listing_type: slot.type,
      listing_name: slot.name,
      ab_variant: ctaVariant,
      cta_text: ctaText,
    });

    trackMicroConversion('cta_click', {
      cta_name: 'view_listing',
      listing_id: slot.id,
      listing_type: slot.type,
      ab_variant: ctaVariant,
      ab_test: 'marketplace-cta',
    });

    trackMarketplaceEvent('view_listing', slot.id, slot.type, {
      listing_name: slot.name,
      base_price: slot.basePrice,
      is_available: slot.isAvailable,
      ab_variant: ctaVariant,
      ab_test: 'marketplace-cta',
    });
  };

  return (
    <Link
      href={`/marketplace/${slot.id}`}
      onClick={handleClick}
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
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              typeColors[slot.type] || 'bg-[--color-card-hover] text-[--color-muted]'
            }`}
          >
            {slot.type}
          </span>
          {/* A/B test indicator (remove in production) */}
          <span className="rounded bg-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-300">
            [Test {ctaVariant}]
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

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${slot.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span
            className={`text-sm ${slot.isAvailable ? 'text-green-400' : 'text-[--color-muted]'}`}
          >
            {slot.isAvailable ? 'Available' : 'Booked'}
          </span>
        </div>
        <span className="text-lg font-bold text-white">
          ${Number(slot.basePrice).toLocaleString()}
        </span>
      </div>

      {/* CTA button with dynamic text based on A/B variant */}
      <button
        className="w-full rounded-lg bg-[--color-primary] py-2 font-medium text-white transition-colors hover:bg-[--color-primary]/90"
        onClick={(e) => {
          e.preventDefault();
          handleClick();
          window.location.href = `/marketplace/${slot.id}`;
        }}
      >
        {ctaText}
      </button>
    </Link>
  );
}
