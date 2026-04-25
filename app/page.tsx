/**
 * Landing page — `app/page.tsx`.
 *
 * Spec ref: docs/spec.md > Frontend > Landing Page.
 *
 * Server-component shell. Renders the InputForm inside a calm, restrained
 * single-column layout. SampleVehicles is intentionally NOT rendered here yet
 * — that's checklist item 10.
 */
import InputForm from '@/components/InputForm';

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
      </div>
    </main>
  );
}
