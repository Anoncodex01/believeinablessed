// components/ui/AffiliateLink.jsx
'use client';
import Link from 'next/link';
import { useAffiliate } from '@/contexts/AffiliateContext';

export default function AffiliateLink({ href, children, ...props }) {
  const { addRefToUrl } = useAffiliate();
  
  const finalHref = addRefToUrl(href);
  
  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  );
}