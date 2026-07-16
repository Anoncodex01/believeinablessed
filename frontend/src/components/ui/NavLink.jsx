// components/ui/NavLink.jsx
'use client';
import Link from 'next/link';
import { useAffiliate } from '@/contexts/AffiliateContext';

export default function NavLink({ href, children, ...props }) {
  const { addRefToUrl } = useAffiliate();
  
  // Don't add ref to auth pages (login, register)
  if (href.startsWith('/auth/')) {
    return <Link href={href} {...props}>{children}</Link>;
  }
  
  const finalHref = addRefToUrl(href);
  return <Link href={finalHref} {...props}>{children}</Link>;
}