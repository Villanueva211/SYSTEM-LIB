import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // If DB row found, return it
    if (userData) return userData;

    // Fallback: build a user from auth data (handles missing DB row gracefully)
    const fallback: User = {
      id: authUser.id,
      email: authUser.email!,
      name:
        (authUser.user_metadata?.name as string) ||
        authUser.email!.split('@')[0] ||
        'User',
      role: (authUser.user_metadata?.role as 'admin' | 'user') || 'user',
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at,
    };

    // Try to persist to DB (will succeed once INSERT policy is added)
    await supabase.from('users').insert([
      { id: fallback.id, email: fallback.email, name: fallback.name, role: fallback.role }
    ]).select().single();

    return fallback;
  } catch {
    return null;
  }
};

export const createUser = async (
  id: string,
  email: string,
  name: string,
  role: 'user' | 'staff' | 'admin' = 'user'
): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id, email, name, role }])
      .select()
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { data } = await supabase.from('users').select('id').eq('email', email).single();
    return !!data;
  } catch {
    return false;
  }
};
