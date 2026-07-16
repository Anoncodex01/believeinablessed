'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Gift, Lock, Mail, Phone, Sparkles, User, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const heroImage =
  'https://res.cloudinary.com/drn2khjxq/image/upload/v1783808187/believeinablessed/products/sdk4pqo3drnygj0in5xc.jpg';

const accountTypes = [
  {
    id: 'customer',
    label: 'Customer',
    title: 'Create your account',
    note: 'Save your details, track orders, and checkout faster.',
    stats: [
      { label: 'Fast', sub: 'Checkout' },
      { label: 'Order', sub: 'Tracking' },
      { label: 'Style', sub: 'Updates' },
    ],
  },
  {
    id: 'affiliate',
    label: 'Affiliate',
    title: 'Join as affiliate',
    note: 'Create an account first, then submit your affiliate application.',
    stats: [
      { label: '10%', sub: 'Commission' },
      { label: 'Free', sub: 'To join' },
      { label: 'Fast', sub: 'Payouts' },
    ],
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
    <main className="min-h-screen bg-[#f7f6f3] pt-16 dark:bg-neutral-950">
      <Navbar />
      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1500px] items-stretch gap-0 px-4 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative hidden overflow-hidden rounded-[32px] bg-neutral-950 lg:block"
        >
          <Image src={heroImage} alt="Believe in a Blessed clothing" fill priority className="object-cover opacity-90" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute left-8 top-8 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-950">
            New members
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Shop, share, and grow
            </p>
            <h1 className="max-w-xl font-display text-6xl font-semibold leading-none">Start with one beautiful account.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
              Create your customer profile, or continue into the affiliate application after signup.
            </p>
          </div>
        </motion.div>

        <div className="flex items-center justify-center py-8 lg:pl-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[540px]">
            <div className="mb-8 lg:hidden">
              <div className="relative mb-5 aspect-[1.7] overflow-hidden rounded-[28px]">
                <Image src={heroImage} alt="Believe in a Blessed clothing" fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-0 bg-black/25" />
              </div>
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">New account</p>
              <h2 className="mt-2 font-display text-5xl font-semibold leading-none text-[var(--text)]">{activeType.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{activeType.note}</p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-white p-1 shadow-sm dark:bg-white/10">
              {accountTypes.map(item => {
                const selected = item.id === accountType;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAccountType(item.id)}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                      selected
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {item.id === 'affiliate' ? <Zap className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {activeType.stats.map(item => (
                <div key={item.label} className="rounded-2xl border border-black/10 bg-white p-3 text-center dark:border-white/10 dark:bg-white/5">
                  <p className="text-lg font-semibold text-[var(--text)]">{item.label}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{item.sub}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleRegister} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="relative block sm:col-span-2">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    placeholder="Full name *"
                    value={form.name}
                    onChange={event => set('name', event.target.value)}
                    className="input h-14 rounded-2xl pl-11"
                    autoComplete="name"
                  />
                </label>
                <label className="relative block sm:col-span-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={form.email}
                    onChange={event => set('email', event.target.value)}
                    className="input h-14 rounded-2xl pl-11"
                    autoComplete="email"
                  />
                </label>
                <label className="relative block sm:col-span-2">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={event => set('phone', event.target.value)}
                    className="input h-14 rounded-2xl pl-11"
                    autoComplete="tel"
                  />
                </label>
                <label className="relative block">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password *"
                    value={form.password}
                    onChange={event => set('password', event.target.value)}
                    className="input h-14 rounded-2xl pl-11 pr-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(prev => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition hover:text-[var(--text)]"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </label>
                <label className="relative block">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Confirm *"
                    value={form.confirm}
                    onChange={event => set('confirm', event.target.value)}
                    className="input h-14 rounded-2xl pl-11"
                    autoComplete="new-password"
                  />
                </label>
                <label className="relative block sm:col-span-2">
                  <Gift className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    placeholder="Referral code"
                    value={form.referral_code}
                    onChange={event => set('referral_code', event.target.value.toUpperCase())}
                    className="input h-14 rounded-2xl pl-11"
                  />
                </label>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950"
              >
                {loading ? 'Creating account...' : accountType === 'affiliate' ? 'Create and apply' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link href={`/auth/login?type=${accountType}`} className="font-semibold text-[var(--text)] underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f6f3] dark:bg-neutral-950" />}>
      <RegisterContent />
    </Suspense>
  );
}
