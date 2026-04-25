'use client';

/**
 * SampleVehicles — landing-page client component (US-6).
 *
 * Spec ref:
 *   - docs/spec.md > Frontend > components/SampleVehicles.tsx
 *   - docs/prd.md > First Impression and Discovery > US-6
 *
 * Three preset cards covering the grade range. Clicking a card runs the same
 * submit flow as InputForm — builds the slug via `encodeQuery`, calls
 * `router.push`. The cards do NOT short-cut to a static result; the demo's
 * credibility depends on the live API path being the demo path.
 *
 * Card lineup (locked in checklist item 7 swap from 2018 Camry → 2023 RAV4):
 *   - 2007 Honda Civic / 180,000 mi / $4,500   → expects F (airbag-era recalls)
 *   - 2014 Volkswagen Passat / 150,000 mi / $9,500 → expects C (multi-cat recalls)
 *   - 2023 Toyota RAV4 / 30,000 mi / $32,000   → expects B (modern, clean record)
 *
 * Design lens: bordered cards only, no gradients, no images, no shadows beyond
 * the single border. Matches InputForm's restrained design language.
 *
 * Cut policy (per US-6): first feature dropped if Day 4 runs late. Removal
 * path: delete `<SampleVehicles />` from `app/page.tsx` and delete this file.
 */

import {useRouter} from 'next/navigation';
import {encodeQuery} from '@/lib/slug';

type Sample = {
  year: number;
  make: string;
  model: string;
  mileage: number;
  price: number;
};

const SAMPLES: readonly Sample[] = [
  {year: 2007, make: 'Honda', model: 'Civic', mileage: 180000, price: 4500},
  {year: 2014, make: 'Volkswagen', model: 'Passat', mileage: 150000, price: 9500},
  {year: 2023, make: 'Toyota', model: 'RAV4', mileage: 30000, price: 32000},
] as const;

export default function SampleVehicles() {
  const router = useRouter();

  const onSelect = (s: Sample) => {
    const slug = encodeQuery({year: s.year, make: s.make, model: s.model});
    router.push(`/profile/${slug}?mi=${s.mileage}&p=${s.price}`);
  };

  return (
    <section aria-labelledby="samples-heading" className="max-w-3xl mx-auto">
      <h2
        id="samples-heading"
        className="text-lg font-semibold text-gray-800 text-center mb-6"
      >
        Try a sample
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLES.map((s) => (
          <button
            key={`${s.year}-${s.make}-${s.model}`}
            type="button"
            onClick={() => onSelect(s)}
            className="border border-gray-200 rounded p-5 bg-white text-left hover:border-gray-400 transition-colors cursor-pointer"
          >
            <div className="text-base font-medium text-gray-900">
              {s.year} {s.make} {s.model}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {s.mileage.toLocaleString()} mi · ${s.price.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-3 underline">
              View sample →
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
