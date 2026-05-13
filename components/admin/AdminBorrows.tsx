'use client';
import { supabase } from '@/lib/supabase';
import { Borrow } from '@/types/library';
import { CheckCircle, XCircle, RotateCcw, Trash2, Calendar, BookCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { borrows: Borrow[]; setBorrows: React.Dispatch<React.SetStateAction<Borrow[]>>; onRefresh: () => void; }

const STATUS_CLS: Record<string,string> = { pending:'badge-no-show', approved:'badge-confirmed', declined:'badge-cancelled', returned:'badge-completed', overdue:'badge-no-show' };

export function AdminBorrows({ borrows, setBorrows, onRefresh }: Props) {
  const approve = async (b: Borrow) => {
    const due = new Date(); due.setDate(due.getDate() + 7);
    const { error } = await supabase.from('borrows').update({
      status: 'approved',
      borrow_date: new Date().toISOString().split('T')[0],
      due_date: due.toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }).eq('id', b.id);
    if (error) { toast.error('Failed to approve'); return; }
    // Decrement available copies
    await supabase.from('books').update({
      available_copies: Math.max(0, (b.book?.available_copies ?? 1) - 1)
    }).eq('id', b.book_id);
    // Notify student
    await supabase.from('notifications').insert([{
      user_id: b.user_id,
      title: 'Borrow Approved! 📚',
      message: `"${b.book?.title}" has been approved. Please pick it up within 24 hours. Return by: ${due.toISOString().split('T')[0]}.`,
      type: 'success'
    }]);
    toast.success('Approved! Due in 7 days');
    onRefresh();
  };

  const decline = async (b: Borrow) => {
    await supabase.from('borrows').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', b.id);
    await supabase.from('notifications').insert([{
      user_id: b.user_id,
      title: 'Borrow Request Declined',
      message: `Your request for "${b.book?.title}" was declined. Please contact the librarian for more information.`,
      type: 'error'
    }]);
    setBorrows(p => p.map(x => x.id === b.id ? { ...x, status: 'declined' } : x));
    toast.success('Request declined');
  };

  const markReturned = async (b: Borrow) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('borrows').update({
      status: 'returned',
      return_date: today,
      updated_at: new Date().toISOString()
    }).eq('id', b.id);
    if (error) { toast.error('Failed to mark returned'); return; }

    // Restore available copy
    const { data: book } = await supabase
      .from('books')
      .select('available_copies, total_copies, title')
      .eq('id', b.book_id)
      .single();

    if (book) {
      const newAvail = Math.min(book.total_copies, (book.available_copies ?? 0) + 1);
      await supabase.from('books').update({ available_copies: newAvail }).eq('id', b.book_id);

      // ── Auto-notify first waiting reservation for this book ──
      const { data: nextReservation } = await supabase
        .from('reservations')
        .select('*, user:users(name,email)')
        .eq('book_id', b.book_id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextReservation) {
        await supabase.from('reservations')
          .update({ status: 'notified' })
          .eq('id', nextReservation.id);
        await supabase.from('notifications').insert([{
          user_id: nextReservation.user_id,
          title: '📖 Your Reserved Book is Available!',
          message: `"${book.title}" is now available for pickup. Please visit the library within 48 hours to borrow it or your reservation will be cancelled.`,
          type: 'success'
        }]);
        toast.success(`Book returned & ${nextReservation.user?.name || 'next student'} notified!`);
      } else {
        toast.success('Book marked as returned!');
      }
    }

    // Notify the student who returned it
    await supabase.from('notifications').insert([{
      user_id: b.user_id,
      title: 'Book Returned Successfully ✅',
      message: `"${b.book?.title}" has been marked as returned. Thank you for using the library!`,
      type: 'success'
    }]);

    onRefresh();
  };

  const extendDue = async (b: Borrow) => {
    const current = new Date(b.due_date); current.setDate(current.getDate() + 7);
    const newDue = current.toISOString().split('T')[0];
    await supabase.from('borrows').update({ due_date: newDue, updated_at: new Date().toISOString() }).eq('id', b.id);
    await supabase.from('notifications').insert([{
      user_id: b.user_id,
      title: 'Due Date Extended 📅',
      message: `Your borrowing period for "${b.book?.title}" has been extended. New due date: ${newDue}.`,
      type: 'info'
    }]);
    setBorrows(p => p.map(x => x.id === b.id ? { ...x, due_date: newDue } : x));
    toast.success('Extended by 7 days');
  };

  const deleteBorrow = async (id: string) => {
    if (!confirm('Delete this record permanently?')) return;
    await supabase.from('borrows').delete().eq('id', id);
    setBorrows(p => p.filter(b => b.id !== id));
    toast.success('Record deleted');
  };

  const isOverdue = (b: Borrow) => b.status === 'approved' && b.due_date && new Date(b.due_date) < new Date();

  const pending = borrows.filter(b => b.status === 'pending');
  const active  = borrows.filter(b => b.status === 'approved');
  const history = borrows.filter(b => ['declined','returned'].includes(b.status));

  const Row = ({ b }: { b: Borrow }) => (
    <tr className={`border-b border-white/04 hover:bg-white/02 transition-colors ${isOverdue(b) ? 'bg-red-500/05' : ''}`}>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-white">{b.user?.name}</p>
        <p className="text-xs text-slate-500">{b.user?.email}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-white">{b.book?.title}</p>
        <p className="text-xs text-slate-500">{b.book?.author}</p>
      </td>
      <td className="px-4 py-3">
        <span className={isOverdue(b) ? 'badge-cancelled' : STATUS_CLS[b.status] || 'badge'}>
          {isOverdue(b) ? '⚠ overdue' : b.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{b.borrow_date || '—'}</td>
      <td className="px-4 py-3 text-xs" style={{ color: isOverdue(b) ? '#fca5a5' : '#94a3b8' }}>{b.due_date || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 flex-wrap">
          {b.status === 'pending' && <>
            <button onClick={() => approve(b)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(16,185,129,0.15)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={12} /> Approve
            </button>
            <button onClick={() => decline(b)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(239,68,68,0.1)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)' }}>
              <XCircle size={12} /> Decline
            </button>
          </>}
          {b.status === 'approved' && <>
            <button onClick={() => markReturned(b)} title="Mark as Returned" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background:'rgba(99,102,241,0.2)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.3)' }}>
              <BookCheck size={12} /> Return
            </button>
            <button onClick={() => extendDue(b)} title="Extend due date by 7 days" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(245,158,11,0.1)', color:'#fcd34d', border:'1px solid rgba(245,158,11,0.2)' }}>
              <Calendar size={12} /> Extend
            </button>
          </>}
          <button onClick={() => deleteBorrow(b.id)} title="Delete record" className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );

  const Table = ({ rows, label }: { rows: Borrow[]; label: string }) => (
    <div className="glass rounded-2xl overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-white/06 flex items-center gap-2">
        <h3 className="font-semibold text-white text-sm">{label}</h3>
        <span className="badge badge-user">{rows.length}</span>
      </div>
      <table className="w-full">
        <thead><tr className="border-b border-white/06">
          {['Student','Book','Status','Borrowed','Due Date','Actions'].map(h => (
            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={6} className="text-center py-8 text-slate-600 text-sm">No records</td></tr>
            : rows.map(b => <Row key={b.id} b={b} />)
          }
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black text-white mb-2">Borrow Management</h1>
      <p className="text-slate-400 text-sm mb-6">Approve requests, track active borrows, mark returns, extend deadlines. Returning a book auto-notifies the next reservation waitlist.</p>
      <Table rows={pending} label="⏳ Pending Requests" />
      <Table rows={active}  label="📚 Active Borrows" />
      <Table rows={history} label="📋 History" />
    </div>
  );
}
