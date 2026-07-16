// contexts/AffiliateContext.jsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSearchParams, usePathname } from 'next/navigation';
import { Suspense } from 'react';

const AffiliateContext = createContext();

// Separate component that uses useSearchParams
function AffiliateProviderInner({ children, setRefCode }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL params first (highest priority)
    const refFromUrl = searchParams.get('ref');
    
    if (refFromUrl) {
      Cookies.set('bib_ref', refFromUrl, { expires: 30, path: '/' });
      setRefCode(refFromUrl);
      console.log('✅ Affiliate ref set from URL:', refFromUrl);
    } else {
      const refFromCookie = Cookies.get('bib_ref');
      if (refFromCookie) {
        setRefCode(refFromCookie);
        console.log('✅ Affiliate ref loaded from cookie:', refFromCookie);
      }
    }
  }, [searchParams, setRefCode]);

  return null; // This component just handles the logic
}

export function AffiliateProvider({ children }) {
  const [refCode, setRefCode] = useState('');

  const clearRef = () => {
    Cookies.remove('bib_ref', { path: '/' });
    setRefCode('');
    console.log('❌ Affiliate ref cleared');
  };

  const addRefToUrl = (url) => {
    if (!refCode) return url;
    
    if (url.startsWith('/auth/')) return url;
    
    if (url.includes('?ref=') || url.includes('&ref=')) {
      return url;
    }
    
    const separator = url.includes('?') ? '&' : '?';
    const newUrl = `${url}${separator}ref=${refCode}`;
    console.log('🔗 Adding ref to URL:', url, '->', newUrl);
    return newUrl;
  };

  return (
    <AffiliateContext.Provider value={{ 
      refCode, 
      setRefCode, 
      clearRef, 
      addRefToUrl,
      hasRef: !!refCode 
    }}>
      {/* Wrap the search params logic in Suspense */}
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