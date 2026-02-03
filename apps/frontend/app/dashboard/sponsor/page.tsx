import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/auth-helpers';
import { CampaignList } from './components/campaign-list';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

async function getCampaigns(sponsorId: string) {
  try {
    const res = await fetch(`${API_URL}/api/campaigns?sponsorId=${sponsorId}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch campaigns');
    }
    return await res.json();
  } catch {
    return [];
  }
}

export default async function SponsorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'sponsor') {
    redirect('/');
  }

  const campaigns = roleData.sponsorId ? await getCampaigns(roleData.sponsorId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
      </div>

      <CampaignList campaigns={campaigns} />
    </div>
  );
}
