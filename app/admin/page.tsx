'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Book, Borrow, Reservation, Appointment, LibraryUser, Settings } from '@/types/library';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminBooks } from '@/components/admin/AdminBooks';
import { AdminBorrows } from '@/components/admin/AdminBorrows';
import { AdminReservations } from '@/components/admin/AdminReservations';
import { AdminAppointments } from '@/components/admin/AdminAppointments';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminReports } from '@/components/admin/AdminReports';
import { AdminSettings } from '@/components/admin/AdminSettings';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, BookOpen, Users, BarChart3, Bell, Menu, Shield } from 'lucide-react';

type Tab = 'overview'|'books'|'borrows'|'reservations'|'appointments'|'users'|'reports'|'settings';

const DEFAULT_SETTINGS: Settings = { id:1, library_name:'Library System', max_borrow_days:7, max_books_per_member:3, fine_per_day:5, allow_renewals:true, max_renewals:1 };

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [fetching, setFetching] = useState(true);

  const ADMIN_EMAILS = ['jayvee.villanueva@urios.edu.ph'];
  const isAdmin = user && (user.role === 'admin' || ADMIN_EMAILS.includes(user.email?.toLowerCase() || ''));
  useEffect(() => { if (!loading && !isAdmin) router.push('/dashboard'); }, [user, loading, isAdmin, router]);

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const [bRes, brRes, rRes, apRes, uRes, sRes] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending:false }),
        supabase.from('borrows').select('*, user:users(name,email), book:books(title,author,available_copies)').order('created_at', { ascending:false }),
        supabase.from('reservations').select('*, user:users(name,email), book:books(title,author,available_copies)').order('created_at', { ascending:false }),
        supabase.from('appointments').select('*, user:users(name,email)').order('created_at', { ascending:false }),
        supabase.from('users').select('*').order('created_at', { ascending:false }),
        supabase.from('settings').select('*').eq('id', 1).single(),
      ]);
      setBooks(bRes.data || []);
      setBorrows(brRes.data || []);
      setReservations(rRes.data || []);
      setAppointments(apRes.data || []);
      setUsers(uRes.data || []);
      if (sRes.data) setSettings(sRes.data);
    } catch (err) {
      console.error('fetchAll error:', err);
      // Don't block UI — show empty state instead
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin, fetchAll]);

  // ── Real-time subscriptions ──────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-realtime')

      // New borrow request
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'borrows' },
        async (payload) => {
          // Fetch full record with user+book info
          const { data } = await supabase
            .from('borrows')
            .select('*, user:users(name,email), book:books(title,author,available_copies)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setBorrows(prev => [data, ...prev]);
            toast.success(`📚 New borrow request!\n${data.user?.name} wants "${data.book?.title}"`, { duration: 5000 });
          }
        }
      )

      // Borrow status update (returned, approved, etc.)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'borrows' },
        () => { fetchAll(); }
      )

      // New appointment request
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' },
        async (payload) => {
          const { data } = await supabase
            .from('appointments')
            .select('*, user:users(name,email)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setAppointments(prev => [data, ...prev]);
            toast.success(`📅 New appointment!\n${data.user?.name} booked ${data.type?.replace('_',' ')} on ${data.date}`, { duration: 5000 });
          }
        }
      )

      // New reservation
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' },
        async (payload) => {
          const { data } = await supabase
            .from('reservations')
            .select('*, user:users(name,email), book:books(title,author,available_copies)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setReservations(prev => [data, ...prev]);
            toast(`🔖 New reservation!\n${data.user?.name} reserved "${data.book?.title}"`, { duration: 4000 });
          }
        }
      )

      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchAll]);



  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#080814' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading admin panel…</p>
      </div>
    </div>
  );
  if (!user || !isAdmin) return null;

  const pendingBorrows = borrows.filter(b => b.status === 'pending').length;
  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const overdue = borrows.filter(b => b.status === 'approved' && b.due_date && new Date(b.due_date) < new Date());

  return (
    <div className="flex" style={{ background:'#080814', minHeight:'100vh' }}>
      <AdminSidebar
        tab={tab} setTab={setTab}
        userName={user.name}
        pendingCount={pendingBorrows + pendingAppts}
        signOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/06 sticky top-0 z-30" style={{ background:'rgba(8,8,20,0.97)', backdropFilter:'blur(12px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/08 transition-all">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Library Admin</span>
          </div>
          {(pendingBorrows + pendingAppts) > 0 && (
            <span className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background:'#ef4444' }}>
              {pendingBorrows + pendingAppts}
            </span>
          )}
          {(pendingBorrows + pendingAppts) === 0 && <div className="w-6" />}
        </div>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {tab === 'overview' && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-black text-white mb-1">Welcome, {user.name} 👋</h1>
            <p className="text-slate-400 text-sm mb-8">Here's what's happening in {settings.library_name}</p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {[
                { label:'Total Books', value: books.filter(b=>!b.archived).length, color:'#6366f1', icon:<BookOpen size={18}/> },
                { label:'Active Borrows', value: borrows.filter(b=>b.status==='approved').length, color:'#10b981', icon:<Clock size={18}/> },
                { label:'Pending Requests', value: pendingBorrows + pendingAppts, color:'#f59e0b', icon:<Bell size={18}/> },
                { label:'Total Members', value: users.filter(u=>u.role!=='admin').length, color:'#8b5cf6', icon:<Users size={18}/> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="stat-card group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background:`${color}18`, border:`1px solid ${color}30` }}>
                    <span style={{ color }}>{icon}</span>
                  </div>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending borrow requests */}
              <div className="glass rounded-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
                  <h2 className="font-bold text-white text-sm">Pending Borrow Requests</h2>
                  <button onClick={() => setTab('borrows')} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
                </div>
                <div className="p-4 space-y-2">
                  {borrows.filter(b=>b.status==='pending').slice(0,4).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.1)' }}>
                      <div>
                        <p className="text-sm font-semibold text-white">{b.book?.title}</p>
                        <p className="text-xs text-slate-500">by {b.user?.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          const due = new Date(); due.setDate(due.getDate()+7);
                          await supabase.from('borrows').update({ status:'approved', borrow_date: new Date().toISOString().split('T')[0], due_date: due.toISOString().split('T')[0] }).eq('id', b.id);
                          await supabase.from('books').update({ available_copies: Math.max(0, (b.book?.available_copies ?? 1) - 1) }).eq('id', b.book_id);
                          await supabase.from('notifications').insert([{ user_id: b.user_id, title: 'Borrow Approved! 📚', message: `"${b.book?.title}" has been approved. Return by: ${due.toISOString().split('T')[0]}.`, type: 'success' }]);
                          toast.success('Approved!'); fetchAll();
                        }} className="p-1.5 rounded-lg" style={{ color:'#6ee7b7', background:'rgba(16,185,129,0.15)' }}><CheckCircle size={14}/></button>
                        <button onClick={async () => {
                          await supabase.from('borrows').update({ status:'declined' }).eq('id', b.id);
                          await supabase.from('notifications').insert([{ user_id: b.user_id, title: 'Borrow Request Declined', message: `Your request for "${b.book?.title}" was declined. Please contact the librarian.`, type: 'error' }]);
                          setBorrows(p=>p.map(x=>x.id===b.id?{...x,status:'declined'}:x));
                          toast.success('Declined');
                        }} className="p-1.5 rounded-lg" style={{ color:'#fca5a5', background:'rgba(239,68,68,0.1)' }}><XCircle size={14}/></button>
                      </div>
                    </div>
                  ))}
                  {borrows.filter(b=>b.status==='pending').length === 0 && <p className="text-center py-8 text-slate-500 text-sm">No pending requests</p>}
                </div>
              </div>

              {/* Overdue books */}
              <div className="glass rounded-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/06">
                  <h2 className="font-bold text-white text-sm">Overdue Books</h2>
                  <span className="badge-cancelled">{overdue.length} overdue</span>
                </div>
                <div className="p-4 space-y-2">
                  {overdue.slice(0,4).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.1)' }}>
                      <div>
                        <p className="text-sm font-semibold text-white">{b.book?.title}</p>
                        <p className="text-xs text-red-400">Due: {b.due_date} · {b.user?.name}</p>
                      </div>
                      <span className="text-xs text-red-400 font-bold">{Math.floor((Date.now()-new Date(b.due_date).getTime())/86400000)}d</span>
                    </div>
                  ))}
                  {overdue.length === 0 && <p className="text-center py-8 text-slate-500 text-sm">No overdue books 🎉</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'books'        && <AdminBooks books={books} setBooks={setBooks} />}
        {tab === 'borrows'      && <AdminBorrows borrows={borrows} setBorrows={setBorrows} onRefresh={fetchAll} />}
        {tab === 'reservations' && <AdminReservations reservations={reservations} setReservations={setReservations} />}
        {tab === 'appointments' && <AdminAppointments appointments={appointments} setAppointments={setAppointments} />}
        {tab === 'users'        && <AdminUsers users={users} setUsers={setUsers} borrows={borrows} currentUserId={user.id} />}
        {tab === 'reports'      && <AdminReports books={books} borrows={borrows} appointments={appointments} />}
        {tab === 'settings'     && <AdminSettings settings={settings} setSettings={setSettings} />}
      </main>
      </div>
    </div>
  );
}
