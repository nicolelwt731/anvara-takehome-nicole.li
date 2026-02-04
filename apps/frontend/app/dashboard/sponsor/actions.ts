'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// eslint-disable-next-line no-undef
const API_URL = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:4291';

interface FormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const cookieHeader = allCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  return {
    'Content-Type': 'application/json',
    ...(cookieHeader && { Cookie: cookieHeader }),
  };
}

export async function createCampaign(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const budget = formData.get('budget') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    const fieldErrors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      fieldErrors.name = 'Campaign name is required';
    }
    if (!budget || Number(budget) <= 0) {
      fieldErrors.budget = 'Budget must be greater than 0';
    }
    if (!startDate) {
      fieldErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      fieldErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      fieldErrors.endDate = 'End date must be after start date';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { fieldErrors };
    }

    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || undefined,
        budget: Number(budget),
        startDate,
        endDate,
        targetCategories: [],
        targetRegions: [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create campaign' }));
      return { error: errorData.error || `Failed to create campaign (${response.status})` };
    }

    await response.json();

    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateCampaign(
  campaignId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const budget = formData.get('budget') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const status = formData.get('status') as string;

    const fieldErrors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      fieldErrors.name = 'Campaign name is required';
    }
    if (!budget || Number(budget) <= 0) {
      fieldErrors.budget = 'Budget must be greater than 0';
    }
    if (!startDate) {
      fieldErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      fieldErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      fieldErrors.endDate = 'End date must be after start date';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { fieldErrors };
    }

    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || undefined,
        budget: Number(budget),
        startDate,
        endDate,
        status,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to update campaign' };
    }

    revalidatePath('/dashboard/sponsor');
    revalidatePath('/marketplace');
    return { success: true };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteCampaign(campaignId: string): Promise<FormState> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete campaign' };
    }

    revalidatePath('/dashboard/sponsor');
    revalidatePath('/marketplace');
    return { success: true };
  } catch {
    return { error: 'An unexpected error occurred' };
  }
}
