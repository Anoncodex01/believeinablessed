// contexts/AffiliateContext.jsx
'use client';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useSearchParams, usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { trackClick } from '@/lib/api';

const AffiliateContext = createContext();

function trackAffiliateVisit(referralCode, productId = null, source = 'landing') {
  if (!referralCode || typeof window === 'undefined') return;

  const code = String(referralCode).trim().toUpperCase();
  const key = `bib_click_${code}_${productId || 'landing'}`;

  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // ignore
  }

  trackClick({
    referral_code: code,
    product_id: productId || undefined,
    source,
  }).catch(() => {});
}

function AffiliateProviderInner({ setRefCode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const trackedLanding = useRef(false);

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');

    if (refFromUrl) {
      const code = String(refFromUrl).trim().toUpperCase();
      Cookies.set('bib_ref', code, { expires: 30, path: '/' });
      setRefCode(code);

      if (!trackedLanding.current) {
        trackedLanding.current = true;
        const productMatch = pathname?.match(/^\/products\/([^/?#]+)/);
        trackAffiliateVisit(code, productMatch?.[1] || null, productMatch ? 'product' : 'landing');
      }
    } else {
      const refFromCookie = Cookies.get('bib_ref');
      if (refFromCookie) {
        setRefCode(String(refFromCookie).trim().toUpperCase());
      }
    }
  }, [searchParams, pathname, setRefCode]);

  return null;
}

export function AffiliateProvider({ children }) {
  const [refCode, setRefCode] = useState('');

  const clearRef = useCallback(() => {
    Cookies.remove('bib_ref', { path: '/' });
    setRefCode('');
  }, []);

  const addRefToUrl = useCallback((url) => {
    if (!refCode) return url;
    if (url.startsWith('/auth/')) return url;
    if (url.includes('?ref=') || url.includes('&ref=')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}ref=${refCode}`;
  }, [refCode]);

  const trackProductClick = useCallback((productId) => {
    const code = refCode || Cookies.get('bib_ref');
    if (!code) return;
    trackAffiliateVisit(code, productId, 'product');
  }, [refCode]);

  return (
    <AffiliateContext.Provider value={{
      refCode,
      setRefCode,
      clearRef,
      addRefToUrl,
      hasRef: !!refCode,
      trackProductClick,
    }}>
      <Suspense fallback={null}>
        <AffiliateProviderInner setRefCode={setRefCode} />
      </Suspense>
      {children}
    </AffiliateContext.Provider>
  );
}

export function useAffiliate() {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
}
