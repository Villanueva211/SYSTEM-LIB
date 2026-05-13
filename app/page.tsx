import Link from 'next/link';
import { BookOpen, Clock, Bell, BarChart3, Shield, Users, BookMarked, Search } from 'lucide-react';

export const metadata = {
  title: 'LibraryMS — Smart Library Management System',
  description: 'A modern library management system for students and librarians. Borrow books, reserve titles, book study rooms, and manage the collection with ease.',
};

const features = [
  { icon: BookOpen,   title: 'Book Catalog',         desc: 'Browse thousands of titles, search by author or category, and borrow in one click.' },
  { icon: Clock,      title: 'Borrow Tracking',      desc: 'Real-time status updates for all borrows — pending, active, overdue, and returned.' },
  { icon: Bell,       title: 'Smart Notifications',  desc: 'Instant alerts for due dates, reservation availability, and appointment confirmations.' },
  { icon: BarChart3,  title: 'Reports & Analytics',  desc: 'Visual dashboards for librarians — most borrowed books, trends, overdue reports.' },
  { icon: Shield,     title: 'Role-Based Access',     desc: 'Separate admin and student portals with granular permissions and secure authentication.' },
  { icon: BookMarked, title: 'Reservations',          desc: 'Join a waitlist for unavailable books and get notified automatically when they\'re back.' },
];

const stats = [
  ['10k+', 'Books Available'],
  ['500+', 'Active Members'],
  ['99.9%', 'Uptime'],
];

export default function Home() {
  return (
    <div className="relative overflow-hidden" style={{ background: '#080814' }}>

      {/* Ambient orbs */}
      <div className="orb orb-indigo w-[600px] h-[600px] -top-40 -left-40 opacity-60" />
      <div className="orb orb-violet w-[500px] h-[500px] top-20 right-0 opacity-40" />
      <div className="orb orb-cyan   w-[400px] h-[400px] top-[60%] left-1/3 opacity-30" />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300 mb-8 animate-fadeIn"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
          ✦ Smart Library Management Platform
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-6 animate-slideUp">
          Your library,{' '}
          <span className="gradient-text">reimagined</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fadeIn">
          Effortless book borrowing, study room reservations, smart notifications —
          everything students and librarians need in one beautiful system.
        </p>

        <div className="flex gap-4 justify-center flex-wrap animate-fadeIn">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            <BookOpen size={16} /> Get Started →
          </Link>
          <Link href="/signin"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-300 text-sm transition-all duration-200 hover:text-white hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex gap-8 sm:gap-16 justify-center mt-16 animate-fadeIn">
          {stats.map(([num, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl sm:text-3xl font-black gradient-text">{num}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Everything you <span className="gradient-text">need</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            A complete library management toolkit, beautifully designed for the modern campus.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="glass p-6 group hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <Icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Simple for <span className="gradient-text">everyone</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Students */}
          <div className="glass p-7 rounded-2xl" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <Users size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-bold text-white">For Students</p>
                <p className="text-xs text-slate-500">Member portal</p>
              </div>
            </div>
            <ul className="space-y-3">
              {['Browse & search the full book catalog','Request borrows — get notified on approval','Reserve unavailable books, join the queue','Book study rooms or meet the librarian','Track dues, renewals, and borrow history'].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Search size={14} /> Browse Books →
            </Link>
          </div>

          {/* Librarians */}
          <div className="glass p-7 rounded-2xl" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <Shield size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="font-bold text-white">For Librarians</p>
                <p className="text-xs text-slate-500">Admin portal</p>
              </div>
            </div>
            <ul className="space-y-3">
              {['Manage the full book catalog (add, edit, archive)','Approve or decline borrow requests','Track active borrows and flag overdue books','Manage reservations and notify next in queue','View analytics, export CSV reports, configure fines'].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="text-violet-400 mt-0.5 flex-shrink-0">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/signin" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-all duration-200 hover:text-white hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Shield size={14} /> Admin Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div
          className="glass p-12 rounded-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div className="orb orb-indigo w-64 h-64 -top-20 -right-20 opacity-40" />
          <h2 className="text-4xl font-black text-white mb-4 relative z-10">
            Ready to get <span className="gradient-text">started?</span>
          </h2>
          <p className="text-slate-400 mb-8 text-lg relative z-10">
            Join your campus library system — borrow smarter, never miss a due date.
          </p>
          <Link href="/signup" className="relative z-10 inline-flex items-center gap-2 px-10 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            <BookOpen size={16} /> Create Student Account →
          </Link>
        </div>
      </section>

    </div>
  );
}
