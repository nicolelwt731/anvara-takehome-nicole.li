'use client';

import React, { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCampaign, updateCampaign } from '../actions';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trackFormSubmit, trackManagementEvent } from '@/lib/analytics';
import { showToast } from '@/app/components/toast';
import { DatePicker } from '@/app/components/date-picker';

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
      className="rounded-lg bg-[--color-primary] px-6 py-2.5 font-semibold text-white transition-all duration-200 hover:bg-[--color-primary-hover] hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {pending ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
    </button>
  );
}

export function CampaignForm({ campaign, onClose }: CampaignFormProps) {
  const isEditing = Boolean(campaign);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const formatDateForInput = (dateString: string) =>
    dateString ? dateString.split('T')[0] : '';

  const [startDate, setStartDate] = useState<string>(
    campaign ? formatDateForInput(campaign.startDate) : ''
  );
  const [endDate, setEndDate] = useState<string>(
    campaign ? formatDateForInput(campaign.endDate) : ''
  );

  const action = isEditing ? updateCampaign.bind(null, campaign!.id) : createCampaign;

  const [state, formAction] = useActionState(action, {});

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setEndDate((prev) => (prev && value && prev < value ? value : prev));
  };

  useEffect(() => {
    if (state.success) {
      trackFormSubmit('campaign_form', isEditing ? 'update' : 'create', true, {
        campaign_id: campaign?.id,
      });
      trackManagementEvent(isEditing ? 'update' : 'create', 'campaign', campaign?.id);
      showToast(
        isEditing ? 'Campaign updated successfully!' : 'Campaign created successfully!',
        'success'
      );
      onClose();
      setTimeout(() => {
        router.replace('/dashboard/sponsor');
      }, 100);
    } else if (state.error) {
      trackFormSubmit('campaign_form', isEditing ? 'update' : 'create', false, {
        campaign_id: campaign?.id,
        error: state.error,
      });
      showToast(state.error || 'Failed to save campaign', 'error');
    }
  }, [state.success, state.error, isEditing, campaign?.id, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-[--color-card] border border-[--color-border] p-6 shadow-xl animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[--color-muted] transition-colors hover:bg-[--color-card-hover] hover:text-white"
            type="button"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {state.error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-600">
            {state.error}
          </div>
        )}

        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[--color-muted]">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={campaign?.name}
              className="mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-[--color-muted] shadow-sm transition-all duration-200 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
              required
            />
            {state.fieldErrors?.name && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[--color-muted]">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={campaign?.description}
              className="mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-[--color-muted] shadow-sm transition-all duration-200 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-[--color-muted]">
              Budget ($) *
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              min="0"
              step="0.01"
              defaultValue={campaign?.budget}
              className="mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-[--color-muted] shadow-sm transition-all duration-200 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
              required
            />
            {state.fieldErrors?.budget && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.budget}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-[--color-muted]">
                Start Date *
              </label>
              <input type="hidden" name="startDate" value={startDate} />
              <DatePicker
                id="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                min={new Date()}
                placeholder="Select start date"
                className="mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-[--color-muted] shadow-sm transition-all duration-200 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
                aria-label="Start date"
              />
              {state.fieldErrors?.startDate && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.startDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-[--color-muted]">
                End Date *
              </label>
              <input type="hidden" name="endDate" value={endDate} />
              <DatePicker
                id="endDate"
                value={endDate}
                onChange={setEndDate}
                min={
                  startDate
                    ? new Date(startDate + 'T12:00:00')
                    : new Date()
                }
                placeholder="Select end date"
                className="mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-[--color-muted] shadow-sm transition-all duration-200 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
                aria-label="End date"
              />
              {state.fieldErrors?.endDate && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-[--color-muted]">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={campaign?.status}
                className="mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white placeholder-[--color-muted] shadow-sm transition-all duration-200 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[--color-border] px-6 py-2.5 font-medium text-white transition-all duration-200 hover:bg-[--color-card-hover] hover:scale-105 active:scale-95"
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
