'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0d0d1f',
            color: '#e2e8f0',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontSize: '0.875rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0d0d1f' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0d0d1f' },
          },
        }}
      />
    </>
  );
}
