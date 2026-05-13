'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LibraryUser, Borrow } from '@/types/library';
import { Edit2, Save, X, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { users: LibraryUser[]; setUsers: React.Dispatch<React.SetStateAction<LibraryUser[]>>; borrows: Borrow[]; currentUserId: string; }

export function AdminUsers({ users, setUsers, borrows, currentUserId }: Props) {
  const [editId, setEditId] = useState<string|null>(null);
  const [editRole, setEditRole] = useState<'user'|'admin'>('user');
  const [viewId, setViewId] = useState<string|null>(null);

  const saveRole = async (id: string) => {
    const { error } = await supabase.from('users').update({ role: editRole }).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    setUsers(p => p.map(u => u.id === id ? { ...u, role: editRole } : u));
    setEditId(null);
    toast.success('Role updated');
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user and all their data?')) return;
    await supabase.from('borrows').delete().eq('user_id', id);
    await supabase.from('reservations').delete().eq('user_id', id);
    await supabase.from('appointments').delete().eq('user_id', id);
    await supabase.from('users').delete().eq('id', id);
    setUsers(p => p.filter(u => u.id !== id));
    toast.success('User deleted');
  };

  const viewUser = viewId ? users.find(u => u.id === viewId) : null;
  const userBorrows = viewId ? borrows.filter(b => b.user_id === viewId) : [];

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-black text-white mb-2">User Management</h1>
      <p className="text-slate-400 text-sm mb-6">Manage member accounts, roles, and borrowing history</p>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/06">
            {['Member','Role','Borrows','Joined','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/04 hover:bg-white/02 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{u.name?.charAt(0).toUpperCase()}</div>
                    <div><p className="text-sm font-semibold text-white">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editId === u.id
                    ? <select value={editRole} onChange={e => setEditRole(e.target.value as 'user'|'admin')} className="input-field text-xs py-1 h-auto w-24" style={{ padding:'4px 8px' }}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    : <span className={u.role === 'admin' ? 'badge-admin' : 'badge-user'}>{u.role}</span>
                  }
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{borrows.filter(b => b.user_id === u.id).length}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setViewId(u.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Eye size={13} /></button>
                    {editId === u.id
                      ? <>
                          <button onClick={() => saveRole(u.id)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-all"><Save size={13} /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-slate-500 hover:bg-white/05 transition-all"><X size={13} /></button>
                        </>
                      : <button onClick={() => { setEditId(u.id); setEditRole(u.role as 'user'|'admin'); }} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Edit2 size={13} /></button>
                    }
                    {u.id !== currentUserId && <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* History modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}>
          <div className="glass rounded-2xl w-full max-w-lg p-6 animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">{viewUser.name}</h2>
                <p className="text-xs text-slate-500">{viewUser.email}</p>
              </div>
              <button onClick={() => setViewId(null)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/05"><X size={16} /></button>
            </div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Borrowing History ({userBorrows.length})</h3>
            <div className="space-y-2">
              {userBorrows.length === 0
                ? <p className="text-slate-600 text-sm text-center py-6">No borrow history</p>
                : userBorrows.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                    <div><p className="text-sm font-medium text-white">{b.book?.title}</p><p className="text-xs text-slate-500">{b.borrow_date} → {b.return_date || b.due_date || '—'}</p></div>
                    <span className={b.status === 'returned' ? 'badge-completed' : b.status === 'approved' ? 'badge-confirmed' : 'badge-cancelled'}>{b.status}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
