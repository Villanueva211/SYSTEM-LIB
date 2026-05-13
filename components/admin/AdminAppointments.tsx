'use client';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types/library';
import { CheckCircle, XCircle, Trash2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props { appointments: Appointment[]; setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>; }

const STATUS_CLS: Record<string,string> = { pending:'badge-no-show', approved:'badge-confirmed', declined:'badge-cancelled', cancelled:'badge-cancelled' };
const SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];

export function AdminAppointments({ appointments, setAppointments }: Props) {
  const [filter, setFilter] = useState<'all'|'pending'|'approved'>('all');
  const [showSlots, setShowSlots] = useState(false);

  const approve = async (a: Appointment) => {
    const { error } = await supabase.from('appointments')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', a.id);
    if (error) { toast.error('Failed to approve'); return; }

    // Notify student
    await supabase.from('notifications').insert([{
      user_id: a.user_id,
      title: 'Appointment Approved! 📅',
      message: `Your ${a.type?.replace('_', ' ')} appointment on ${a.date} at ${a.start_time} (${a.room || 'Library'}) has been approved. Please arrive on time.`,
      type: 'success'
    }]);

    setAppointments(p => p.map(x => x.id === a.id ? { ...x, status: 'approved' } : x));
    toast.success('Appointment approved & student notified');
  };

  const decline = async (a: Appointment) => {
    const { error } = await supabase.from('appointments')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', a.id);
    if (error) { toast.error('Failed to decline'); return; }

    // Notify student
    await supabase.from('notifications').insert([{
      user_id: a.user_id,
      title: 'Appointment Declined',
      message: `Your appointment request for ${a.date} at ${a.start_time} (${a.type?.replace('_', ' ')}) was declined. Please contact the library to reschedule.`,
      type: 'error'
    }]);

    setAppointments(p => p.map(x => x.id === a.id ? { ...x, status: 'declined' } : x));
    toast.success('Appointment declined & student notified');
  };

  const del = async (id: string) => {
    if (!confirm('Delete this appointment record?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(p => p.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const approvedCount = appointments.filter(a => a.status === 'approved').length;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Appointments</h1>
          <p className="text-slate-400 text-sm mt-1">Manage study room and librarian meeting bookings. Approvals and declines notify students automatically.</p>
        </div>
        <button onClick={() => setShowSlots(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Plus size={15} /> View Slots
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: appointments.length, color: '#6366f1' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b' },
          { label: 'Approved', value: approvedCount, color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
        {(['all','pending','approved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            style={filter===f ? { background:'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}}>
            {f} {f === 'pending' && pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-400">{pendingCount}</span>}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/06">
            {['Student','Type','Room','Date & Time','Status','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">No appointments</td></tr>
              : filtered.map(a => (
                <tr key={a.id} className={`border-b border-white/04 hover:bg-white/02 transition-colors ${a.status === 'pending' ? 'bg-amber-500/03' : ''}`}>
                  <td className="px-4 py-3"><p className="text-sm font-semibold text-white">{a.user?.name}</p><p className="text-xs text-slate-500">{a.user?.email}</p></td>
                  <td className="px-4 py-3"><span className="badge badge-user capitalize">{a.type?.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{a.room || '—'}</td>
                  <td className="px-4 py-3"><p className="text-sm text-white">{a.date}</p><p className="text-xs text-slate-500">{a.start_time} – {a.end_time}</p></td>
                  <td className="px-4 py-3"><span className={STATUS_CLS[a.status] || 'badge'}>{a.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {a.status === 'pending' && <>
                        <button onClick={() => approve(a)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(16,185,129,0.15)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.2)' }}>
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => decline(a)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(239,68,68,0.1)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)' }}>
                          <XCircle size={12} /> Decline
                        </button>
                      </>}
                      <button onClick={() => del(a.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Slots modal */}
      {showSlots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}>
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-slideUp">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Available Time Slots</h2>
              <button onClick={() => setShowSlots(false)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/05"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {SLOTS.map(s => (
                <div key={s} className="py-2 rounded-lg text-xs font-medium text-center text-indigo-300" style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)' }}>{s}</div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center">Students select from these time slots when booking. Edit SLOTS in AdminAppointments.tsx to customize.</p>
          </div>
        </div>
      )}
    </div>
  );
}
