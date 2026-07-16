'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/contexts/LangContext';
import { Instagram, Mail, Phone } from 'lucide-react';

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

  return (
    <footer className="border-t border-black/10 bg-[#f7f6f3] pb-20 md:pb-0 dark:border-white/10 dark:bg-neutral-950">
      <div className="mx-auto max-w-[1500px] px-4 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            <div className="mb-6 flex items-center">
              <Image
                src="/logo.png"
                alt="Believe in a Blessed"
                width={170}
                height={72}
                className="h-auto w-36 object-contain dark:brightness-0 dark:invert sm:w-44"
              />
            </div>

            <p className="max-w-md text-base leading-7 text-[var(--text-secondary)]">
              Tanzania's premier fashion destination for clean, confident everyday style.
            </p>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text)]">Stay in the loop</p>
              {subscribed ? (
                <p className="text-sm font-semibold text-emerald-600">You're subscribed!</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="h-11 flex-1 rounded-full border border-black/15 bg-white px-5 text-sm outline-none transition focus:border-neutral-950 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <a 
                href="https://www.instagram.com/believeinablessed?igsh=anM5aWRpenQ5aTEx&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm transition hover:-translate-y-0.5 hover:text-pink-500 dark:bg-white/10 dark:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a 
                href="https://www.tiktok.com/@believeinablessed" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase text-[var(--text)]">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: t('home'), href: '/' },
                { label: t('all_products'), href: '/products' },
                { label: t('trending'), href: '/products?trending=true' },
                { label: t('competition'), href: '/competition' },
                { label: 'Affiliate Program', href: '/affiliate' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--text-secondary)] transition hover:text-neutral-950 dark:hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase text-[var(--text)]">{t('contact_us')}</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm dark:bg-white/10 dark:text-white">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                </span>
                <a href="tel:+255747110777" className="transition hover:text-neutral-950 dark:hover:text-white">+255 747 110 777</a>
              </li>

              <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm dark:bg-white/10 dark:text-white">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                </span>
                <a href="mailto:believeinablessed@gmail.com" className="transition hover:text-neutral-950 dark:hover:text-white">
                  believeinablessed@gmail.com
                </a>
              </li>

              <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-green-600 shadow-sm dark:bg-white/10">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                </span>
                <a href="https://wa.me/255747110777" target="_blank" rel="noopener noreferrer" className="transition hover:text-green-600">
                  {t('whatsapp_chat')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <p className="text-xs text-[var(--text-secondary)]">
            © {new Date().getFullYear()} Believe in a Blessed. {t('all_rights')}.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-[var(--text-secondary)] transition hover:text-neutral-950 dark:hover:text-white">{t('privacy_policy')}</Link>
            <Link href="/terms" className="text-xs text-[var(--text-secondary)] transition hover:text-neutral-950 dark:hover:text-white">{t('terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
