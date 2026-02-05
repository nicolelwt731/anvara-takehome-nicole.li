'use client';

import type React from 'react';
import { useState } from 'react';
import { subscribeNewsletter, unsubscribeNewsletter } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';
type Mode = 'subscribe' | 'unsubscribe';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('subscribe');

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const action = mode === 'subscribe' ? subscribeNewsletter : unsubscribeNewsletter;
      const result = await action(email);
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    }
  };

  const disabled = status === 'loading';
  const isSubscribe = mode === 'subscribe';

  return (
    <section className="rounded-lg border border-[--color-border] bg-[--color-background] p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Stay in the loop</h2>
      <p className="mb-3 text-sm text-[--color-muted]">
        Get marketplace updates, new placement opportunities, and best practices in your inbox.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="newsletter-email"
            className="mb-1 block text-sm font-medium text-[--color-foreground]"
          >
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== 'idle') {
                setStatus('idle');
                setMessage('');
              }
            }}
            placeholder="you@example.com"
            className="w-full rounded-md border border-[--color-border] bg-white px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
            disabled={disabled}
            required
          />
        </div>
        {message && (
          <p
            className={`text-sm ${
              status === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-md bg-[--color-primary] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading'
            ? isSubscribe
              ? 'Subscribing...'
              : 'Unsubscribing...'
            : isSubscribe
              ? 'Subscribe to newsletter'
              : 'Unsubscribe from newsletter'}
        </button>
        <button
          type="button"
          className="w-full text-center text-xs text-[--color-muted] underline"
          onClick={() => {
            setMode(isSubscribe ? 'unsubscribe' : 'subscribe');
            setStatus('idle');
            setMessage('');
          }}
        >
          {isSubscribe ? 'Prefer not to receive emails? Unsubscribe' : 'Back to subscribe'}
        </button>
      </form>
    </section>
  );
}

