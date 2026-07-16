'use client';
import { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAffiliate } from '@/contexts/AffiliateContext';
import { createOrder } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ShoppingBag, Smartphone, CreditCard, Search,
  ChevronDown, ChevronUp, Truck, RotateCcw, Lock, X,
  Loader2, ArrowRight, Trash2, Plus, Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import SnippePayment from '@/components/checkout/SnippePayment';

function formatPrice(n) {
  return new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n);
}

const countryCodes = {
  'TZ': { code: '+255', name: 'Tanzania', flag: '🇹🇿', dialCode: '255' },
  'KE': { code: '+254', name: 'Kenya', flag: '🇰🇪', dialCode: '254' },
  'UG': { code: '+256', name: 'Uganda', flag: '🇺🇬', dialCode: '256' },
  'NG': { code: '+234', name: 'Nigeria', flag: '🇳🇬', dialCode: '234' },
  'ZA': { code: '+27', name: 'South Africa', flag: '🇿🇦', dialCode: '27' },
  'GH': { code: '+233', name: 'Ghana', flag: '🇬🇭', dialCode: '233' },
  'GB': { code: '+44', name: 'United Kingdom', flag: '🇬🇧', dialCode: '44' },
  'US': { code: '+1', name: 'United States', flag: '🇺🇸', dialCode: '1' },
  'CA': { code: '+1', name: 'Canada', flag: '🇨🇦', dialCode: '1' },
  'AU': { code: '+61', name: 'Australia', flag: '🇦🇺', dialCode: '61' },
  'DE': { code: '+49', name: 'Germany', flag: '🇩🇪', dialCode: '49' },
  'FR': { code: '+33', name: 'France', flag: '🇫🇷', dialCode: '33' },
  'IT': { code: '+39', name: 'Italy', flag: '🇮🇹', dialCode: '39' },
  'ES': { code: '+34', name: 'Spain', flag: '🇪🇸', dialCode: '34' },
  'NL': { code: '+31', name: 'Netherlands', flag: '🇳🇱', dialCode: '31' },
  'SE': { code: '+46', name: 'Sweden', flag: '🇸🇪', dialCode: '46' },
  'NO': { code: '+47', name: 'Norway', flag: '🇳🇴', dialCode: '47' },
  'DK': { code: '+45', name: 'Denmark', flag: '🇩🇰', dialCode: '45' },
  'FI': { code: '+358', name: 'Finland', flag: '🇫🇮', dialCode: '358' },
  'RU': { code: '+7', name: 'Russia', flag: '🇷🇺', dialCode: '7' },
  'CN': { code: '+86', name: 'China', flag: '🇨🇳', dialCode: '86' },
  'JP': { code: '+81', name: 'Japan', flag: '🇯🇵', dialCode: '81' },
  'IN': { code: '+91', name: 'India', flag: '🇮🇳', dialCode: '91' },
  'BR': { code: '+55', name: 'Brazil', flag: '🇧🇷', dialCode: '55' },
  'MX': { code: '+52', name: 'Mexico', flag: '🇲🇽', dialCode: '52' },
  'AR': { code: '+54', name: 'Argentina', flag: '🇦🇷', dialCode: '54' },
  'CO': { code: '+57', name: 'Colombia', flag: '🇨🇴', dialCode: '57' },
  'CL': { code: '+56', name: 'Chile', flag: '🇨🇱', dialCode: '56' },
};

async function detectUserCountry() {
  try {
    const apis = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://ipinfo.io/json'
    ];
    for (const api of apis) {
      try {
        const response = await fetch(api);
        if (!response.ok) continue;
        const data = await response.json();
        let countryCode = data.country_code || data.country;
        if (countryCode && countryCodes[countryCode.toUpperCase()]) {
          return countryCode.toUpperCase();
        }
      } catch {
        continue;
      }
    }
    return 'TZ';
  } catch {
    return 'TZ';
  }
}

function CheckoutContent() {
  const { items, total, clearCart, removeItem, updateQuantity } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { refCode } = useAffiliate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || refCode || Cookies.get('bib_ref') || '';

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    city: '',
    address: '',
    payment_type: 'mobile',
    coupon_code: '',
    country_code: 'TZ',
  });
  const [errors, setErrors] = useState({});
  const [discount] = useState(0);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [isLoadingCountry, setIsLoadingCountry] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);

  const [showSnippeModal, setShowSnippeModal] = useState(false);
  const [snippePaymentData, setSnippePaymentData] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const modalOpenRef = useRef(false);
  const prefilledRef = useRef(false);

  // Require login before checkout so orders attach to the account
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = encodeURIComponent(
        ref ? `/checkout?ref=${encodeURIComponent(ref)}` : '/checkout'
      );
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [authLoading, user, router, ref]);

  // Prefill contact details from logged-in user once
  useEffect(() => {
    if (!user || prefilledRef.current) return;
    prefilledRef.current = true;
    setForm((prev) => ({
      ...prev,
      customer_name: prev.customer_name || user.name || '',
      customer_email: prev.customer_email || user.email || '',
      customer_phone: prev.customer_phone || String(user.phone || '').replace(/\D/g, '').replace(/^255/, '').replace(/^0/, '') || '',
    }));
  }, [user]);

  useEffect(() => {
    async function detectCountry() {
      setIsLoadingCountry(true);
      const country = await detectUserCountry();
      setForm((prev) => ({
        ...prev,
        country_code: country,
      }));
      setIsLoadingCountry(false);
    }
    detectCountry();
  }, []);

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) {
      setErrors((prev) => ({ ...prev, [k]: '' }));
    }
  };

  const getFullPhoneNumber = (phone, countryCode) => {
    const country = countryCodes[countryCode];
    if (!country || !phone) return phone;
    let cleanDigits = phone.replace(/[^0-9]/g, '');
    // Avoid +2550... when user types a leading 0 (e.g. 0747159984)
    if (cleanDigits.startsWith(country.dialCode)) {
      cleanDigits = cleanDigits.substring(country.dialCode.length);
    }
    cleanDigits = cleanDigits.replace(/^0+/, '');
    return `${country.code}${cleanDigits}`;
  };

  const validatePhoneNumber = (phone, countryCode) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 0) return 'Phone number is required';
    const country = countryCodes[countryCode];
    if (!country) return 'Invalid country selected';
    let numberToCheck = cleanPhone;
    if (cleanPhone.startsWith(country.dialCode)) {
      numberToCheck = cleanPhone.substring(country.dialCode.length);
    }
    if (numberToCheck.length < 7) {
      return `Phone number must be at least 7 digits after country code (${country.code})`;
    }
    if (numberToCheck.length > 12) {
      return 'Phone number is too long';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.customer_name.trim()) newErrors.customer_name = 'Full name is required';
    const phoneError = validatePhoneNumber(form.customer_phone, form.country_code);
    if (phoneError) newErrors.customer_phone = phoneError;
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.payment_type) newErrors.payment_type = 'Payment method is required';
    if (form.payment_type === 'card' && !form.customer_email.trim()) {
      newErrors.customer_email = 'Email is required for card payments';
    }
    if (items.length === 0) newErrors.cart = 'Your cart is empty';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrderWithSnippe = async () => {
    const fullPhone = getFullPhoneNumber(form.customer_phone, form.country_code);
    const countryInfo = countryCodes[form.country_code];

    const orderItems = items.map((i) => ({
      product_id: i.id,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
      price: i.sale_price || i.price,
    }));

    const response = await createOrder({
      items: orderItems,
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim() || undefined,
      customer_phone: fullPhone,
      customer_phone_local: form.customer_phone.replace(/[^0-9]/g, ''),
      country_code: form.country_code,
      country_name: countryInfo?.name || 'Tanzania',
      shipping_address: { city: form.city.trim(), address: form.address.trim() },
      payment_method: 'snippe',
      coupon_code: form.coupon_code || undefined,
      referral_code: ref || undefined,
    });

    const createdOrder = response.data?.order;
    if (!createdOrder?.id) {
      throw new Error('Order creation failed: No order ID returned');
    }
    return createdOrder;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }

    setIsCreatingOrder(true);
    try {
      const createdOrder = await createOrderWithSnippe();
      setSnippePaymentData({
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number,
        amount: total - discount,
        paymentType: form.payment_type,
        customerName: form.customer_name,
        customerEmail: form.customer_email || undefined,
        customerPhone: getFullPhoneNumber(form.customer_phone, form.country_code),
        address: form.address.trim(),
        city: form.city.trim(),
      });
      setShowSnippeModal(true);
      modalOpenRef.current = true;
    } catch (err) {
      console.error('❌ Order creation error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSnippePaid = useCallback(
    ({ orderNumber }) => {
      setShowSnippeModal(false);
      clearCart();
      toast.success('Payment confirmed!');
      setSnippePaymentData(null);
      modalOpenRef.current = false;
      if (orderNumber) {
        router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
      }
    },
    [clearCart, router]
  );

  const handleSnippeError = useCallback((error) => {
    toast.error(error.message || 'Payment failed. Please try again.');
  }, []);

  const handleSnippeClose = useCallback(() => {
    setShowSnippeModal(false);
    setSnippePaymentData(null);
    modalOpenRef.current = false;
  }, []);

  const getCountryDisplay = (countryCode) => {
    const country = countryCodes[countryCode];
    if (!country) return '🇹🇿 +255';
    return `${country.flag} ${country.code}`;
  };

  const getFilteredCountries = () => {
    if (!searchTerm) return Object.entries(countryCodes);
    return Object.entries(countryCodes).filter(
      ([code, info]) =>
        info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        info.code.includes(searchTerm)
    );
  };

  const CountrySelector = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCountrySelector(false)}>
      <div className="bg-[var(--bg)] rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="font-semibold text-[var(--text)]">Select Country</h3>
          <button onClick={() => setShowCountrySelector(false)} className="text-[var(--text-secondary)] hover:text-[var(--text)]">✕</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="relative mb-4">
            <input type="text" placeholder="Search countries..." className="input pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          <div className="space-y-1">
            {getFilteredCountries().map(([code, info]) => (
              <button
                key={code}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => {
                  setField('country_code', code);
                  setField('customer_phone', '');
                  setShowCountrySelector(false);
                  setSearchTerm('');
                }}
              >
                <span className="text-xl">{info.flag}</span>
                <span className="flex-1 text-left text-[var(--text)]">{info.name}</span>
                <span className="text-sm text-[var(--text-secondary)]">{info.code}</span>
              </button>
            ))}
            {getFilteredCountries().length === 0 && (
              <p className="text-center text-[var(--text-secondary)] py-4">No countries found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (authLoading || !user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0 flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">{authLoading ? 'Checking your account…' : 'Redirecting to login…'}</p>
        </div>
        <Footer />
        <BottomNav />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
        <Navbar />
        <div className="mx-auto flex max-w-[900px] flex-col items-center px-4 py-24 text-center sm:px-8">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f4f0] text-neutral-950 dark:bg-white/10 dark:text-white">
            <ShoppingBag className="h-9 w-9" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Checkout</p>
          <h1 className="font-display text-4xl font-semibold text-[var(--text)] sm:text-5xl">Your bag is empty</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Add a product to your bag first, then come back here to complete your order.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-950"
          >
            Shop Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Footer />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-16 pb-24 md:pb-0">
      <Navbar />
      {showCountrySelector && <CountrySelector />}

      <AnimatePresence>
        {showSnippeModal && snippePaymentData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--bg-card)] z-10">
                <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                  {snippePaymentData.paymentType === 'card' ? (
                    <CreditCard className="w-5 h-5" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                  Pay with Snippe
                </h3>
                <button onClick={handleSnippeClose} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <SnippePayment
                  orderId={snippePaymentData.orderId}
                  orderNumber={snippePaymentData.orderNumber}
                  amount={snippePaymentData.amount}
                  paymentType={snippePaymentData.paymentType}
                  customerName={snippePaymentData.customerName}
                  customerEmail={snippePaymentData.customerEmail}
                  customerPhone={snippePaymentData.customerPhone}
                  address={snippePaymentData.address}
                  city={snippePaymentData.city}
                  onPaid={handleSnippePaid}
                  onError={handleSnippeError}
                  onClose={handleSnippeClose}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section className="mb-8 rounded-[28px] bg-[#f6f4f0] px-5 py-8 sm:px-8 lg:px-10 dark:bg-white/5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Secure Checkout</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-5xl font-semibold leading-none text-[var(--text)]">Checkout</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Review your pieces, confirm delivery details, and pay securely with Snippe.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-medium text-neutral-700 shadow-sm dark:bg-white/10 dark:text-white">
              <Lock className="h-4 w-4" />
              Powered by Snippe
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold text-[var(--text)] mb-4">
                Contact Information <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <input
                    placeholder="Full Name *"
                    value={form.customer_name}
                    onChange={(e) => setField('customer_name', e.target.value)}
                    className={`input ${errors.customer_name ? 'border-red-500' : ''}`}
                  />
                  {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
                </div>
                <div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCountrySelector(true)}
                      className="input flex items-center gap-1 w-auto min-w-[80px] justify-center bg-[var(--bg-secondary)]"
                      disabled={isLoadingCountry}
                    >
                      {isLoadingCountry ? '⌛' : getCountryDisplay(form.country_code)}
                    </button>
                    <input
                      placeholder="Phone number (e.g. 747110777)"
                      value={form.customer_phone}
                      onChange={(e) => setField('customer_phone', e.target.value.replace(/[^0-9]/g, ''))}
                      className={`input flex-1 ${errors.customer_phone ? 'border-red-500' : ''}`}
                      type="tel"
                    />
                  </div>
                  {errors.customer_phone ? (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_phone}</p>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {countryCodes[form.country_code]?.name || 'Selected country'} number — used for mobile money
                    </p>
                  )}
                </div>
                <div>
                  <input
                    placeholder={form.payment_type === 'card' ? 'Email *' : 'Email (optional)'}
                    value={form.customer_email}
                    onChange={(e) => setField('customer_email', e.target.value)}
                    className={`input ${errors.customer_email ? 'border-red-500' : ''}`}
                    type="email"
                  />
                  {errors.customer_email && <p className="text-xs text-red-500 mt-1">{errors.customer_email}</p>}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-[var(--text)] mb-4">
                Delivery Address <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <input
                    placeholder="City * (e.g., Dar es Salaam, Arusha)"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    className={`input ${errors.city ? 'border-red-500' : ''}`}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <textarea
                    placeholder="Address * (Street name, house number, area)"
                    value={form.address}
                    onChange={(e) => setField('address', e.target.value)}
                    className={`input resize-none ${errors.address ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-[var(--text)] mb-4">
                Pay with Snippe <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setField('payment_type', 'mobile')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    form.payment_type === 'mobile'
                      ? 'border-neutral-950 bg-neutral-950/5 shadow-lg dark:border-white dark:bg-white/10'
                      : 'border-[var(--border)] hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        form.payment_type === 'mobile'
                          ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-[var(--text)]">Mobile Money</p>
                        {form.payment_type === 'mobile' && <CheckCircle className="w-5 h-5 text-[var(--text)]" />}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        M-Pesa, Airtel Money, Tigo Pesa & more — USSD prompt on your phone
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setField('payment_type', 'card')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    form.payment_type === 'card'
                      ? 'border-neutral-950 bg-neutral-950/5 shadow-lg dark:border-white dark:bg-white/10'
                      : 'border-[var(--border)] hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        form.payment_type === 'card'
                          ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <CreditCard className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-[var(--text)]">Card</p>
                        {form.payment_type === 'card' && <CheckCircle className="w-5 h-5 text-[var(--text)]" />}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Visa / Mastercard — secure redirect via Snippe
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              {errors.payment_type && <p className="text-xs text-red-500 mt-2">{errors.payment_type}</p>}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-[var(--text)] mb-3">Coupon</h2>
              <div className="flex gap-2">
                <input
                  placeholder="Enter coupon code"
                  value={form.coupon_code}
                  onChange={(e) => setField('coupon_code', e.target.value.toUpperCase())}
                  className="input flex-1"
                />
                <button type="button" className="btn-secondary px-4 py-3 text-sm">
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div className="h-fit lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[var(--text)]">Order Summary</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {items.length} {items.length === 1 ? 'item' : 'items'} in your bag
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>

              <div className="mb-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemPrice = item.sale_price || item.price;
                  const image =
                    item.images?.[0] ||
                    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=200&fit=crop';

                  return (
                    <div
                      key={item.cartKey}
                      className="rounded-2xl border border-black/10 bg-[#f7f6f4] p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white dark:bg-white/10">
                          <Image src={image} alt={item.name} fill className="object-contain p-2" sizes="80px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-medium text-[var(--text)]">{item.name}</p>
                              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                {item.size ? `Size ${item.size}` : 'Selected item'}
                                {item.color ? ` • ${item.color}` : ''}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-[var(--text)]">
                              {formatPrice(itemPrice * item.quantity)}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-white/10">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#f1efeb] dark:hover:bg-white/10"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-[var(--text)]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#f1efeb] dark:hover:bg-white/10"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.cartKey)}
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[var(--border)] pt-3 space-y-2 mb-4">
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Shipping</span>
                  <span>{total > 200000 ? 'FREE' : 'To be confirmed'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[var(--text)] text-lg pt-2 border-t border-[var(--border)]">
                  <span>Total</span>
                  <span>{formatPrice(total - discount)}</span>
                </div>
              </div>

              <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
                <button
                  onClick={() => setShippingExpanded(!shippingExpanded)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-neutral-950 dark:text-white" />
                    <span className="text-sm font-medium text-[var(--text)]">Shipping Information</span>
                  </div>
                  {shippingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {shippingExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-sm"
                    >
                      <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/[0.04]">
                        <p className="font-semibold text-[var(--text)]">Shipping confirmed before dispatch</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                          Local delivery, East Africa courier, and international shipping options are confirmed with your
                          order.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
                <button
                  onClick={() => setReturnsExpanded(!returnsExpanded)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-neutral-950 dark:text-white" />
                    <span className="text-sm font-medium text-[var(--text)]">Returns & Refund Policy</span>
                  </div>
                  {returnsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {returnsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-sm"
                    >
                      <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/[0.04]">
                        <p className="font-semibold text-[var(--text)]">Returns within 14 days</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                          Items must be unworn, unwashed, and returned with original tags attached.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={isCreatingOrder || items.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 text-base py-4"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Order...
                  </>
                ) : form.payment_type === 'card' ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay with Card
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Pay with Mobile Money
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
              <p className="text-xs text-[var(--text-secondary)] text-center mt-3">
                Secure payment by Snippe · WhatsApp +255 747 110 777
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] pt-16 flex items-center justify-center">
          <div className="text-[var(--text-secondary)]">Loading...</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
