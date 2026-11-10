'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext.jsx';

export default function Protected({ children, admin = false }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
    } else if (!loading && admin && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [admin, loading, pathname, router, user]);

  if (loading || !user || (admin && user.role !== 'admin')) {
    return <div className="spinner" />;
  }

  return children;
}
