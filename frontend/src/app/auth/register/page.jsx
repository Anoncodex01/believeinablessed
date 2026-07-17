'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const heroImage =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=1400&fit=crop&auto=format';

const accountTypes = [
  {
    id: 'customer',
    label: 'Customer',
    title: 'Create your account',
    note: 'Save your details, track orders, and checkout faster.',
  },
  {
    id: 'affiliate',
    label: 'Affiliate',
    title: 'Join as affiliate',
    note: 'Create an account first, then submit your affiliate application.',
  },
];

function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get('ref') || '';
  const redirect = searchParams.get('redirect');
  const initialType = searchParams.get('type') === 'affiliate' ? 'affiliate' : 'customer';

  const [accountType, setAccountType] = useState(initialType);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    referral_code: refFromUrl,
  });

  const activeType = accountTypes.find(item => item.id === accountType) || accountTypes[0];
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Fill all required fields');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        referral_code: form.referral_code || undefined,
      });
      toast.success('Account created successfully!');
      if (redirect) router.push(redirect);
      else router.push(accountType === 'affiliate' ? '/affiliate/apply' : '/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />
      <section className="home-shell grid min-h-[calc(100vh-4rem)] items-stretch gap-0 py-8 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden overflow-hidden bg-stone-900 lg:block"
        >
          <Image src={heroImage} alt="BelieveinaBlessed" fill priority className="object-cover" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="relative flex h-full flex-col justify-end p-10 text-white">
            <p className="mb-4 font-display text-sm font-semibold tracking-[0.28em] text-white/85 uppercase">
              BelieveinaBlessed
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Create your account
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Create your customer profile, or continue into the affiliate application after signup.
            </p>
          </div>
        </motion.div>

        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <p className="section-kicker">New account</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                {activeType.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{activeType.note}</p>
            </div>

            <div className="mb-6 flex border border-[var(--border)] p-1">
              {accountTypes.map(item => {
                const selected = item.id === accountType;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAccountType(item.id)}
                    className={`flex-1 py-2.5 text-sm font-medium tracking-tight transition ${
                      selected
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleRegister} className="border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    Full name *
                  </span>
                  <input
                    placeholder="Your name"
                    value={form.name}
                    onChange={event => set('name', event.target.value)}
                    className="input"
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    Email *
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={event => set('email', event.target.value)}
                    className="input"
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    Phone
                  </span>
                  <input
                    type="tel"
                    placeholder="+255 747 110 777"
                    value={form.phone}
                    onChange={event => set('phone', event.target.value)}
                    className="input"
                    autoComplete="tel"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                      Password *
                    </span>
                    <span className="relative block">
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="6+ characters"
                        value={form.password}
                        onChange={event => set('password', event.target.value)}
                        className="input pr-11"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition hover:text-[var(--text)]"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                      Confirm *
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={form.confirm}
                      onChange={event => set('confirm', event.target.value)}
                      className="input"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    Referral code
                  </span>
                  <input
                    placeholder="Optional"
                    value={form.referral_code}
                    onChange={event => set('referral_code', event.target.value.toUpperCase())}
                    className="input"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-neutral-950 py-3.5 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {loading ? 'Creating account…' : accountType === 'affiliate' ? 'Create and apply' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link
                href={`/auth/login?type=${accountType}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="font-semibold text-neutral-950 transition hover:opacity-70 dark:text-white"
              >
                Sign in
              </Link>
            </p>

            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
              <Link
                href="/products"
                className="text-sm font-medium tracking-tight text-[var(--text-secondary)] transition hover:text-neutral-950"
              >
                Continue shopping without an account →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--bg)]" />}>
      <RegisterContent />
    </Suspense>
  );
}
