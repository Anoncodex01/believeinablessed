'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useLang } from '@/contexts/LangContext';
import {
  ArrowRight,
  CheckCircle2,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const copy = lang === 'sw'
    ? {
        kicker: 'Wasiliana',
        title: 'Contact Us',
        subtitle: 'Maswali kuhusu oda, usafirishaji, au ushirikiano? Tunako — andika, piga simu, au WhatsApp.',
        formTitle: 'Tuma ujumbe',
        name: 'Jina kamili',
        email: 'Barua pepe',
        phone: 'Simu (si lazima)',
        message: 'Ujumbe wako',
        send: 'Tuma ujumbe',
        sending: 'Inatuma…',
        success: 'Asante! Tutawasiliana hivi karibuni.',
        channels: 'Njia za mawasiliano',
        hours: 'Saa za kazi',
        hoursValue: 'Jumatatu – Jumamosi · 9:00 – 18:00 EAT',
        location: 'Mahali',
        locationValue: 'Dar es Salaam, Tanzania',
      }
    : {
        kicker: 'Get in touch',
        title: 'Contact Us',
        subtitle: 'Questions about orders, shipping, or partnerships? We’re here — write, call, or WhatsApp.',
        formTitle: 'Send a message',
        name: 'Full name',
        email: 'Email address',
        phone: 'Phone (optional)',
        message: 'Your message',
        send: 'Send message',
        sending: 'Sending…',
        success: 'Thanks! We’ll get back to you soon.',
        channels: 'Contact channels',
        hours: 'Business hours',
        hoursValue: 'Monday – Saturday · 9:00 – 18:00 EAT',
        location: 'Location',
        locationValue: 'Dar es Salaam, Tanzania',
      };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(lang === 'sw' ? 'Jaza sehemu zote muhimu' : 'Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      // Open WhatsApp with a prefilled message as the reliable contact channel
      const text = encodeURIComponent(
        `Hello BelieveinaBlessed,\n\nName: ${form.name.trim()}\nEmail: ${form.email.trim()}\nPhone: ${form.phone.trim() || '—'}\n\n${form.message.trim()}`
      );
      window.open(`https://wa.me/255747110777?text=${text}`, '_blank', 'noopener,noreferrer');
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
      toast.success(copy.success);
    } finally {
      setSending(false);
    }
  };

  const channels = [
    {
      icon: Phone,
      label: 'Phone',
      value: '+255 747 110 777',
      href: 'tel:+255747110777',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'believeinablessed@gmail.com',
      href: 'mailto:believeinablessed@gmail.com',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: 'Chat with us',
      href: 'https://wa.me/255747110777',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: '@believeinablessed',
      href: 'https://www.instagram.com/believeinablessed',
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />

      <div className="home-shell py-12 sm:py-16 lg:py-20">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative mb-12 overflow-hidden border border-[var(--border)] bg-[var(--surface-warm)] px-5 py-10 sm:px-8 sm:py-12 lg:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(15,118,110,0.08),_transparent_55%)]" />
          <div className="relative max-w-2xl">
            <p className="section-kicker">{copy.kicker}</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
              {copy.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              {copy.subtitle}
            </p>
          </div>
        </motion.section>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            onSubmit={handleSubmit}
            className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-8"
          >
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">
              {copy.formTitle}
            </h2>

            {sent ? (
              <div className="mt-8 flex flex-col items-start gap-3 border border-neutral-950/20 bg-neutral-950/5 p-5">
                <CheckCircle2 className="h-6 w-6 text-neutral-950" />
                <p className="font-medium text-[var(--text)]">{copy.success}</p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-sm font-semibold text-neutral-950 transition hover:opacity-70"
                >
                  {lang === 'sw' ? 'Tuma ujumbe mwingine' : 'Send another message'}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    {copy.name} *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    {copy.email} *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    {copy.phone}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    {copy.message} *
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setField('message', e.target.value)}
                    className="input min-h-[140px] resize-y"
                    rows={5}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 bg-neutral-950 px-6 py-3.5 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:w-auto dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  {sending ? copy.sending : copy.send}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-8">
              <p className="section-kicker">{copy.channels}</p>
              <div className="mt-5 space-y-1">
                {channels.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-4 border-b border-[var(--border)] py-4 last:border-0 transition hover:bg-[var(--bg-secondary)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--surface-warm)] text-neutral-950 dark:text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
                        {label}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium tracking-tight text-[var(--text)]">
                        {value}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="border border-[var(--border)] bg-[var(--surface-warm)] p-5 sm:p-8">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-950" />
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
                    {copy.location}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold tracking-tight text-[var(--text)]">
                    {copy.locationValue}
                  </p>
                </div>
              </div>
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
                  {copy.hours}
                </p>
                <p className="mt-1 text-sm text-[var(--text)]">{copy.hoursValue}</p>
              </div>
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--text)] transition hover:text-neutral-950"
              >
                {lang === 'sw' ? 'Soma hadithi yetu' : 'Read our story'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
