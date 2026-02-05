'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackNavigation, useConversionTrack } from '@/lib/analytics';

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  useEffect(() => {
    trackNavigation(fullPath, document.referrer);
  }, [pathname, searchParams]);

  useConversionTrack(
    'micro',
    'page_view',
    { page_path: fullPath, page_location: typeof window !== 'undefined' ? window.location.href : '' },
    [pathname, searchParams]
  );

  return null;
}
