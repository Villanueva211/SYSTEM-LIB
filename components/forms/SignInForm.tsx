'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['jayvee.villanueva@urios.edu.ph'];

export const SignInForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw new Error(signInError.message);
      if (!authData.user) throw new Error('Sign in failed. Please try again.');

      toast.success('Signed in successfully!');

      // Check if admin by email first (instant, no DB needed)
      if (ADMIN_EMAILS.includes(data.email.toLowerCase())) {
        window.location.href = '/admin';
        return;
      }

      // Otherwise check DB role
      const { data: userData } = await supabase
        .from('users').select('role').eq('id', authData.user.id).single();

      window.location.href = userData?.role === 'admin' ? '/admin' : '/dashboard';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl text-sm text-red-400 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      )}
      <Input {...register('email')} label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} id="signin-email" />
      <Input {...register('password')} label="Password" type="password" placeholder="••••••••" error={errors.password?.message} id="signin-password" />
      <Button type="submit" disabled={loading} className="w-full" style={{ height: '2.75rem' }}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in…
          </span>
        ) : 'Sign In'}
      </Button>
    </form>
  );
};
