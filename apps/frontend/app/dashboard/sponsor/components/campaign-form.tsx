'use client';

import React, { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCampaign, updateCampaign } from '../actions';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trackFormSubmit, trackManagementEvent } from '@/lib/analytics';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  status?: string;
}

interface CampaignFormProps {
  campaign?: Campaign;
  onClose: () => void;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
    </button>
  );
}

export function CampaignForm({ campaign, onClose }: CampaignFormProps) {
  const isEditing = Boolean(campaign);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>(
    campaign ? campaign.startDate.split('T')[0] : ''
  );

  const action = isEditing
    ? updateCampaign.bind(null, campaign!.id)
    : createCampaign;

  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      // Track form submission success
      trackFormSubmit('campaign_form', isEditing ? 'update' : 'create', true, {
        campaign_id: campaign?.id,
      });
      
      // Track management event
      trackManagementEvent(isEditing ? 'update' : 'create', 'campaign', campaign?.id);
      
      onClose();
      setTimeout(() => {
        router.replace('/dashboard/sponsor');
      }, 100);
    } else if (state.error) {
      // Track form submission failure
      trackFormSubmit('campaign_form', isEditing ? 'update' : 'create', false, {
        campaign_id: campaign?.id,
        error: state.error,
      });
    }
  }, [state.success, state.error, isEditing, campaign?.id, onClose, router]);

  const formatDateForInput = (dateString: string) => {
    return dateString ? dateString.split('T')[0] : '';
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            ✕
          </button>
        </div>

        {state.error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-600">
            {state.error}
          </div>
        )}

        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={campaign?.name}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {state.fieldErrors?.name && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={campaign?.description}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
              Budget ($) *
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              min="0"
              step="0.01"
              defaultValue={campaign?.budget}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {state.fieldErrors?.budget && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.budget}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ colorScheme: 'light' }}
                required
              />
              {state.fieldErrors?.startDate && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.startDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                defaultValue={campaign ? formatDateForInput(campaign.endDate) : ''}
                min={startDate || campaign ? formatDateForInput(campaign?.startDate || '') : new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ colorScheme: 'light' }}
                required
              />
              {state.fieldErrors?.endDate && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={campaign?.status}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <SubmitButton isEditing={isEditing} />
          </div>
        </form>
      </div>
    </div>
  );
}
