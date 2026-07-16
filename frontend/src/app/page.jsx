// app/page.jsx - Full updated
'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import HeroSlider from '@/components/home/HeroSlider';
import TrendingSection from '@/components/home/TrendingSection';
import AllProductsSection from '@/components/home/AllProductsSection';
import GenderCardsSection from '@/components/home/GenderCardsSection';

function HomeContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)]">
      <Navbar />

      <div className="pt-14 sm:pt-16">
        <HeroSlider />
      </div>

      <div className="space-y-2 sm:space-y-4">
        <TrendingSection refCode={ref} />
        <GenderCardsSection />
        <AllProductsSection refCode={ref} />
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)] pt-16 flex items-center justify-center"><div className="text-[var(--text-secondary)]">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}
