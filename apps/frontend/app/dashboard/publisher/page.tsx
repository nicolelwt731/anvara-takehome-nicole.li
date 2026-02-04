import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/auth-helpers';
import { AdSlotList } from './components/ad-slot-list';

// eslint-disable-next-line no-undef
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

async function getAdSlots(publisherId: string) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    const res = await fetch(`${API_URL}/api/ad-slots?publisherId=${publisherId}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch ad slots');
    }
    return await res.json();
  } catch {
    return [];
  }
}

export default async function PublisherDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'publisher') {
    redirect('/');
  }

  const adSlots = roleData.publisherId ? await getAdSlots(roleData.publisherId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Ad Slots</h1>
      </div>

      <AdSlotList adSlots={adSlots} />
    </div>
  );
}
