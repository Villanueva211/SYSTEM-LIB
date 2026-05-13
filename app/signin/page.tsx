'use client';
import Link from 'next/link';
import { SignInForm } from '@/components/forms/SignInForm';
import { BookOpen, BookMarked, Clock, Bell, Shield, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';

const FLOATING_ICONS = [
  { Icon: BookOpen,   x: '8%',  y: '15%', delay: '0s',   size: 20, opacity: 0.18 },
  { Icon: BookMarked, x: '85%', y: '10%', delay: '0.8s', size: 16, opacity: 0.14 },
  { Icon: Clock,      x: '5%',  y: '60%', delay: '1.6s', size: 18, opacity: 0.16 },
  { Icon: Bell,       x: '90%', y: '55%', delay: '0.4s', size: 14, opacity: 0.12 },
  { Icon: Shield,     x: '15%', y: '85%', delay: '2s',   size: 16, opacity: 0.14 },
  { Icon: Users,      x: '80%', y: '80%', delay: '1.2s', size: 18, opacity: 0.16 },
  { Icon: BookOpen,   x: '50%', y: '5%',  delay: '2.4s', size: 14, opacity: 0.10 },
  { Icon: BookMarked, x: '92%', y: '35%', delay: '1.8s', size: 12, opacity: 0.10 },
];

const FEATURES = [
  { icon: BookOpen,   text: 'Browse 12,000+ books' },
  { icon: Clock,      text: 'Track borrows in real-time' },
  { icon: Bell,       text: 'Smart due date alerts' },
  { icon: Shield,     text: 'Secure role-based access' },
];

export default function SignInPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.05,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative min-h-screen flex overflow-hidden" style={{ background: '#060610' }}>

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" style={{ opacity: 0.8 }} />

      {/* Ambient orbs */}
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(40px)', animation: 'pulse 8s ease-in-out infinite' }} />
      <div className="absolute top-1/2 -right-60 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(50px)', animation: 'pulse 10s ease-in-out infinite 2s' }} />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse 12s ease-in-out infinite 4s' }} />

      {/* Floating icons */}
      {FLOATING_ICONS.map(({ Icon, x, y, delay, size, opacity }, i) => (
        <div key={i} className="absolute pointer-events-none z-0" style={{ left: x, top: y, opacity, animation: `float ${6 + i * 0.5}s ease-in-out infinite`, animationDelay: delay }}>
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(4px)' }}>
            <Icon size={size} className="text-indigo-400" />
          </div>
        </div>
      ))}

      {/* ── LEFT PANEL — Branding ───────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] flex-shrink-0 relative z-10 p-12"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 group w-fit">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.5)' }}>
            <BookOpen size={20} />
          </div>
          <span className="font-black text-2xl text-white">Library<span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MS</span></span>
        </Link>

        {/* Center content */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-300 mb-6"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            ✦ Smart Library Platform
          </div>
          <h2 className="text-5xl font-black text-white leading-tight mb-4">
            Your campus<br />
            library,{' '}
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              reimagined
            </span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
            Borrow books, reserve titles, book study rooms, and manage everything in one beautiful system — built for students and librarians.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Icon size={14} className="text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[['10k+', 'Books'], ['500+', 'Students'], ['99.9%', 'Uptime']].map(([v, l]) => (
            <div key={l} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-lg font-black" style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</p>
              <p className="text-xs text-slate-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-12">
        <div className="w-full max-w-md" style={{ animation: 'slideUp 0.6s ease-out both' }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
                <BookOpen size={18} />
              </div>
              <span className="font-black text-xl text-white">Library<span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MS</span></span>
            </Link>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Welcome back 👋</h1>
            <p className="text-slate-400 text-sm">Sign in to access your library account</p>
          </div>

          {/* Glowing card */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl -z-10 scale-95"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' }} />

            <div className="rounded-2xl p-8"
              style={{ background: 'rgba(13,13,35,0.85)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.4)' }}>

              <SignInForm />

              <div className="mt-6 pt-5 border-t text-center text-sm text-slate-500" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Register as student
                </Link>
              </div>
            </div>
          </div>

          {/* Demo creds */}
          <div className="mt-4 rounded-xl p-4 text-xs space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-slate-300 font-semibold flex items-center gap-1.5">📋 Demo Accounts</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">👑</span>
                <span className="text-slate-500">Admin:</span>
                <span className="text-indigo-400 font-mono text-[11px]">jayvee.villanueva@urios.edu.ph</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">📖</span>
                <span className="text-slate-500">Student:</span>
                <span className="text-indigo-400 font-mono text-[11px]">student@library.com</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 font-mono text-[11px]">student123</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(3deg); }
          66% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.35; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
