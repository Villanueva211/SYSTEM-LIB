'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Book } from '@/types/library';
import { Plus, Edit2, Trash2, X, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { title:'', author:'', isbn:'', category:'General', description:'', cover_url:'', total_copies:1, available_copies:1 };
const CATEGORIES = ['General','Fiction','Non-Fiction','Technology','Science','History','Mathematics','Literature','Philosophy','Self-Help','Fantasy','Reference'];

interface Props { books: Book[]; setBooks: React.Dispatch<React.SetStateAction<Book[]>>; }

export function AdminBooks({ books, setBooks }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState<Book|null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const openAdd = () => { setEditBook(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (b: Book) => { setEditBook(b); setForm({ title:b.title, author:b.author, isbn:b.isbn, category:b.category, description:b.description, cover_url:b.cover_url||'', total_copies:b.total_copies, available_copies:b.available_copies }); setShowModal(true); };

  const save = async () => {
    if (!form.title || !form.author) { toast.error('Title and author are required'); return; }
    setSaving(true);
    const payload = { ...form, isbn: form.isbn.trim() || null };
    if (editBook) {
      const { data, error } = await supabase.from('books').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editBook.id).select().single();
      if (error) { toast.error(error.message || 'Failed to update'); setSaving(false); return; }
      setBooks(p => p.map(b => b.id === editBook.id ? data : b));
      toast.success('Book updated!');
    } else {
      const { data, error } = await supabase.from('books').insert([payload]).select().single();
      if (error) { toast.error(error.message || 'Failed to add book'); setSaving(false); return; }
      setBooks(p => [data, ...p]);
      toast.success('Book added!');
    }
    setShowModal(false); setSaving(false);
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    await supabase.from('books').delete().eq('id', id);
    setBooks(p => p.filter(b => b.id !== id));
    toast.success('Deleted');
  };

  const toggleArchive = async (b: Book) => {
    await supabase.from('books').update({ archived: !b.archived }).eq('id', b.id);
    setBooks(p => p.map(x => x.id === b.id ? { ...x, archived: !b.archived } : x));
    toast.success(b.archived ? 'Book restored' : 'Book archived');
  };

  const filtered = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || b.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-black text-white">Books Catalog</h1><p className="text-slate-400 text-sm mt-1">Add, edit, archive and manage the library collection</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
          <Plus size={15} /> Add Book
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or author…" className="input-field max-w-xs text-sm" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-40 text-sm">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/06">
            {['Title','Author','Category','Copies','Available','Status','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} className="text-center py-16 text-slate-500">No books found</td></tr>
              : filtered.map(b => (
                <tr key={b.id} className={`border-b border-white/04 hover:bg-white/02 transition-colors ${b.archived ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3"><p className="text-sm font-semibold text-white">{b.title}</p><p className="text-xs text-slate-500">{b.isbn}</p></td>
                  <td className="px-4 py-3 text-sm text-slate-300">{b.author}</td>
                  <td className="px-4 py-3"><span className="badge badge-user text-xs">{b.category}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-300 text-center">{b.total_copies}</td>
                  <td className="px-4 py-3 text-center"><span className={b.available_copies > 0 ? 'badge-confirmed' : 'badge-cancelled'}>{b.available_copies}</span></td>
                  <td className="px-4 py-3"><span className={b.archived ? 'badge-no-show' : 'badge-confirmed'}>{b.archived ? 'Archived' : 'Active'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Edit2 size={13} /></button>
                      <button onClick={() => toggleArchive(b)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"><Archive size={13} /></button>
                      <button onClick={() => deleteBook(b.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}>
          <div className="glass rounded-2xl w-full max-w-lg p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/05"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Title *</label><input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} className="input-field text-sm" placeholder="Book title" /></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Author *</label><input value={form.author} onChange={e => setForm(p=>({...p,author:e.target.value}))} className="input-field text-sm" placeholder="Author name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">ISBN</label><input value={form.isbn} onChange={e => setForm(p=>({...p,isbn:e.target.value}))} className="input-field text-sm" placeholder="978-..." /></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} className="input-field text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Cover Image URL</label><input value={form.cover_url} onChange={e => setForm(p=>({...p,cover_url:e.target.value}))} className="input-field text-sm" placeholder="https://..." /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} className="input-field text-sm resize-none" rows={3} placeholder="Brief description…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Total Copies</label><input type="number" min={1} value={form.total_copies} onChange={e => setForm(p=>({...p,total_copies:parseInt(e.target.value)||1}))} className="input-field text-sm" /></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Available</label><input type="number" min={0} value={form.available_copies} onChange={e => setForm(p=>({...p,available_copies:parseInt(e.target.value)||0}))} className="input-field text-sm" /></div>
              </div>
              <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving ? 'Saving…' : editBook ? 'Save Changes' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
