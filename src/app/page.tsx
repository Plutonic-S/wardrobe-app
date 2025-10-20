
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/features/auth/components/authGuard';

export default function HomePage() {
  const router = useRouter();
  const { user, isChecking } = useAuthGuard({
    requireAuth: false,
  });

  useEffect(() => {
    if (!isChecking) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If user is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, isChecking, router]);

  // Show loading state while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
