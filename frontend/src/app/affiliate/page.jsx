// app/affiliate/page.jsx
'use client'; // Add this at the very top

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { motion } from 'framer-motion'; // Make sure motion is imported
import { TrendingUp, Clock, Zap, Shield, Users, Gift, CheckCircle, UserCheck, UserX, Award } from 'lucide-react';


export default function AffiliatePage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('levels');

  // In app/affiliate/page.jsx - Update the tiers array

const tiers = [
  {
    name: 'Bronze',
    icon: '🥉',
    color: 'from-neutral-950 to-neutral-600',
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
    textColor: 'text-neutral-950',
    commission: '5%',
    minOrders: '0-19',
    payoutTime: '2 Weeks',
    payoutIcon: Clock,
    payoutDesc: 'Paid every 2 weeks',
    requirements: '19 orders to withdraw', // Updated
    badge: 'Beginner'
  },
  {
    name: 'Silver',
    icon: '🥈',
    color: 'from-gray-500 to-gray-300',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-400',
    commission: '6%',
    minOrders: '20-99',
    payoutTime: '1 Week',
    payoutIcon: Clock,
    payoutDesc: 'Weekly payouts',
    requirements: '10 orders to withdraw', // Updated
    badge: 'Rising'
  },
  {
    name: 'Gold',
    icon: '🥇',
    color: 'from-neutral-800 to-neutral-400',
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
    textColor: 'text-neutral-950',
    commission: '7%',
    minOrders: '100-199',
    payoutTime: '3 Days',
    payoutIcon: Clock,
    payoutDesc: 'Fast payouts every 3 days',
    requirements: '5 orders to withdraw', // Updated
    badge: 'Pro'
  },
  {
    name: 'Platinum',
    icon: '💎',
    color: 'from-cyan-500 to-blue-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    commission: '8%',
    minOrders: '200-300',
    payoutTime: 'Instant',
    payoutIcon: Zap,
    payoutDesc: 'Instant payouts',
    requirements: '3 orders to withdraw', // Updated
    badge: 'Elite'
  },
  {
    name: 'VIP',
    icon: '👑',
    color: 'from-purple-600 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    commission: '9-10%',
    minOrders: '300+',
    payoutTime: 'Instant',
    payoutIcon: Zap,
    payoutDesc: 'Priority instant payouts',
    requirements: 'Instant withdrawal', // Updated
    badge: 'Legendary'
  }
];

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  // Check user's affiliate status
  const isAffiliate = user?.affiliate_approved === true;
  const isPending = user?.affiliate_requested_at && !user?.affiliate_approved;
  const isRejected = user?.affiliate_approved === false && user?.affiliate_requested_at;

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Affiliate Program
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-[var(--text)] mb-6">
              Earn Money Sharing<br />
              <span className="gradient-text">Fashion Links</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              Join Tanzania's fastest-growing affiliate program. Share products on WhatsApp, TikTok, and Instagram — earn up to 10% commission. Free to join, instant payouts for top performers!
            </p>
            
            {/* Conditional CTA based on user status */}
            {user ? (
              isAffiliate ? (
                <Link href="/affiliate/dashboard" className="btn-primary text-base px-8 py-4 hover:scale-105 transition-transform bg-neutral-950 hover:bg-neutral-800">
                  Go to Dashboard →
                </Link>
              ) : isPending ? (
                <div className="space-y-3">
                  <div className="inline-block px-6 py-4 bg-neutral-100 border border-neutral-300 rounded-xl">
                    <p className="text-neutral-950 font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Application Pending - Dashboard Available
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      You can prepare links and view your affiliate space while admin reviews your account
                    </p>
                  </div>
                  <div>
                    <Link href="/affiliate/dashboard" className="btn-primary text-base px-8 py-4 hover:scale-105 transition-transform bg-neutral-950 hover:bg-neutral-800">
                      Open Dashboard →
                    </Link>
                  </div>
                </div>
              ) : isRejected ? (
                <div className="space-y-3">
                  <div className="inline-block px-6 py-4 bg-neutral-100 border border-neutral-300 rounded-xl">
                    <p className="text-neutral-950 font-semibold flex items-center gap-2">
                      <UserX className="w-5 h-5" />
                      Application Not Approved
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      You can reapply at any time
                    </p>
                  </div>
                  <div>
                    <Link href="/affiliate/apply" className="btn-primary text-base px-8 py-4 hover:scale-105 transition-transform">
                      Reapply Now →
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/affiliate/apply" className="btn-primary text-base px-8 py-4 hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700">
                  Apply to Become an Affiliate →
                </Link>
              )
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/auth/register" className="btn-primary text-base px-8 py-4 hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700">
                  Start Earning Free →
                </Link>
                <Link href="/auth/login" className="btn-secondary text-base px-8 py-4">
                  Already a Member
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">5-10%</div>
            <div className="text-sm text-[var(--text-secondary)]">Commission Rate</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">Instant</div>
            <div className="text-sm text-[var(--text-secondary)]">Payout for Elite</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">300+</div>
            <div className="text-sm text-[var(--text-secondary)]">Max Orders Tier</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">Free</div>
            <div className="text-sm text-[var(--text-secondary)]">To Join</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-display font-bold text-center text-[var(--text)] mb-10"
        >
          How It Works
        </motion.h2>
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-6"
        >
          {[
            { step: '01', title: 'Apply Free', desc: 'Fill out the application form. No fees, no investment required.', icon: Users },
            { step: '02', title: 'Get Approved', desc: 'Admins review your application and activate your account.', icon: UserCheck },
            { step: '03', title: 'Earn Commissions', desc: 'Share links on social media. Get paid based on your tier level.', icon: TrendingUp },
          ].map((s, idx) => (
            <motion.div key={s.step} variants={fadeInUp} className="card p-6 text-center relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute -top-4 -right-4 text-7xl font-bold text-[var(--border)] select-none">{s.step}</div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white relative z-10">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-2 relative z-10">{s.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] relative z-10">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Affiliate Levels - New Tier System */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-display font-bold text-[var(--text)] mb-3">Affiliate Tiers</h2>
          <p className="text-[var(--text-secondary)]">Higher sales = Higher commissions + Faster payouts</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className={`card p-5 text-center border-2 ${tier.borderColor} bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] relative overflow-hidden group`}
            >
              {/* Badge */}
              <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${tier.bgColor} ${tier.textColor}`}>
                {tier.badge}
              </div>
              
              {/* Icon */}
              <div className={`text-5xl mb-3 ${tier.textColor}`}>{tier.icon}</div>
              
              {/* Level Name */}
              <h3 className={`text-xl font-bold ${tier.textColor} mb-2`}>{tier.name}</h3>
              
              {/* Commission */}
              <div className="text-3xl font-bold text-[var(--text)] mb-1">{tier.commission}</div>
              <div className="text-xs text-[var(--text-secondary)] mb-3">Commission Rate</div>
              
              {/* Orders */}
              <div className="border-t border-[var(--border)] pt-3 mb-3">
                <p className="text-sm font-semibold text-[var(--text)]">Min Orders</p>
                <p className="text-lg font-bold text-blue-500">{tier.minOrders}</p>
                <p className="text-xs text-[var(--text-secondary)]">successful orders</p>
              </div>
              
              {/* Payout */}
              <div className="bg-[var(--bg-secondary)] rounded-lg p-2 mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <tier.payoutIcon className={`w-4 h-4 ${tier.textColor}`} />
                  <span className="text-sm font-semibold text-[var(--text)]">Payout: {tier.payoutTime}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{tier.payoutDesc}</p>
              </div>
              
              {/* Requirements */}
              <p className="text-xs text-[var(--text-secondary)]">{tier.requirements}</p>
              
              {/* Progress Bar Simulation */}
              <div className="mt-3 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
                  style={{ width: index === 0 ? '20%' : index === 1 ? '40%' : index === 2 ? '60%' : index === 3 ? '80%' : '100%' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payout Comparison Table */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-6"
        >
          <h3 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Payout Schedule Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-2 text-[var(--text)]">Tier</th>
                  <th className="text-left py-3 px-2 text-[var(--text)]">Orders</th>
                  <th className="text-left py-3 px-2 text-[var(--text)]">Commission</th>
                  <th className="text-left py-3 px-2 text-[var(--text)]">Payout Time</th>
                  <th className="text-left py-3 px-2 text-[var(--text)]">Withdraw Requirement</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.name} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tier.icon}</span>
                        <span className={`font-semibold ${tier.textColor}`}>{tier.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[var(--text)]">{tier.minOrders}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-blue-500">{tier.commission}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <tier.payoutIcon className={`w-3 h-3 ${tier.textColor}`} />
                        <span className="text-[var(--text)]">{tier.payoutTime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-[var(--text-secondary)]">
                      {tier.requirements}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Important Note */}
          <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="font-semibold text-blue-500">Note:</span> You must reach the minimum order requirement for your tier before you can withdraw earnings. 
                Bronze: 19 orders, Silver: 20 orders, Gold: 100 orders, Platinum: 200 orders, VIP: 301 orders.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Example Earnings Calculator */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-6 text-center bg-gradient-to-r from-blue-500/5 to-blue-500/5"
        >
          <h3 className="text-xl font-bold text-[var(--text)] mb-4">💰 Example Earnings</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {tiers.map((tier) => {
              const avgOrderValue = 50000;
              const minOrders = tier.minOrders.split('-')[0];
              const commissionPercent = parseInt(tier.commission);
              const avgEarnings = avgOrderValue * (commissionPercent / 100) * (parseInt(minOrders) || 10);
              
              return (
                <div key={tier.name} className="text-center p-2">
                  <div className="text-2xl mb-1">{tier.icon}</div>
                  <div className="text-xs font-semibold text-[var(--text)]">{tier.name}</div>
                  <div className="text-sm font-bold text-blue-500">
                    {commissionPercent}%
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    ~TZS {(avgEarnings).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-4">
            *Based on average order value of TZS 50,000 at minimum order volume
          </p>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-[var(--text)] mb-4">Ready to Start Earning?</h2>
          <p className="text-[var(--text-secondary)] mb-6">Join thousands of affiliates earning daily. Higher sales = Higher commissions!</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {user ? (
              isAffiliate || isPending ? (
                <Link href="/affiliate/dashboard" className="btn-primary text-base px-10 py-4 hover:scale-105 transition-transform inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800">
                  <Award className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/affiliate/apply" className="btn-primary text-base px-10 py-4 hover:scale-105 transition-transform inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <UserCheck className="w-5 h-5" />
                  Apply Now — It's Free
                </Link>
              )
            ) : (
              <Link href="/auth/register" className="btn-primary text-base px-10 py-4 hover:scale-105 transition-transform inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Zap className="w-5 h-5" />
                Register Now — It's Free
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
