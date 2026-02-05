'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCampaign } from '../actions';
import { CampaignForm } from './campaign-form';
import { trackManagementEvent, trackButtonClick } from '@/lib/analytics';

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description?: string;
    budget: number;
    spent: number;
    status: string;
    startDate: string;
    endDate: string;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const progress =
    campaign.budget > 0 ? (Number(campaign.spent) / Number(campaign.budget)) * 100 : 0;

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return;
    }

    // Track button click
    trackButtonClick('Delete Campaign', 'campaign_card', {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
    });

    startTransition(async () => {
      const result = await deleteCampaign(campaign.id);
      if (result.error) {
        setError(result.error);
      } else {
        // Track successful deletion
        trackManagementEvent('delete', 'campaign', campaign.id, {
          campaign_name: campaign.name,
        });
        router.replace('/dashboard/sponsor');
      }
    });
  };

  return (
    <>
      <div className="rounded-lg border border-[--color-border] p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold">{campaign.name}</h3>
          <span
            className={`rounded px-2 py-0.5 text-xs ${statusColors[campaign.status] || 'bg-gray-100'}`}
          >
            {campaign.status}
          </span>
        </div>

        {campaign.description && (
          <p className="mb-3 text-sm text-[--color-muted] line-clamp-2">{campaign.description}</p>
        )}

        <div className="mb-2">
          <div className="flex justify-between text-sm">
            <span className="text-[--color-muted]">Budget</span>
            <span>
              ${Number(campaign.spent).toLocaleString()} / ${Number(campaign.budget).toLocaleString()}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-[--color-primary]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="mb-3 text-xs text-[--color-muted]">
          {new Date(campaign.startDate).toLocaleDateString()} -{' '}
          {new Date(campaign.endDate).toLocaleDateString()}
        </div>

        {error && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              trackButtonClick('Edit Campaign', 'campaign_card', {
                campaign_id: campaign.id,
              });
              setShowEditForm(true);
            }}
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
        <CampaignForm
          campaign={campaign}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </>
  );
}
