'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdSlot } from '@/lib/api';
import { authClient } from '@/auth-client';
import { deleteAdSlot } from '@/app/dashboard/publisher/actions';
import { AdSlotForm } from '@/app/dashboard/publisher/components/ad-slot-form';

interface AdSlot {
  id: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  isAvailable: boolean;
  width?: number;
  height?: number;
  publisher?: {
    id: string;
    name: string;
    website?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface RoleInfo {
  role: 'sponsor' | 'publisher' | null;
  sponsorId?: string;
  publisherId?: string;
  name?: string;
}

const typeColors: Record<string, string> = {
  DISPLAY: 'bg-blue-100 text-blue-700',
  VIDEO: 'bg-red-100 text-red-700',
  NEWSLETTER: 'bg-purple-100 text-purple-700',
  PODCAST: 'bg-orange-100 text-orange-700',
};

interface Props {
  id: string;
}

export function AdSlotDetail({ id }: Props) {
  const [adSlot, setAdSlot] = useState<AdSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [unbookError, setUnbookError] = useState<string | null>(null);
  const [isUnbooking, setIsUnbooking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch ad slot
    getAdSlot(id)
      .then((data) => setAdSlot(data as AdSlot))
      .catch(() => setError('Failed to load ad slot details'))
      .finally(() => setLoading(false));

    // Check user session and fetch role
    authClient
      .getSession()
      .then(({ data }) => {
        if (data?.user) {
          const sessionUser = data.user as User;
          setUser(sessionUser);

          // Fetch role info from backend
          // eslint-disable-next-line no-undef
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';
          fetch(`${apiUrl}/api/auth/role/${sessionUser.id}`)
            .then((res) => res.json())
            .then((data) => setRoleInfo(data))
            .catch(() => setRoleInfo(null))
            .finally(() => setRoleLoading(false));
        } else {
          setRoleLoading(false);
        }
      })
      .catch(() => setRoleLoading(false));
  }, [id]);

  const handleBooking = async () => {
    if (!roleInfo?.sponsorId || !adSlot) return;

    setBooking(true);
    setBookingError(null);

    try {
      // eslint-disable-next-line no-undef
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';
      const response = await fetch(
        `${apiUrl}/api/ad-slots/${adSlot.id}/book`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sponsorId: roleInfo.sponsorId,
            message: message || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book placement');
      }

      setBookingSuccess(true);
      setAdSlot({ ...adSlot, isAvailable: false });
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to book placement');
    } finally {
      setBooking(false);
    }
  };

  const handleUnbook = async () => {
    if (!adSlot) return;

    setUnbookError(null);
    setIsUnbooking(true);

    try {
      // eslint-disable-next-line no-undef
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';
      const response = await fetch(
        `${apiUrl}/api/ad-slots/${adSlot.id}/unbook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reset booking' }));
        throw new Error(errorData.error || 'Failed to reset booking');
      }

      setBookingSuccess(false);
      setAdSlot({ ...adSlot, isAvailable: true });
      setMessage('');
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset booking';
      setUnbookError(errorMessage);
    } finally {
      setIsUnbooking(false);
    }
  };

  const handleDelete = async () => {
    if (!adSlot) return;

    if (!confirm(`Are you sure you want to delete "${adSlot.name}"? This action cannot be undone.`)) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteAdSlot(adSlot.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        router.push('/dashboard/publisher');
      }
    });
  };

  const isOwner = roleInfo?.role === 'publisher' && adSlot?.publisher?.id === roleInfo?.publisherId;

  if (loading) {
    return <div className="py-12 text-center text-[--color-muted]">Loading...</div>;
  }

  if (error || !adSlot) {
    return (
      <div className="space-y-4">
        <Link href="/marketplace" className="text-[--color-primary] hover:underline">
          ← Back to Marketplace
        </Link>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          {error || 'Ad slot not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/marketplace" className="text-[--color-primary] hover:underline">
        ← Back to Marketplace
      </Link>

      <div className="rounded-lg border border-[--color-border] p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{adSlot.name}</h1>
            {adSlot.publisher && (
              <p className="text-[--color-muted]">
                by {adSlot.publisher.name}
                {adSlot.publisher.website && (
                  <>
                    {' '}
                    ·{' '}
                    <a
                      href={adSlot.publisher.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[--color-primary] hover:underline"
                    >
                      {adSlot.publisher.website}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
          <span className={`rounded px-3 py-1 text-sm ${typeColors[adSlot.type] || 'bg-gray-100'}`}>
            {adSlot.type}
          </span>
        </div>

        {adSlot.description && <p className="mb-6 text-[--color-muted]">{adSlot.description}</p>}

        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <div>
            <span
              className={`text-sm font-medium ${adSlot.isAvailable ? 'text-green-600' : 'text-[--color-muted]'}`}
            >
              {adSlot.isAvailable ? '● Available' : '○ Currently Booked'}
            </span>
            {!adSlot.isAvailable && !bookingSuccess && isOwner && (
              <button
                onClick={handleUnbook}
                disabled={isUnbooking}
                className="ml-3 text-sm text-[--color-primary] underline hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnbooking ? 'Resetting...' : 'Reset listing'}
              </button>
            )}
            {unbookError && (
              <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {unbookError}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[--color-primary]">
              ${Number(adSlot.basePrice).toLocaleString()}
            </p>
            <p className="text-sm text-[--color-muted]">per month</p>
          </div>
        </div>

        {isOwner && (
          <div className="mt-4 border-t border-[--color-border] pt-4">
            <h3 className="mb-2 text-sm font-semibold text-[--color-muted]">Owner Actions</h3>
            {deleteError && (
              <div className="mb-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit Ad Slot
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded border border-red-600 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Ad Slot'}
              </button>
            </div>
          </div>
        )}

        {adSlot.isAvailable && !bookingSuccess && (
          <div className="mt-6 border-t border-[--color-border] pt-6">
            <h2 className="mb-4 text-lg font-semibold">Request This Placement</h2>

            {roleLoading ? (
              <div className="py-4 text-center text-[--color-muted]">Loading...</div>
            ) : roleInfo?.role === 'sponsor' && roleInfo?.sponsorId ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[--color-muted]">
                    Your Company
                  </label>
                  <p className="text-[--color-foreground]">{roleInfo.name || user?.name}</p>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1 block text-sm font-medium text-[--color-muted]"
                  >
                    Message to Publisher (optional)
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the publisher about your campaign goals..."
                    className="w-full rounded-lg border border-[--color-border] bg-[--color-background] px-3 py-2 text-[--color-foreground] placeholder:text-[--color-muted] focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
                    rows={3}
                  />
                </div>
                {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full rounded-lg bg-[--color-primary] px-4 py-3 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {booking ? 'Booking...' : 'Book This Placement'}
                </button>
              </div>
            ) : (
              <div>
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-3 font-semibold text-gray-500"
                >
                  Request This Placement
                </button>
                <p className="mt-2 text-center text-sm text-[--color-muted]">
                  {user
                    ? 'Only sponsors can request placements'
                    : 'Log in as a sponsor to request this placement'}
                </p>
              </div>
            )}
          </div>
        )}

        {bookingSuccess && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="font-semibold text-green-800">Placement Booked!</h3>
            <p className="mt-1 text-sm text-green-700">
              Your request has been submitted. The publisher will be in touch soon.
            </p>
            <button
              onClick={handleUnbook}
              className="mt-3 text-sm text-green-700 underline hover:text-green-800"
            >
              Remove Booking (reset for testing)
            </button>
          </div>
        )}
      </div>

      {showEditForm && adSlot && (
        <AdSlotForm
          adSlot={{
            id: adSlot.id,
            name: adSlot.name,
            description: adSlot.description,
            type: adSlot.type,
            basePrice: adSlot.basePrice,
            width: adSlot.width,
            height: adSlot.height,
            isAvailable: adSlot.isAvailable,
          }}
          onClose={async () => {
            setShowEditForm(false);
            setLoading(true);
            try {
              const updated = await getAdSlot(id);
              setAdSlot(updated as AdSlot);
            } catch {
              // Error handled silently
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}
