'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAdSlot } from '../actions';
import { AdSlotForm } from './ad-slot-form';

interface AdSlotCardProps {
  adSlot: {
    id: string;
    name: string;
    description?: string;
    type: string;
    basePrice: number;
    isAvailable: boolean;
    width?: number;
    height?: number;
  };
}

const typeColors: Record<string, string> = {
  DISPLAY: 'bg-blue-100 text-blue-700',
  VIDEO: 'bg-red-100 text-red-700',
  NEWSLETTER: 'bg-purple-100 text-purple-700',
  PODCAST: 'bg-orange-100 text-orange-700',
  NATIVE: 'bg-green-100 text-green-700',
};

export function AdSlotCard({ adSlot }: AdSlotCardProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${adSlot.name}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAdSlot(adSlot.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.replace('/dashboard/publisher');
      }
    });
  };

  return (
    <>
      <div className="rounded-lg border border-[--color-border] p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold">{adSlot.name}</h3>
          <span className={`rounded px-2 py-0.5 text-xs ${typeColors[adSlot.type] || 'bg-gray-100'}`}>
            {adSlot.type}
          </span>
        </div>

        {adSlot.description && (
          <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{adSlot.description}</p>
        )}

        {(adSlot.width || adSlot.height) && (
          <div className="mb-2 text-xs text-[--color-muted]">
            Dimensions: {adSlot.width || '?'} × {adSlot.height || '?'} px
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span
            className={`text-sm ${adSlot.isAvailable ? 'text-green-600' : 'text-[--color-muted]'}`}
          >
            {adSlot.isAvailable ? 'Available' : 'Booked'}
          </span>
          <span className="font-semibold text-[--color-primary]">
            ${Number(adSlot.basePrice).toLocaleString()}/mo
          </span>
        </div>

        {error && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex-1 rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {showEditForm && (
        <AdSlotForm
          adSlot={adSlot}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </>
  );
}
