'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const floatingImages = [
  {
    src: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=500&h=420&fit=crop&auto=format',
    className: 'left-4 top-6 h-24 w-32 sm:left-14 sm:top-10 sm:h-32 sm:w-40',
    alt: 'Man in sunglasses wearing casual outerwear',
  },
  {
    src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=460&h=460&fit=crop&auto=format',
    className: 'right-6 top-0 h-24 w-24 sm:right-28 sm:h-32 sm:w-32',
    alt: 'Portrait in natural light',
  },
  {
    src: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=560&h=440&fit=crop&auto=format',
    className: 'left-1/2 top-44 h-36 w-44 -translate-x-1/2 sm:top-52 sm:h-44 sm:w-56',
    alt: 'Woman wearing a soft white blouse',
  },
  {
    src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=420&h=420&fit=crop&auto=format',
    className: 'bottom-10 right-12 h-20 w-20 sm:bottom-16 sm:right-56 sm:h-24 sm:w-24',
    alt: 'Fashion portrait with hat',
  },
];

export default function EditorialStorySection() {
  return (
    <section className="mx-auto max-w-[1500px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="relative min-h-[560px] overflow-hidden bg-white">
        {floatingImages.map((image) => (
          <div key={image.src} className={`absolute overflow-hidden rounded-lg shadow-sm ${image.className}`}>
            <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="240px" />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[390px] max-w-3xl items-center justify-center px-4 pt-24 text-center sm:pt-28">
          <h2 className="font-display text-4xl font-medium leading-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            We are a clothing brand<br />
            <span className="italic">where style meets confidence,</span><br />
            crafted just for you.
          </h2>
        </div>

        <p className="absolute bottom-16 left-4 max-w-xs font-display text-sm italic text-neutral-950 sm:left-16">
          Transform Your Look With Our Must-Own Styles.
        </p>
      </div>

      <div className="relative mt-8 min-h-[360px] overflow-hidden rounded-[24px] bg-neutral-200 sm:min-h-[430px]">
        <Image
          src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1600&h=800&fit=crop&auto=format"
          alt="Woman in white shirt for fashion campaign"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
        <div className="relative z-10 flex min-h-[360px] max-w-lg flex-col justify-center p-6 text-white sm:min-h-[430px] sm:p-10">
          <h3 className="font-display text-4xl leading-tight sm:text-5xl">
            Shop Now & Express<br />
            <span className="italic">Your Style!</span>
          </h3>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
            Discover the perfect blend of comfort and style with our exclusive collection.
          </p>
          <Link href="/products" className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white">
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
