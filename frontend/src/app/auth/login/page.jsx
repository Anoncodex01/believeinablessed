'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const heroImage =
  'https://res.cloudinary.com/drn2khjxq/image/upload/v1783808187/believeinablessed/products/mfyoi3pgzad7welrkmlc.jpg';

const loginModes = [
  { id: 'customer', label: 'Customer', icon: User, title: 'Welcome back', note: 'Track orders, manage your bag, and shop faster.' },
  { id: 'affiliate', label: 'Affiliate', icon: Zap, title: 'Affiliate login', note: 'Open your dashboard and share product links.' },
];

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [mode, setMode] = useState(searchParams.get('type') || 'customer');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const activeMode = loginModes.find(item => item.id === mode) || loginModes[0];
  const ActiveIcon = activeMode.icon;
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name || 'Admin'}!`);

      // Always honor redirect (e.g. /checkout) so shoppers finish their purchase
      if (redirect) {
        router.push(redirect);
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'affiliate' || user.role === 'affiliate_pending') {
        router.push('/affiliate/dashboard');
      } else {
        router.push('/orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
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
          <Image src={heroImage} alt="Believe in a Blessed fashion edit" fill priority className="object-cover opacity-88" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute left-8 top-8 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-950">
            BelieveinaBlessed
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Clean fashion, confident checkout
            </p>
            <h1 className="max-w-xl font-display text-6xl font-semibold leading-none">Sign in to your style account.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
              One secure account for shopping, affiliate earnings, and store management.
            </p>
          </div>
        </motion.div>

        <div className="flex items-center justify-center py-8 lg:pl-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[520px]">
            <div className="mb-8 lg:hidden">
              <div className="relative mb-5 aspect-[1.7] overflow-hidden rounded-[28px]">
                <Image src={heroImage} alt="Believe in a Blessed fashion edit" fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-0 bg-black/25" />
              </div>
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Account access</p>
              <h2 className="mt-2 font-display text-5xl font-semibold leading-none text-[var(--text)]">{activeMode.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{activeMode.note}</p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-white p-1 shadow-sm dark:bg-white/10">
              {loginModes.map(item => {
                const Icon = item.icon;
                const selected = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-2 text-xs font-semibold transition sm:text-sm ${
                      selected
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleLogin} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#f7f6f3] p-4 dark:bg-white/[0.04]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{activeMode.label} sign in</p>
                  <p className="text-xs text-[var(--text-secondary)]">Use your registered email and password.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="relative block">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={event => set('email', event.target.value)}
                    className="input h-14 rounded-2xl pl-11"
                    autoComplete="email"
                  />
                </label>
                <label className="relative block">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Password"
                    value={form.password}
                    onChange={event => set('password', event.target.value)}
                    className="input h-14 rounded-2xl pl-11 pr-12"
                    autoComplete="current-password"
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
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-950"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </motion.button>
            </form>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href={redirect ? `/auth/register?redirect=${encodeURIComponent(redirect)}` : '/auth/register'} className="rounded-2xl border border-black/10 bg-white p-4 text-sm transition hover:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:hover:border-white">
                <span className="font-semibold text-[var(--text)]">Create customer account</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">Shop faster and track orders.</span>
              </Link>
              <Link href="/auth/register?type=affiliate" className="rounded-2xl border border-black/10 bg-white p-4 text-sm transition hover:border-neutral-950 dark:border-white/10 dark:bg-white/5 dark:hover:border-white">
                <span className="font-semibold text-[var(--text)]">Register as affiliate</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">Apply and earn commission.</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f6f3] dark:bg-neutral-950" />}>
      <LoginContent />
    </Suspense>
  );
}
