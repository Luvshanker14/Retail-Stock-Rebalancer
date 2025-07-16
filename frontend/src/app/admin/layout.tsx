'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/authguard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Don't apply AuthGuard for password setup page
  if (pathname === '/admin/setup-password') {
    return <>{children}</>;
  }
  return <AuthGuard>{children}</AuthGuard>;
}
