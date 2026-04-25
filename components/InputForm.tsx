'use client';

/**
 * InputForm — landing-page client component.
 *
 * Spec ref:
 *   - docs/spec.md > Frontend > components/InputForm.tsx
 *   - docs/prd.md > Entering a Vehicle > US-1, US-1a
 *
 * Responsibilities:
 *   1. Five controlled fields in render order: Year, Make, Model, Mileage, Price.
 *   2. Cascading-dropdown state machine:
 *        - Make disabled until Year is set.
 *        - Model disabled until Year + Make are set AND modelsState === 'ready'.
 *        - Evaluate disabled until Year + Make + Model are all set.
 *   3. Fetches `/api/models?year=&make=` whenever Year + Make change to a
 *      non-empty pair. In-flight requests are aborted when inputs change again.
 *   4. On fetch failure, the Model dropdown shows a single disabled option
 *      reading "Couldn't load models — try again". The dropdown stays disabled
 *      until the user changes Year or Make, which triggers a retry by virtue
 *      of the effect re-running.
 *   5. Submit handler builds the slug via `encodeQuery` and navigates to
 *      `/profile/{slug}?mi=&p=`. Mileage defaults to 0 (US-1a "did-not-provide"
 *      signal); price is optional and rendered as `?p=` (empty) when blank.
 *
 * Design lens (Steve's "calmly authoritative"): max-width container, generous
 * spacing, no gradients, no shadows beyond a single soft border, no flashy
 * colors. Standard rounded corners (~2-3px), monochrome palette.
 */

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {TOP_50_MAKES} from '@/lib/makes';
import {availableYears} from '@/lib/years';
import {encodeQuery} from '@/lib/slug';

type ModelsState = 'idle' | 'loading' | 'ready' | 'error';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const fieldClass =
  'w-full rounded border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400';

export default function InputForm() {
  const router = useRouter();

  const [year, setYear] = useState<number | ''>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [mileage, setMileage] = useState<number>(0);
  const [price, setPrice] = useState<string>('');

  const [models, setModels] = useState<string[]>([]);
  const [modelsState, setModelsState] = useState<ModelsState>('idle');

  const years = availableYears();

  // Effect: fetch model list whenever year+make are both set. Abort prior
  // request when inputs change. Reset modelsState to 'idle' if either input
  // is empty.
  useEffect(() => {
    if (year === '' || make === '') {
      setModels([]);
      setModelsState('idle');
      setModel('');
      return;
    }

    const controller = new AbortController();
    setModelsState('loading');
    setModel('');
    setModels([]);

    const url = `/api/models?year=${encodeURIComponent(String(year))}&make=${encodeURIComponent(make)}`;

    fetch(url, {signal: controller.signal})
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as {models?: string[]};
        if (!Array.isArray(json.models)) throw new Error('bad-shape');
        if (controller.signal.aborted) return;
        setModels(json.models);
        setModelsState('ready');
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        if (controller.signal.aborted) return;
        setModels([]);
        setModelsState('error');
      });

    return () => {
      controller.abort();
    };
  }, [year, make]);

  const canSubmit = year !== '' && make !== '' && model !== '';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const slug = encodeQuery({year: Number(year), make, model});
    const mi = Number.isFinite(mileage) ? mileage : 0;
    const p = price.trim() ? Number(price) : '';
    const url = `/profile/${slug}?mi=${mi}&p=${p}`;
    router.push(url);
  };

  // First-option text for the Model select varies by state.
  const modelPlaceholder =
    modelsState === 'error'
      ? "Couldn't load models — try again"
      : modelsState === 'loading'
        ? 'Loading models...'
        : modelsState === 'idle'
          ? 'Loading models...'
          : 'Model';

  const modelDisabled = !(year !== '' && make !== '' && modelsState === 'ready');

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto p-6 sm:p-8 space-y-5 border border-gray-200 rounded bg-white"
    >
      {/* Year */}
      <div>
        <label htmlFor="year" className={labelClass}>
          Year
        </label>
        <select
          id="year"
          name="year"
          className={fieldClass}
          value={year === '' ? '' : String(year)}
          onChange={(e) => {
            const v = e.target.value;
            setYear(v === '' ? '' : Number(v));
            setMake('');
            setModel('');
          }}
        >
          <option value="" disabled>
            Year
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Make */}
      <div>
        <label htmlFor="make" className={labelClass}>
          Make
        </label>
        <select
          id="make"
          name="make"
          className={fieldClass}
          value={make}
          disabled={year === ''}
          onChange={(e) => {
            setMake(e.target.value);
            setModel('');
          }}
        >
          <option value="" disabled>
            Make
          </option>
          {TOP_50_MAKES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Model */}
      <div>
        <label htmlFor="model" className={labelClass}>
          Model
        </label>
        <select
          id="model"
          name="model"
          className={fieldClass}
          value={model}
          disabled={modelDisabled}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="" disabled>
            {modelPlaceholder}
          </option>
          {modelsState === 'ready' &&
            models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
        </select>
      </div>

      {/* Mileage */}
      <div>
        <label htmlFor="mileage" className={labelClass}>
          Mileage (miles)
        </label>
        <input
          id="mileage"
          name="mileage"
          type="number"
          min="0"
          step="1"
          className={fieldClass}
          value={mileage}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') {
              setMileage(0);
              return;
            }
            const n = Number(v);
            if (Number.isFinite(n) && n >= 0) setMileage(Math.floor(n));
          }}
        />
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className={labelClass}>
          Price (USD, optional)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="100"
          className={fieldClass}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded bg-gray-900 text-white py-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Evaluate
      </button>
    </form>
  );
}
