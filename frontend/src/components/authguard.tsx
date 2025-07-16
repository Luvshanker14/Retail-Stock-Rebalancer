'use client';
import useAuth from '@/hooks/useAuth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  useAuth(); // do auth check
  return <>{children}</>;
}