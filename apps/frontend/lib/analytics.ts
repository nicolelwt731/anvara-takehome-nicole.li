import { useEffect } from 'react';

declare const gtag: (
  command: 'event' | 'config' | 'set',
  targetId: string | { [key: string]: unknown },
  config?: { [key: string]: unknown }
) => void;

export const isGAEnabled = (): boolean => {
  return typeof window !== 'undefined' && typeof gtag !== 'undefined';
};

type EventParams = {
  [key: string]: string | number | boolean | undefined;
};

export const trackEvent = (eventName: string, eventParams?: EventParams): void => {
  if (!isGAEnabled()) return;
  try {
    gtag('event', eventName, {
      ...eventParams,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('GA4 tracking error:', error);
    }
  }
};

export const trackMicroConversion = (eventName: string, params?: EventParams): void => {
  trackEvent(eventName, { conversion_level: 'micro', ...params });
};

export const trackMacroConversion = (eventName: string, params?: EventParams): void => {
  trackEvent(eventName, { conversion_level: 'macro', ...params });
};

export function useConversionTrack(
  level: 'micro' | 'macro',
  eventName: string,
  params?: EventParams,
  deps: readonly unknown[] = []
): void {
  const track = level === 'macro' ? trackMacroConversion : trackMicroConversion;
  useEffect(() => {
    track(eventName, params);
  }, deps);
}

export const trackButtonClick = (
  buttonName: string,
  location?: string,
  additionalParams?: EventParams
): void => {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
    ...additionalParams,
  });
};

export const trackFormSubmit = (
  formName: string,
  formType: 'create' | 'update' | 'delete',
  success: boolean,
  additionalParams?: EventParams
): void => {
  trackEvent('form_submit', {
    form_name: formName,
    form_type: formType,
    success,
    ...additionalParams,
  });
};

export const trackNavigation = (
  destination: string,
  source?: string,
  additionalParams?: EventParams
): void => {
  trackEvent('page_view', {
    page_path: destination,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    source,
    ...additionalParams,
  });
};

export const trackUserEngagement = (
  action: 'login' | 'logout' | 'signup',
  userRole?: 'sponsor' | 'publisher',
  additionalParams?: EventParams
): void => {
  trackEvent('user_engagement', {
    engagement_type: action,
    user_role: userRole,
    ...additionalParams,
  });
};

export const trackMarketplaceEvent = (
  eventType: 'view_listing' | 'book_placement' | 'unbook_placement' | 'view_detail',
  listingId?: string,
  listingType?: string,
  additionalParams?: EventParams
): void => {
  trackEvent('marketplace_interaction', {
    interaction_type: eventType,
    listing_id: listingId,
    listing_type: listingType,
    ...additionalParams,
  });
};

export const trackManagementEvent = (
  action: 'create' | 'update' | 'delete',
  resourceType: 'campaign' | 'ad_slot',
  resourceId?: string,
  additionalParams?: EventParams
): void => {
  trackEvent('resource_management', {
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ...additionalParams,
  });
};
