// providers.jsx
'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { LangProvider } from '../contexts/LangContext';
import { AffiliateProvider } from '../contexts/AffiliateContext'; // ✅ Import
import { Toaster } from 'react-hot-toast';
import WhatsAppButton from './ui/WhatsAppButton';

export default function Providers({ children }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="bib_theme"
    >
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <AffiliateProvider>  {/* ✅ Wrap with AffiliateProvider */}
              {children}
              <WhatsAppButton />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-color)',
                    borderRadius: '12px',
                    border: '1px solid var(--toast-border)',
                  },
                }}
              />
            </AffiliateProvider>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
