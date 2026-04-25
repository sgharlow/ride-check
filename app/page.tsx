/**
 * Landing page — `app/page.tsx`.
 *
 * Spec ref: docs/spec.md > Frontend > Landing Page.
 *
 * Server-component shell. Renders InputForm + SampleVehicles inside a calm,
 * restrained single-column layout. SampleVehicles (US-6) is the first feature
 * cuttable per the prd cut policy — to drop it, delete the import + element
 * below and delete `components/SampleVehicles.tsx`.
 */
import InputForm from '@/components/InputForm';
import SampleVehicles from '@/components/SampleVehicles';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <header className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            RideCheck
          </h1>
          <p className="text-gray-600">
            Public-data risk profile for any used car.
          </p>
        </header>
        <InputForm />
        <div className="my-8 border-t border-gray-200" />
        <SampleVehicles />
      </div>
    </main>
  );
}
