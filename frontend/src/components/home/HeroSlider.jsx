'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const brandSlides = [
  {
    desktop: '/hero/slide-1.png',
    mobile: '/hero/slide-1-mobile.png',
    alt: 'BelieveinaBlessed black tank and shorts set',
  },
  {
    desktop: '/hero/slide-2.png',
    mobile: '/hero/slide-2-mobile.png',
    alt: 'BelieveinaBlessed white tee and cap',
  },
  {
    desktop: '/hero/slide-3.jpg',
    mobile: '/hero/slide-3-mobile.jpg',
    alt: 'BelieveinaBlessed collection',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const slides = brandSlides;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = () => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!isAutoPlay || slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, isAutoPlay, slides.length]);

  useEffect(() => {
    setImageFailed(false);
  }, [current]);

  const slide = slides[current] || slides[0];
  const fallback = brandSlides[0];
  const desktopSrc = imageFailed ? fallback.desktop : slide.desktop;
  const mobileSrc = imageFailed ? fallback.mobile : slide.mobile;

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-neutral-900 pt-16 lg:pt-[72px]"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <div className="relative h-[calc(100svh-4rem)] w-full lg:h-[calc(100svh-72px)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={mobileSrc}
            alt={slide.alt || 'BelieveinaBlessed'}
            fill
            priority={current === 0}
            sizes="100vw"
            className="object-cover object-center md:hidden"
            quality={90}
            onError={() => setImageFailed(true)}
          />
          <Image
            src={desktopSrc}
            alt={slide.alt || 'BelieveinaBlessed'}
            fill
            priority={current === 0}
            sizes="100vw"
            className="hidden object-contain object-center md:block"
            quality={90}
            onError={() => setImageFailed(true)}
          />
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="pointer-events-auto flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-1 transition-all duration-500 ${
                  i === current ? 'w-8 bg-white' : 'w-4 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
