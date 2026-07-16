'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSlides } from '@/lib/api';

export default function HeroSlider() {
  const { lang } = useLang();
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      const { data } = await getSlides();
      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides);
      } else {
        setSlides([]);
      }
    } catch (error) {
      console.error('Failed to load slides:', error);
      setSlides([]);
    }
  };

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = () => {
    if (slides.length === 0) return;
    setCurrent(c => (c - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!isAutoPlay || slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isAutoPlay, slides.length]);

  useEffect(() => {
    setImageFailed(false);
  }, [current]);

  const fallbackSlide = {
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&h=1200&fit=crop&auto=format',
    title: 'Wear Your Confidence',
    subtitle: 'We are dedicated to creating high-quality, trendy, and versatile apparel that fits your lifestyle.',
    button_text: 'Shop Now',
    link: '/products',
  };

  const activeSlides = slides.length > 0 ? slides : [fallbackSlide];
  const slide = activeSlides[current] || activeSlides[0];
  const title = lang === 'sw' && slide.title_sw ? slide.title_sw : slide.title;
  const subtitle = lang === 'sw' && slide.subtitle_sw ? slide.subtitle_sw : slide.subtitle;
  const btnText = lang === 'sw' && slide.button_text_sw ? slide.button_text_sw : slide.button_text;
  const heroImage = imageFailed || !slide.image_url ? fallbackSlide.image_url : slide.image_url;

  return (
    <div
      className="relative bg-[var(--bg)]"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
        <div className="relative min-h-[560px] overflow-hidden rounded-[28px] bg-[#d8d4cf] sm:min-h-[680px] lg:min-h-[760px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={heroImage}
                alt={title}
                fill
                priority={current === 0}
                sizes="100vw"
                className="object-cover object-center"
                quality={90}
                onError={(e) => {
                  setImageFailed(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-black/4 to-white/5" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/24 via-transparent to-black/10" />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={current + '-content'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative z-10 flex min-h-[560px] flex-col justify-between p-5 sm:min-h-[680px] sm:p-10 lg:min-h-[760px] lg:p-14"
            >
              <div className="flex items-start justify-between gap-5">
                {subtitle && (
                  <p className="max-w-xs text-base font-medium leading-6 text-neutral-950 sm:text-lg dark:text-white">
                    {subtitle}
                  </p>
                )}
                {activeSlides.length > 1 && (
                  <div className="hidden gap-1.5 rounded-full bg-white/60 px-3 py-2 backdrop-blur sm:flex">
                    {activeSlides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`h-2 w-2 rounded-full transition ${i === current ? 'bg-neutral-950' : 'bg-neutral-950/25'}`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <Link href={slide.link || '/products'} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-950 hover:text-white">
                  {btnText || 'Shop Now'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <h1 className="max-w-3xl text-right font-display text-5xl font-semibold leading-[0.95] text-white drop-shadow-xl sm:text-7xl lg:text-8xl">
                  {title.includes(' ') ? (
                    <>
                      {title.split(' ').slice(0, -1).join(' ')}{' '}
                      <span className="italic">{title.split(' ').slice(-1)}</span>
                    </>
                  ) : (
                    title
                  )}
                </h1>
              </div>
            </motion.div>
          </AnimatePresence>

          {activeSlides.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-neutral-950 backdrop-blur transition hover:bg-white sm:left-6"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-neutral-950 backdrop-blur transition hover:bg-white sm:right-6"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {activeSlides.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/60 px-3 py-2 backdrop-blur sm:hidden">
              {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
                    className={`h-2 w-2 rounded-full transition ${i === current ? 'bg-neutral-950' : 'bg-neutral-950/25'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
