'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { BookOpen, Clock, Bell, Calendar, User, LogOut, Search, RotateCcw, X, BookMarked, LayoutDashboard, Menu } from 'lucide-react';

type Tab = 'dashboard'|'browse'|'borrows'|'reservations'|'appointments'|'notifications'|'profile';

const SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [apptForm, setApptForm] = useState({ date:'', time:'', type:'study_room', room:'Room A', notes:'' });
  const [profileForm, setProfileForm] = useState({ name:'', email:'' });

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [bkRes, brRes, rRes, apRes, nRes, fRes] = await Promise.all([
        supabase.from('books').select('*').neq('archived', true).order('title'),
        supabase.from('borrows').select('*, book:books(title,author)').eq('user_id', user.id).order('created_at', { ascending:false }),
        supabase.from('reservations').select('*, book:books(title,author)').eq('user_id', user.id).order('created_at', { ascending:false }),
        supabase.from('appointments').select('*').eq('user_id', user.id).order('date', { ascending:false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending:false }),
        supabase.from('fines').select('*, borrow:borrows(book:books(title))').eq('user_id', user.id).order('created_at', { ascending:false }),
      ]);
      setBooks(bkRes.data||[]);
      setBorrows(brRes.data||[]);
      setReservations(rRes.data||[]);
      setAppointments(apRes.data||[]);
      setNotifications(nRes.data||[]);
      setFines(fRes.data||[]);
    } catch (err) {
      console.error('Dashboard fetchAll error:', err);
    }
  }, [user]);

  useEffect(() => { if (!loading && !user) router.push('/signin'); }, [user, loading, router]);
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name||'', email: user.email||'' });
      fetchAll();
    }
  }, [user, fetchAll]);

  // Real-time: new notification for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`student-notifs-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as any, ...prev]);
          toast(`🔔 ${(payload.new as any).title}`, { duration: 5000 });
        }
      )
      // When borrows are updated (approved/returned) — refresh borrow list
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'borrows', filter: `user_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAll]);

  // Ensure this user has a row in public.users (needed for FK on borrows/reservations)
  const ensureUserRow = async () => {
    if (!user) return false;
    const { data } = await supabase.from('users').select('id').eq('id', user.id).single();
    if (!data) {
      const { error: insertErr } = await supabase.from('users').insert([{
        id: user.id, email: user.email, name: user.name || user.email.split('@')[0], role: 'user'
      }]);
      if (insertErr) {
        toast.error('Account setup failed. Please sign out and sign in again.');
        return false;
      }
    }
    return true;
  };

  const borrowBook = async (book: any) => {
    if (!user) return;
    // Check borrow limit
    const active = borrows.filter(b => ['pending','approved'].includes(b.status)).length;
    if (active >= 3) { toast.error('You have reached the maximum of 3 active borrows'); return; }
    // Check already borrowed/pending
    const alreadyHas = borrows.find(b => b.book_id === book.id && ['pending','approved'].includes(b.status));
    if (alreadyHas) { toast.error('You already have this book borrowed or pending'); return; }
    // Ensure user row exists
    const ok = await ensureUserRow();
    if (!ok) return;
    const { error } = await supabase.from('borrows').insert([{ user_id: user.id, book_id: book.id, status: 'pending' }]);
    if (error) {
      console.error('Borrow error:', error);
      toast.error(error.message || 'Failed to submit borrow request');
      return;
    }
    toast.success('Borrow request submitted! Awaiting librarian approval.');
    setSelectedBook(null);
    fetchAll();
  };

  const reserveBook = async (book: any) => {
    if (!user) return;
    // Check already reserved
    const alreadyReserved = reservations.find(r => r.book_id === book.id && ['waiting','notified'].includes(r.status));
    if (alreadyReserved) { toast.error('You already have a reservation for this book'); return; }
    // Ensure user row exists
    const ok = await ensureUserRow();
    if (!ok) return;
    // Calculate queue position
    const { count } = await supabase.from('reservations').select('*', { count:'exact', head:true }).eq('book_id', book.id).eq('status', 'waiting');
    const { error } = await supabase.from('reservations').insert([{ user_id: user.id, book_id: book.id, status: 'waiting', queue_position: (count || 0) + 1 }]);
    if (error) {
      console.error('Reserve error:', error);
      toast.error(error.message || 'Failed to submit reservation');
      return;
    }
    toast.success('Reserved! You will be notified when available.');
    setSelectedBook(null);
    fetchAll();
  };

  const renewBorrow = async (b: any) => {
    const due = new Date(b.due_date); due.setDate(due.getDate()+7);
    await supabase.from('borrows').update({ due_date: due.toISOString().split('T')[0], renewed_count:(b.renewed_count||0)+1 }).eq('id', b.id);
    toast.success('Renewed for 7 more days!');
    fetchAll();
  };

  const cancelReservation = async (id: string) => {
    await supabase.from('reservations').update({ status:'cancelled' }).eq('id', id);
    toast.success('Reservation cancelled');
    fetchAll();
  };

  const bookAppointment = async () => {
    if (!apptForm.date || !apptForm.time) { toast.error('Pick date and time'); return; }
    const end = apptForm.time.split(':'); end[0] = String(parseInt(end[0])+1);
    await supabase.from('appointments').insert([{ user_id: user!.id, ...apptForm, start_time: apptForm.time, end_time: end.join(':'), status:'pending' }]);
    toast.success('Appointment requested!');
    setApptForm({ date:'', time:'', type:'study_room', room:'Room A', notes:'' });
    fetchAll();
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read:true }).eq('id', id);
    setNotifications(p => p.map(n => n.id===id ? {...n, read:true} : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read:true }).eq('user_id', user.id).eq('read', false);
    setNotifications(p => p.map(n => ({...n, read:true})));
  };

  const saveProfile = async () => {
    await supabase.from('users').update({ name: profileForm.name }).eq('id', user!.id);
    toast.success('Profile updated!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'#080814' }}>
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
      </div>
    );
  }
  if (!user) return null;

  const active = borrows.filter(b => b.status==='approved');
  const pending = borrows.filter(b => b.status==='pending');
  const overdue = active.filter(b => b.due_date && new Date(b.due_date) < new Date());
  const unread = notifications.filter(n => !n.read).length;
  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    return (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) && (catFilter==='All'||b.category===catFilter);
  });
  const cats = ['All',...Array.from(new Set(books.map((b:any)=>b.category)))];

  const STATUS_CLS: Record<string,string> = { pending:'badge-no-show', approved:'badge-confirmed', declined:'badge-cancelled', returned:'badge-completed', waiting:'badge-no-show', notified:'badge-confirmed', cancelled:'badge-cancelled' };

  const nav = [
    { id:'dashboard' as Tab, label:'Dashboard', icon:<LayoutDashboard size={16}/> },
    { id:'browse' as Tab, label:'Browse Books', icon:<Search size={16}/> },
    { id:'borrows' as Tab, label:'My Borrows', icon:<Clock size={16}/>, badge: pending.length },
    { id:'reservations' as Tab, label:'Reservations', icon:<BookMarked size={16}/> },
    { id:'appointments' as Tab, label:'Appointments', icon:<Calendar size={16}/> },
    { id:'notifications' as Tab, label:'Notifications', icon:<Bell size={16}/>, badge: unread },
    { id:'profile' as Tab, label:'Profile', icon:<User size={16}/> },
  ];

  return (
    <div className="flex" style={{ background:'#080814', minHeight:'100vh' }}>

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/06 transition-transform duration-300 ease-in-out w-72 lg:w-60 lg:relative lg:translate-x-0 lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background:'rgba(8,8,20,0.98)' }}
      >
        <div className="p-5 border-b border-white/06 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{user.name?.charAt(0).toUpperCase()}</div>
            <div className="min-w-0"><p className="font-bold text-white text-sm truncate">{user.name}</p><p className="text-xs text-slate-500 truncate">{user.email}</p></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/05 transition-all flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ id, label, icon, badge }) => (
            <button key={id} onClick={() => { setTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===id?'text-indigo-300':'text-slate-500 hover:text-slate-300 hover:bg-white/04'}`}
              style={tab===id?{background:'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))',border:'1px solid rgba(99,102,241,0.2)'}:{}}>
              {icon}{label}
              {!!badge && <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{background:'#ef4444'}}>{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 space-y-2 border-t border-white/06">
          {[{l:'Active',v:active.length,c:'#10b981'},{l:'Overdue',v:overdue.length,c:'#ef4444'},{l:'Pending',v:pending.length,c:'#f59e0b'}].map(({l,v,c})=>(
            <div key={l} className="flex items-center justify-between px-3 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
              <span className="text-xs text-slate-500">{l}</span><span className="text-sm font-bold" style={{color:c}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/06">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/08 transition-all"><LogOut size={16}/>Sign Out</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/06 sticky top-0 z-30" style={{ background:'rgba(8,8,20,0.97)', backdropFilter:'blur(12px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/08 transition-all">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">LibraryMS</span>
          </div>
          <button onClick={() => { setTab('notifications'); setSidebarOpen(false); }} className="relative p-2 rounded-xl text-slate-400 hover:text-white transition-all">
            <Bell size={20} />
            {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{background:'#ef4444'}}>{unread}</span>}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-8">

        {/* DASHBOARD */}
        {tab==='dashboard' && (
          <div className="animate-fadeIn max-w-4xl">
            <h1 className="text-2xl lg:text-3xl font-black text-white mb-1">Welcome, {user.name} 👋</h1>
            <p className="text-slate-400 text-sm mb-6 lg:mb-8">Here's your library activity</p>
            <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
              {[{label:'Books Borrowed',value:borrows.filter(b=>b.status==='approved').length,color:'#6366f1'},{label:'Pending Requests',value:pending.length,color:'#f59e0b'},{label:'Overdue',value:overdue.length,color:'#ef4444'}].map(({label,value,color})=>(
                <div key={label} className="stat-card"><p className="text-2xl font-black mb-1" style={{color}}>{value}</p><p className="text-xs text-slate-500">{label}</p></div>
              ))}
            </div>
            {overdue.length>0 && (
              <div className="glass rounded-2xl p-5 mb-6 border border-red-500/20">
                <h2 className="font-bold text-red-400 mb-3">⚠️ Overdue Books</h2>
                {overdue.map(b=>(
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{background:'rgba(239,68,68,0.05)'}}>
                    <div><p className="text-sm font-semibold text-white">{b.book?.title}</p><p className="text-xs text-red-400">Due: {b.due_date}</p></div>
                  </div>
                ))}
              </div>
            )}
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4">My Active Borrows</h2>
              {active.length===0 ? <p className="text-slate-500 text-sm text-center py-8">No active borrows. <button onClick={()=>setTab('browse')} className="text-indigo-400 hover:underline">Browse books</button></p>
                : active.map(b=>(
                  <div key={b.id} className="flex items-center justify-between p-4 rounded-xl mb-2" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                    <div><p className="text-sm font-semibold text-white">{b.book?.title}</p><p className="text-xs text-slate-500">Due: {b.due_date}</p></div>
                    <span className="badge-confirmed">active</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* BROWSE */}
        {tab==='browse' && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl lg:text-3xl font-black text-white mb-2">Browse Books</h1>
            <p className="text-slate-400 text-sm mb-5 lg:mb-6">Search and borrow from our collection</p>
            <div className="flex gap-3 mb-5 lg:mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[160px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or author…" className="input-field pl-9 text-sm"/>
              </div>
              <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="input-field w-36 text-sm">
                {cats.map(c=><option key={String(c)} value={String(c)}>{String(c)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(b=>(
                <div key={b.id} className="glass rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={()=>setSelectedBook(b)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))',border:'1px solid rgba(99,102,241,0.2)'}}>
                    <BookOpen size={18} className="text-indigo-400"/>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm leading-snug">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.author}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="badge badge-user text-[10px]">{b.category}</span>
                    <span className={b.available_copies>0?'badge-confirmed':'badge-cancelled'}>{b.available_copies>0?`${b.available_copies} avail.`:'Unavailable'}</span>
                  </div>
                </div>
              ))}
              {filtered.length===0 && <div className="col-span-3 text-center py-16 text-slate-500">No books found</div>}
            </div>
          </div>
        )}

        {/* BORROWS */}
        {tab==='borrows' && (
          <div className="animate-fadeIn max-w-3xl">
            <h1 className="text-3xl font-black text-white mb-2">My Borrows</h1>
            <p className="text-slate-400 text-sm mb-6">Track your current and past borrowed books</p>
            <div className="space-y-3">
              {borrows.length===0 ? <div className="glass rounded-2xl p-16 text-center"><p className="text-slate-500">No borrow history yet</p></div>
                : borrows.map(b=>(
                  <div key={b.id} className="glass rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)'}}><BookOpen size={18} className="text-indigo-400"/></div>
                      <div><p className="font-semibold text-white text-sm">{b.book?.title}</p><p className="text-xs text-slate-500">{b.book?.author} · Due: {b.due_date||'Pending'}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_CLS[b.status]||'badge'}>{b.status}</span>
                      {b.status==='approved' && (b.renewed_count||0)<1 && (
                        <button onClick={()=>renewBorrow(b)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{background:'rgba(99,102,241,0.15)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.2)'}}>
                          <RotateCcw size={12}/>Renew
                        </button>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* RESERVATIONS */}
        {tab==='reservations' && (
          <div className="animate-fadeIn max-w-3xl">
            <h1 className="text-3xl font-black text-white mb-2">Reservations</h1>
            <p className="text-slate-400 text-sm mb-6">Books you're waiting for</p>
            {reservations.length===0 ? <div className="glass rounded-2xl p-16 text-center"><p className="text-slate-500">No reservations. <button onClick={()=>setTab('browse')} className="text-indigo-400 hover:underline">Browse books</button></p></div>
              : reservations.map(r=>(
                <div key={r.id} className="glass rounded-2xl p-5 mb-3 flex items-center justify-between">
                  <div><p className="font-semibold text-white">{r.book?.title}</p><p className="text-xs text-slate-500">{r.book?.author} · Queue #{r.queue_position||1}</p></div>
                  <div className="flex items-center gap-2">
                    <span className={STATUS_CLS[r.status]||'badge'}>{r.status}</span>
                    {r.status==='waiting' && <button onClick={()=>cancelReservation(r.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><X size={13}/></button>}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* APPOINTMENTS */}
        {tab==='appointments' && (
          <div className="animate-fadeIn max-w-3xl">
            <h1 className="text-3xl font-black text-white mb-2">Appointments</h1>
            <p className="text-slate-400 text-sm mb-6">Book a study room or meet the librarian</p>
            <div className="glass rounded-2xl p-6 mb-6 space-y-4">
              <h2 className="font-bold text-white">Book New Appointment</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Type</label>
                  <select value={apptForm.type} onChange={e=>setApptForm(p=>({...p,type:e.target.value}))} className="input-field text-sm">
                    <option value="study_room">Study Room</option><option value="librarian">Librarian Meeting</option>
                  </select>
                </div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Room</label>
                  <select value={apptForm.room} onChange={e=>setApptForm(p=>({...p,room:e.target.value}))} className="input-field text-sm">
                    {['Room A','Room B','Room C','Conference Room'].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Date</label><input type="date" value={apptForm.date} min={new Date().toISOString().split('T')[0]} onChange={e=>setApptForm(p=>({...p,date:e.target.value}))} className="input-field text-sm"/></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Time</label>
                <div className="grid grid-cols-4 gap-2">
                  {SLOTS.map(s=><button key={s} onClick={()=>setApptForm(p=>({...p,time:s}))} className={`py-2 rounded-lg text-xs font-medium transition-all ${apptForm.time===s?'text-white':'text-slate-400 hover:text-white'}`} style={apptForm.time===s?{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>{s}</button>)}
                </div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Notes</label><textarea value={apptForm.notes} onChange={e=>setApptForm(p=>({...p,notes:e.target.value}))} className="input-field text-sm resize-none" rows={2} placeholder="Purpose of visit…"/></div>
              <button onClick={bookAppointment} className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>Request Appointment</button>
            </div>
            <div className="space-y-3">
              {appointments.map(a=>(
                <div key={a.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-white capitalize">{a.type?.replace('_',' ')} — {a.room}</p><p className="text-xs text-slate-500">{a.date} · {a.start_time}</p></div>
                  <span className={STATUS_CLS[a.status]||'badge'}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='notifications' && (
          <div className="animate-fadeIn max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-black text-white">Notifications</h1>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all"
                  style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)' }}>
                  ✓ Mark all read
                </button>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-6">Updates, reminders, and library announcements</p>
            {notifications.length===0 ? <div className="glass rounded-2xl p-16 text-center"><p className="text-slate-500">No notifications yet</p></div>
              : notifications.map(n=>(
                <div key={n.id} onClick={()=>markRead(n.id)} className="glass rounded-2xl p-5 mb-3 cursor-pointer hover:bg-white/03 transition-all" style={!n.read?{borderColor:'rgba(99,102,241,0.3)'}:{}}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${!n.read ? 'bg-indigo-400' : 'bg-transparent'}`}/>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${n.read?'text-slate-400':'text-white'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-slate-600 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`flex-shrink-0 badge text-[10px] ${
                      n.type==='success'?'badge-confirmed':n.type==='error'?'badge-cancelled':'badge-no-show'
                    }`}>{n.type}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* PROFILE */}
        {tab==='profile' && (
          <div className="animate-fadeIn max-w-md">
            <h1 className="text-3xl font-black text-white mb-2">Profile</h1>
            <p className="text-slate-400 text-sm mb-6">Manage your account information</p>
            <div className="glass rounded-2xl p-6 space-y-4 mb-5">
              <div className="flex items-center gap-4 pb-4 border-b border-white/06">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>{user.name?.charAt(0).toUpperCase()}</div>
                <div><p className="font-bold text-white">{user.name}</p><span className="badge-user">{user.role}</span></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Full Name</label><input value={profileForm.name} onChange={e=>setProfileForm(p=>({...p,name:e.target.value}))} className="input-field text-sm"/></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Email</label><input value={profileForm.email} disabled className="input-field text-sm opacity-50"/></div>
              <button onClick={saveProfile} className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>Save Changes</button>
            </div>
            {/* Fines */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Fines & Penalties</h2>
                <span className={fines.filter(f=>!f.paid).length>0?'badge-cancelled':'badge-confirmed'}>
                  {fines.filter(f=>!f.paid).length>0
                    ? `₱${fines.filter(f=>!f.paid).reduce((s:number,f:any)=>s+Number(f.amount),0).toFixed(2)} unpaid`
                    : 'No outstanding fines'}
                </span>
              </div>
              {fines.length===0
                ? <p className="text-slate-500 text-sm text-center py-6">No fines on record 🎉</p>
                : fines.map((f:any)=>(
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                    <div>
                      <p className="text-sm font-medium text-white">{f.borrow?.book?.title||'Book'}</p>
                      <p className="text-xs text-slate-500">Fine: ₱{Number(f.amount).toFixed(2)}</p>
                    </div>
                    <span className={f.paid?'badge-confirmed':'badge-cancelled'}>{f.paid?'Paid':'Unpaid'}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Book detail modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}} onClick={(e)=>{if(e.target===e.currentTarget)setSelectedBook(null)}}>
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-slideUp">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))',border:'1px solid rgba(99,102,241,0.3)'}}>
                  <BookOpen size={20} className="text-indigo-400"/>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">{selectedBook.title}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{selectedBook.author}</p>
                </div>
              </div>
              <button onClick={()=>setSelectedBook(null)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/05 flex-shrink-0"><X size={16}/></button>
            </div>
            {/* Info */}
            <div className="rounded-xl p-4 mb-4 space-y-2" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-slate-300 text-sm leading-relaxed">{selectedBook.description||'No description available.'}</p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="badge badge-user">{selectedBook.category}</span>
                <span className={selectedBook.available_copies>0?'badge-confirmed':'badge-cancelled'}>
                  {selectedBook.available_copies>0?`${selectedBook.available_copies} of ${selectedBook.total_copies} available`:'All copies out'}
                </span>
              </div>
            </div>
            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={()=>borrowBook(selectedBook)}
                disabled={selectedBook.available_copies===0}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={selectedBook.available_copies>0
                  ? {background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}
                  : {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#475569',cursor:'not-allowed'}
                }>
                {selectedBook.available_copies>0 ? '📚 Request to Borrow' : '📚 Borrow (Unavailable)'}
              </button>
              <button
                onClick={()=>reserveBook(selectedBook)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                style={{background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.25)',color:'#a5b4fc'}}>
                🔖 Reserve a Copy
                {selectedBook.available_copies===0 && <span className="ml-2 text-xs text-slate-500">(Join waitlist)</span>}
              </button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-3">Borrows require librarian approval · Reservations join the waitlist</p>
          </div>
        </div>
      )}
    </div>
  );
}
