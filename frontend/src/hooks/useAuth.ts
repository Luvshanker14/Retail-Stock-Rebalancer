// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function useAuth(protectedRoute = true) {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem('adminToken');

//     if (!token && protectedRoute) {
//       router.push('/admin/login'); // redirect if not authenticated
//     } else {
//       setLoading(false); // token is present
//     }
//   }, [protectedRoute, router]);

//   return { loading };
// }

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {jwtDecode} from 'jwt-decode';

interface AdminPayload {
  email: string;
  id: number;
  exp: number;
  iat: number;
}

export default function useAuth(protectedRoute = true) {
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    if (!token && protectedRoute) {
      router.push('/admin/login');
    } else {
      try {
        const decoded = jwtDecode<AdminPayload>(token!);
        setAdminEmail(decoded.email);
      } catch (err) {
        console.error('Invalid token');
        if (protectedRoute) router.push('/admin/login');
      }
      setLoading(false);
    }
  }, [protectedRoute, router]);

  return { loading, adminEmail };
}

