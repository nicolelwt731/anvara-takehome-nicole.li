import { AdSlotGrid } from './components/ad-slot-grid';
import { NewsletterSignup } from '../components/newsletter-signup';

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-[--color-muted]">Browse available ad slots from our publishers.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <AdSlotGrid />
        </div>
        <div className="space-y-4">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
