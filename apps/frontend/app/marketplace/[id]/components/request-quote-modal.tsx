'use client';

import type React from 'react';
import { useState } from 'react';
import { requestQuote, type QuoteRequestPayload } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

type Props = {
  adSlotId: string;
  adSlotName: string;
  onClose: () => void;
};

export function RequestQuoteModal({ adSlotId, adSlotName, onClose }: Props) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [goals, setGoals] = useState('');
  const [timeline, setTimeline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [quoteId, setQuoteId] = useState<string | null>(null);

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!companyName.trim()) {
      setStatus('error');
      setMessage('Company name is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    const payload: QuoteRequestPayload = {
      email: email.trim(),
      companyName: companyName.trim(),
      adSlotId,
      adSlotName,
      phone: phone.trim() || undefined,
      budget: budget.trim() || undefined,
      goals: goals.trim() || undefined,
      timeline: timeline.trim() || undefined,
      requirements: requirements.trim() || undefined,
    };

    try {
      const result = await requestQuote(payload);
      if (result.success) {
        setStatus('success');
        setQuoteId(result.quoteId);
        setMessage('Your request has been sent. We will get back to you soon.');
        setCompanyName('');
        setEmail('');
        setPhone('');
        setBudget('');
        setGoals('');
        setTimeline('');
        setRequirements('');
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    }
  };

  const disabled = status === 'loading';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Request a Quote</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[--color-muted]"
          >
            Close
          </button>
        </div>
        <p className="mb-4 text-sm text-[--color-muted]">
          Tell us a bit about your campaign and we will follow up with a custom quote for
          <span className="font-semibold"> {adSlotName}</span>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="quote-company"
                className="mb-1 block text-sm font-medium text-[--color-foreground]"
              >
                Company name
              </label>
              <input
                id="quote-company"
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
                disabled={disabled}
                required
              />
            </div>
            <div>
              <label
                htmlFor="quote-email"
                className="mb-1 block text-sm font-medium text-[--color-foreground]"
              >
                Contact email
              </label>
              <input
                id="quote-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
                disabled={disabled}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="quote-phone"
                className="mb-1 block text-sm font-medium text-[--color-foreground]"
              >
                Phone (optional)
              </label>
              <input
                id="quote-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
                disabled={disabled}
              />
            </div>
            <div>
              <label
                htmlFor="quote-budget"
                className="mb-1 block text-sm font-medium text-[--color-foreground]"
              >
                Estimated budget
              </label>
              <input
                id="quote-budget"
                type="text"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="$5,000 / month"
                className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
                disabled={disabled}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="quote-goals"
              className="mb-1 block text-sm font-medium text-[--color-foreground]"
            >
              Campaign goals
            </label>
            <input
              id="quote-goals"
              type="text"
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              placeholder="Brand awareness, lead generation, etc."
              className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
              disabled={disabled}
            />
          </div>
          <div>
            <label
              htmlFor="quote-timeline"
              className="mb-1 block text-sm font-medium text-[--color-foreground]"
            >
              Timeline
            </label>
            <input
              id="quote-timeline"
              type="text"
              value={timeline}
              onChange={(event) => setTimeline(event.target.value)}
              placeholder="Example: Q3 2026, 3-month campaign"
              className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
              disabled={disabled}
            />
          </div>
          <div>
            <label
              htmlFor="quote-requirements"
              className="mb-1 block text-sm font-medium text-[--color-foreground]"
            >
              Special requirements
            </label>
            <textarea
              id="quote-requirements"
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              rows={4}
              placeholder="Share any details that will help us price this placement for you."
              className="w-full rounded-md border border-[--color-border] px-3 py-2 text-[--color-foreground] shadow-sm focus:border-[--color-primary] focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
              disabled={disabled}
            />
          </div>
          {message && (
            <p
              className={`text-sm ${
                status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {quoteId && status === 'success'
                ? `${message} Reference ID: ${quoteId}.`
                : message}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[--color-border] px-4 py-2 text-sm text-[--color-foreground]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-md bg-[--color-primary] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending...' : 'Send quote request'}
            </button>
          </div>
          <p className="pt-1 text-xs text-[--color-muted]">
            Typical response time: within 2 business days.
          </p>
        </form>
      </div>
    </div>
  );
}

