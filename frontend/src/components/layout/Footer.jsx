'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/contexts/LangContext';
import { ArrowRight, Instagram, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  const shopLinks = [
    { label: t('all_products'), href: '/products' },
    { label: t('trending'), href: '/products?trending=true' },
    { label: 'Affiliate Program', href: '/affiliate' },
    { label: t('competition'), href: '/competition' },
  ];

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: t('home'), href: '/' },
    { label: 'Track Order', href: '/track' },
  ];

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 pb-20 text-white md:pb-0">
      <div className="home-shell py-14 sm:py-16">
        <div className="mb-12 grid gap-10 border-b border-neutral-800 pb-12 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div>
            <Image
              src="/logo.png"
              alt="Believe in a Blessed"
              width={170}
              height={72}
              className="h-auto w-36 object-contain brightness-0 invert sm:w-40"
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
              Tanzania&apos;s modern fashion destination for clean, confident everyday style —
              built on faith, purpose, and self-belief.
            </p>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
              Stay in the loop
            </p>
            {subscribed ? (
              <p className="font-display text-lg font-semibold text-white">You&apos;re subscribed!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-11 flex-1 border border-neutral-700 bg-neutral-900 px-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 bg-white px-5 text-sm font-semibold tracking-tight text-neutral-950 transition hover:bg-neutral-200"
                >
                  Subscribe <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase">
              {t('contact_us')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+255747110777"
                  className="inline-flex items-center gap-2.5 text-sm text-neutral-400 transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  +255 747 110 777
                </a>
              </li>
              <li>
                <a
                  href="mailto:believeinablessed@gmail.com"
                  className="inline-flex items-center gap-2.5 text-sm text-neutral-400 transition hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  believeinablessed@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/255747110777"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-neutral-400 transition hover:text-white"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  {t('whatsapp_chat')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase">
              Follow
            </h3>
            <div className="flex gap-2">
              <a
                href="https://www.instagram.com/believeinablessed?igsh=anM5aWRpenQ5aTEx&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-neutral-700 bg-neutral-900 text-white transition hover:border-white hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@believeinablessed"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-10 w-10 items-center justify-center border border-neutral-700 bg-neutral-900 text-white transition hover:border-white hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                </svg>
              </a>
            </div>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white transition hover:text-white"
            >
              Get in touch <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Believe in a Blessed. {t('all_rights')}.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-neutral-500 transition hover:text-white">
              {t('privacy_policy')}
            </Link>
            <Link href="/terms" className="text-xs text-neutral-500 transition hover:text-white">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
