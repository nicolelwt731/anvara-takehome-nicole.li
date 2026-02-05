'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackNavigation, useConversionTrack } from '@/lib/analytics';

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullPath =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackNavigation(fullPath, document.referrer);
  }, [pathname, searchParams]);

  useConversionTrack(
    'micro',
    'page_view',
    {
      page_path:
        pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''),
      page_location: typeof window !== 'undefined' ? window.location.href : '',
    },
    [pathname, searchParams]
  );

  return null;
}
