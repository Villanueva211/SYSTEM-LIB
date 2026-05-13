'use client';
import { supabase } from '@/lib/supabase';
import { Reservation } from '@/types/library';
import { CheckCircle, XCircle, Trash2, BookCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { reservations: Reservation[]; setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>; }

const STATUS_CLS: Record<string,string> = { waiting:'badge-no-show', notified:'badge-confirmed', fulfilled:'badge-completed', cancelled:'badge-cancelled' };

export function AdminReservations({ reservations, setReservations }: Props) {
  const notify = async (r: Reservation) => {
    await supabase.from('reservations').update({ status: 'notified' }).eq('id', r.id);
    await supabase.from('notifications').insert([{
      user_id: r.user_id,
      title: '📖 Your Reserved Book is Available!',
      message: `"${r.book?.title}" is now available for pickup. Please visit the library within 48 hours or your reservation will be cancelled.`,
      type: 'success'
    }]);
    setReservations(p => p.map(x => x.id === r.id ? { ...x, status: 'notified' } : x));
    toast.success('Student notified!');
  };

  const fulfill = async (r: Reservation) => {
    // Mark reservation as fulfilled (book has been picked up / borrow created)
    await supabase.from('reservations').update({ status: 'fulfilled' }).eq('id', r.id);
    await supabase.from('notifications').insert([{
      user_id: r.user_id,
      title: 'Reservation Fulfilled ✅',
      message: `Your reservation for "${r.book?.title}" has been fulfilled. Enjoy reading!`,
      type: 'success'
    }]);
    setReservations(p => p.map(x => x.id === r.id ? { ...x, status: 'fulfilled' } : x));
    toast.success('Reservation fulfilled!');
  };

  const cancel = async (r: Reservation) => {
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', r.id);
    await supabase.from('notifications').insert([{
      user_id: r.user_id,
      title: 'Reservation Cancelled',
      message: `Your reservation for "${r.book?.title}" has been cancelled. Please contact the library for more information.`,
      type: 'error'
    }]);
    setReservations(p => p.map(x => x.id === r.id ? { ...x, status: 'cancelled' } : x));
    toast.success('Reservation cancelled & student notified');
  };

  const deleteRes = async (id: string) => {
    if (!confirm('Delete this reservation record?')) return;
    await supabase.from('reservations').delete().eq('id', id);
    setReservations(p => p.filter(r => r.id !== id));
    toast.success('Deleted');
  };

  const waiting   = reservations.filter(r => r.status === 'waiting');
  const notified  = reservations.filter(r => r.status === 'notified');
  const fulfilled = reservations.filter(r => r.status === 'fulfilled');
  const cancelled = reservations.filter(r => r.status === 'cancelled');

  const Row = ({ r }: { r: Reservation }) => (
    <tr className={`border-b border-white/04 hover:bg-white/02 transition-colors ${r.status === 'notified' ? 'bg-emerald-500/03' : ''}`}>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-white">{r.user?.name}</p>
        <p className="text-xs text-slate-500">{r.user?.email}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-white">{r.book?.title}</p>
        <p className="text-xs text-slate-500">{r.book?.author}</p>
      </td>
      <td className="px-4 py-3"><span className={STATUS_CLS[r.status] || 'badge'}>{r.status}</span></td>
      <td className="px-4 py-3 text-center text-sm text-slate-300">#{r.queue_position || 1}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 flex-wrap">
          {r.status === 'waiting' && (
            <button onClick={() => notify(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(16,185,129,0.15)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={12} /> Notify
            </button>
          )}
          {r.status === 'notified' && (
            <button onClick={() => fulfill(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(99,102,241,0.2)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.3)' }}>
              <BookCheck size={12} /> Fulfill
            </button>
          )}
          {!['fulfilled','cancelled'].includes(r.status) && (
            <button onClick={() => cancel(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(239,68,68,0.1)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)' }}>
              <XCircle size={12} /> Cancel
            </button>
          )}
          <button onClick={() => deleteRes(r.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );

  const Section = ({ rows, label }: { rows: Reservation[]; label: string }) => (
    rows.length === 0 ? null : (
      <div className="glass rounded-2xl overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-white/06 flex items-center gap-2">
          <h3 className="font-semibold text-white text-sm">{label}</h3>
          <span className="badge badge-user">{rows.length}</span>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-white/06">
            {['Student','Book','Status','Queue #','Reserved On','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>{rows.map(r => <Row key={r.id} r={r} />)}</tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black text-white mb-2">Reservations</h1>
      <p className="text-slate-400 text-sm mb-6">
        Manage the reservation waitlist. When a book is returned, the next waiting student is auto-notified. Use <strong className="text-slate-300">Notify</strong> to manually alert a student, then <strong className="text-slate-300">Fulfill</strong> once they pick it up.
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Waiting', value: waiting.length, color: '#f59e0b' },
          { label: 'Notified', value: notified.length, color: '#10b981' },
          { label: 'Fulfilled', value: fulfilled.length, color: '#6366f1' },
          { label: 'Cancelled', value: cancelled.length, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Section rows={[...waiting, ...notified]} label="🕐 Active Queue" />
      <Section rows={fulfilled} label="✅ Fulfilled" />
      <Section rows={cancelled} label="❌ Cancelled" />

      {reservations.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <p className="text-slate-500">No reservations yet</p>
        </div>
      )}
    </div>
  );
}
