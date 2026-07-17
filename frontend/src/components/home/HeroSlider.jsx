'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/contexts/LangContext';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

/** Brand-consistent hero slides — copy + imagery aligned with the rest of the site */
const brandSlides = [
  {
    image_url:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1200&fit=crop&auto=format',
    title: 'Wear Your Confidence',
    title_sw: 'Vaa Ujasiri Wako',
    subtitle:
      'Clean essentials and confident everyday style — made for Tanzania and beyond.',
    subtitle_sw:
      'Nguo za kila siku zenye ubora na ujasiri — zilizotengenezwa kwa Tanzania na zaidi.',
    button_text: 'Shop Collection',
    button_text_sw: 'Nunua Mkusanyiko',
    link: '/products',
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1200&fit=crop&auto=format',
    title: 'Fashion With Purpose',
    title_sw: 'Mitindo Yenye Kusudi',
    subtitle:
      'More than clothes — a reminder to believe in the blessings already within you.',
    subtitle_sw:
      'Zaidi ya nguo — ukumbusho wa kuamini baraka ambazo tayari zipo ndani yako.',
    button_text: 'Our Story',
    button_text_sw: 'Hadithi Yetu',
    link: '/about',
  },
  {
    image_url:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1920&h=1200&fit=crop&auto=format',
    title: 'Everyday Essentials',
    title_sw: 'Muhimu wa Kila Siku',
    subtitle:
      'Hoodies, tees, trousers and more — curated pieces that move with your life.',
    subtitle_sw:
      'Hoodie, tishati, suruali na zaidi — vipande vilivyochaguliwa kwa maisha yako.',
    button_text: 'Explore Now',
    button_text_sw: 'Gundua Sasa',
    link: '/products',
  },
];

export default function HeroSlider() {
  const { lang } = useLang();
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
  const title = lang === 'sw' && slide.title_sw ? slide.title_sw : slide.title;
  const subtitle =
    lang === 'sw' && slide.subtitle_sw ? slide.subtitle_sw : slide.subtitle;
  const btnText =
    lang === 'sw' && slide.button_text_sw
      ? slide.button_text_sw
      : slide.button_text;
  const heroImage = imageFailed
    ? brandSlides[0].image_url
    : slide.image_url;

  return (
    <section
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-stone-900"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6.5, ease: 'easeOut' }}
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
              onError={() => setImageFailed(true)}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-5 pb-16 pt-28 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current}-copy`}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="mb-5 font-display text-sm font-semibold tracking-[0.28em] text-white/90 uppercase sm:text-base">
              BelieveinaBlessed
            </p>

            <h1 className="font-display text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-[0.92] tracking-tight text-white">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
                {subtitle}
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={slide.link || '/products'}
                className="inline-flex items-center gap-2 bg-white px-6 py-3.5 text-sm font-semibold tracking-tight text-neutral-950 transition hover:bg-teal-700 hover:text-white"
              >
                {btnText || 'Shop Collection'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/affiliate"
                className="inline-flex items-center gap-2 border border-white/40 px-6 py-3.5 text-sm font-medium tracking-tight text-white transition hover:border-white hover:bg-white/10"
              >
                Become an Affiliate
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <div className="mt-12 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-px transition-all duration-500 ${
                    i === current
                      ? 'w-10 bg-white'
                      : 'w-5 bg-white/35 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="flex h-11 w-11 items-center justify-center border border-white/30 text-white transition hover:border-white hover:bg-white/10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                className="flex h-11 w-11 items-center justify-center border border-white/30 text-white transition hover:border-white hover:bg-white/10"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-2 hidden font-display text-sm tracking-[0.18em] text-white/70 sm:inline">
                {String(current + 1).padStart(2, '0')} /{' '}
                {String(slides.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
