// 'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface CustomerPayload {
  email: string;
  id: number;
  exp: number;
  iat: number;
}

export default function useCustomerAuth(protectedRoute = true) {
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');

    if (!token && protectedRoute) {
      router.push('/customer/login');
    } else {
      try {
        const decoded = jwtDecode<CustomerPayload>(token!);
        setCustomerEmail(decoded.email);
      } catch (err) {
        console.error('Invalid token');
        if (protectedRoute) router.push('/customer/login');
      }
      setLoading(false);
    }
  }, [protectedRoute, router]);

  return { loading, customerEmail };
} 