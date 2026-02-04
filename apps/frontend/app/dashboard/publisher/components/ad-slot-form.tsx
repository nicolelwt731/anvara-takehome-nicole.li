'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createAdSlot, updateAdSlot } from '../actions';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AdSlot {
  id: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  width?: number;
  height?: number;
  isAvailable: boolean;
}

interface AdSlotFormProps {
  adSlot?: AdSlot;
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
      {pending ? 'Saving...' : isEditing ? 'Update Ad Slot' : 'Create Ad Slot'}
    </button>
  );
}

export function AdSlotForm({ adSlot, onClose }: AdSlotFormProps) {
  const isEditing = Boolean(adSlot);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const action = isEditing
    ? updateAdSlot.bind(null, adSlot!.id)
    : createAdSlot;

  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      onClose();
      router.replace('/dashboard/publisher');
    }
  }, [state.success, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Ad Slot' : 'Create New Ad Slot'}
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
              Ad Slot Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={adSlot?.name}
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
              defaultValue={adSlot?.description}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Ad Slot Type *
            </label>
            <select
              id="type"
              name="type"
              defaultValue={adSlot?.type}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select a type</option>
              <option value="DISPLAY">Display</option>
              <option value="VIDEO">Video</option>
              <option value="NATIVE">Native</option>
              <option value="NEWSLETTER">Newsletter</option>
              <option value="PODCAST">Podcast</option>
            </select>
            {state.fieldErrors?.type && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.type}</p>
            )}
          </div>

          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
              Base Price ($) *
            </label>
            <input
              type="number"
              id="basePrice"
              name="basePrice"
              min="0"
              step="0.01"
              defaultValue={adSlot?.basePrice}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {state.fieldErrors?.basePrice && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.basePrice}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                Width (px)
              </label>
              <input
                type="number"
                id="width"
                name="width"
                min="0"
                defaultValue={adSlot?.width}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                Height (px)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                min="0"
                defaultValue={adSlot?.height}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                value="true"
                defaultChecked={adSlot?.isAvailable}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                Available for booking
              </label>
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
