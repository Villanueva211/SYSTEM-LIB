import Link from 'next/link';
import { SignUpForm } from '@/components/forms/SignUpForm';
import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Sign Up — LibraryMS',
  description: 'Create a student account to start borrowing books, reserving titles, and booking study rooms.',
};

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden" style={{ background: '#080814' }}>

      {/* Ambient orbs */}
      <div className="orb orb-violet w-96 h-96 -top-20 -right-20 opacity-50" />
      <div className="orb orb-indigo w-80 h-80 bottom-0 -left-20 opacity-40" />

      <div className="relative z-10 w-full max-w-md animate-slideUp">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              <BookOpen size={18} />
            </div>
            <span className="font-bold text-xl text-white">Library<span className="gradient-text">MS</span></span>
          </Link>
          <h1 className="text-3xl font-black text-white">Create account</h1>
          <p className="text-slate-400 mt-2 text-sm">Join the library — start borrowing today</p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <SignUpForm />
          <div className="mt-6 pt-6 border-t border-white/06 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
