// app/affiliate/apply/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Phone, User, Mail, Send, CheckCircle, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AffiliateApply() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    social_media: '',
    reason: '',
    experience: ''
  });
  const [applied, setApplied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/affiliate/apply');
      return;
    }
    
    if (user) {
      // Pre-fill name
      if (user.name && !formData.name) {
        setFormData(prev => ({ ...prev, name: user.name }));
      }
      
      // Check application status
      if (user.affiliate_approved) {
        router.push('/affiliate/dashboard');
        return;
      }
      
      if (user.affiliate_requested_at) {
        setApplied(true);
        setReferralCode(user.referral_code || '');
      }
    }
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get('bib_token');
      const { data } = await axios.post(
        `${API}/affiliates/apply`,
        {
          phone: formData.phone,
          social_media: formData.social_media || '',
          reason: formData.reason || 'I want to become an affiliate',
          experience: formData.experience || ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(data.message);
      setApplied(true);
      setReferralCode(data.referral_code);
      
      // Refresh user data to get updated role
      await refreshUser();
      
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] pt-16">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="card p-8">
            <div className="h-32 shimmer-bg rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 md:p-8"
        >
          {applied ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Application Submitted!</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Your affiliate application has been submitted successfully. 
                An admin will review your application and get back to you soon.
              </p>
              {referralCode && (
                <div className="bg-brand-500/10 p-4 rounded-xl border border-brand-500/20 mb-6">
                  <p className="text-sm text-[var(--text-secondary)]">Your Referral Code</p>
                  <p className="text-2xl font-mono font-bold text-brand-500">{referralCode}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    This code will be activated once your application is approved
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/affiliate/dashboard" className="btn-primary">
                  Open Dashboard
                </Link>
                <Link href="/affiliate" className="btn-secondary">
                  Learn More
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-[var(--text)]">Apply to Become an Affiliate</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                  Start earning commissions by sharing products
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-xs font-semibold text-[var(--text)]">5-10%</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Commission</div>
                </div>
                <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-xs font-semibold text-[var(--text)]">Instant</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Payouts</div>
                </div>
                <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                  <div className="text-2xl mb-1">📈</div>
                  <div className="text-xs font-semibold text-[var(--text)]">Unlimited</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Earnings</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="tel"
                      placeholder="0712345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    This is where we'll send your payments
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Social Media Links (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Instagram, TikTok, Facebook, etc."
                      value={formData.social_media}
                      onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                      className="input"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Share your social media profiles where you'll promote products
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Why do you want to become an affiliate? (Optional)
                  </label>
                  <textarea
                    placeholder="Tell us why you'd like to join our affiliate program..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="input w-full resize-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1">
                    Years of Experience (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="input"
                    min="0"
                    max="50"
                  />
                </div>

                <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                  <h4 className="text-sm font-semibold text-blue-500 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    What to Expect
                  </h4>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                    <li>• Admin review within 24-48 hours</li>
                    <li>• You'll be notified via email and notification</li>
                    <li>• Upon approval, you get access to the affiliate dashboard</li>
                    <li>• Start sharing your referral code immediately</li>
                    <li>• Earn commissions based on your tier level</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Application
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-[var(--text-secondary)]">
                  By applying, you agree to our affiliate terms and conditions
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
      <BottomNav />
    </main>
  );
}
