// app/page.jsx
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
import BrandStorySection from '@/components/home/BrandStorySection';

function HomeContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-20 md:pb-0">
      <Navbar />
      <HeroSlider />
      <TrendingSection refCode={ref} />
      <GenderCardsSection />
      <AllProductsSection refCode={ref} />
      <BrandStorySection />
      <Footer />
      <BottomNav />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="font-display text-sm tracking-[0.2em] text-[var(--text-secondary)] uppercase">
            Loading
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
