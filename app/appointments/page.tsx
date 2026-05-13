'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Appointments are now managed inside the /dashboard page (Appointments tab)
export default function AppointmentsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080814' }}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );
}
