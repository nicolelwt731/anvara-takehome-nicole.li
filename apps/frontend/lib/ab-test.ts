import { useState, useEffect } from 'react';
import { trackEvent } from './analytics';

const STORAGE_PREFIX = 'anvara_ab_';
const DEBUG_PARAM = 'ab_override';

function getStorageKey(testName: string): string {
  return `${STORAGE_PREFIX}${testName}`;
}

function getDebugVariant(testName: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const override = params.get(`${DEBUG_PARAM}_${testName}`);
  return override || params.get(DEBUG_PARAM);
}

function assignVariant(variants: string[], weights?: number[]): string {
  if (weights && weights.length === variants.length) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < variants.length; i++) {
      r -= weights[i];
      if (r <= 0) return variants[i];
    }
  }
  return variants[Math.floor(Math.random() * variants.length)];
}

export function getABVariant(
  testName: string,
  options: {
    variants?: string[];
    weights?: number[];
  } = {}
): string {
  const variants = options.variants ?? ['A', 'B'];
  const debug = getDebugVariant(testName);
  if (debug && variants.includes(debug)) return debug;

  if (typeof window === 'undefined') return variants[0];
  const key = getStorageKey(testName);
  const stored = localStorage.getItem(key);
  if (stored && variants.includes(stored)) return stored;

  const variant = assignVariant(variants, options.weights);
  localStorage.setItem(key, variant);
  trackEvent('ab_test_assignment', {
    test_name: testName,
    variant,
    timestamp: Date.now(),
  });
  return variant;
}

export function useABTest(
  testName: string,
  options: {
    variants?: string[];
    weights?: number[];
  } = {}
): string {
  const [variant, setVariant] = useState<string>(() => {
    if (typeof window === 'undefined') return options.variants?.[0] ?? 'A';
    return getABVariant(testName, options);
  });

  useEffect(() => {
    setVariant(getABVariant(testName, options));
  }, [testName]);
  return variant;
}

export function clearABTest(testName: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey(testName));
}

export function clearAllABTests(): void {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
