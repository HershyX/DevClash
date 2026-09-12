import { Hero } from './Hero';
import { Features } from './Features';
import { CTA } from './CTA';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <Hero />
      <Features />
      <CTA />
    </div>
  );
}