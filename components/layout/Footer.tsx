import Link from 'next/link';
import { Calendar, Twitter, Github, Mail } from 'lucide-react';

export const Footer = () => (
  <footer className="border-t border-white/06 mt-auto" style={{ background: 'rgba(4,4,12,0.8)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            AB
          </div>
          <span className="font-bold text-white">Auto<span className="gradient-text">Book</span></span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link href="/appointments" className="hover:text-slate-300 transition-colors">Appointments</Link>
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
          <Link href="/signin" className="hover:text-slate-300 transition-colors">Sign In</Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} AutoBook. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
