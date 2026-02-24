import Hero from '@/components/landing/Hero';
import BentoGrid from '@/components/landing/BentoGrid';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import SmoothScroll from '@/components/SmoothScroll';
import ScrollProgress from '@/components/ScrollProgress';

export default function LandingPage() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <main className="min-h-screen bg-zinc-950">
        <Hero />
        <BentoGrid />
        <Testimonials />
        <CTA />
      </main>
    </SmoothScroll>
  );
}
