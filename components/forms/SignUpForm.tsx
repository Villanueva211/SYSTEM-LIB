'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createUser } from '@/utils/auth';
import { signUpSchema, SignUpFormData } from '@/utils/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export const SignUpForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      });

      if (signUpError) throw new Error(signUpError.message);
      if (!authData.user) throw new Error('Failed to create user account');

      // Create user row in public.users
      await createUser(authData.user.id, data.email, data.name, 'user');

      toast.success('Account created! You can now sign in.');
      router.push('/signin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl text-sm text-red-400 border border-red-500/20"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      )}

      <Input
        {...register('name')}
        label="Full Name"
        placeholder="Juan dela Cruz"
        error={errors.name?.message}
        id="signup-name"
      />
      <Input
        {...register('email')}
        label="Email Address"
        type="email"
        placeholder="you@urios.edu.ph"
        error={errors.email?.message}
        id="signup-email"
      />
      <Input
        {...register('password')}
        label="Password"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        id="signup-password"
      />
      <Input
        {...register('confirmPassword')}
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        id="signup-confirm"
      />

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          {...register('agreeToTerms')}
          className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          id="agree-terms"
        />
        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-snug">
          I agree to the{' '}
          <span className="text-indigo-400">Terms of Service</span>{' '}
          and{' '}
          <span className="text-indigo-400">Privacy Policy</span>
        </span>
      </label>
      {errors.agreeToTerms && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <span>⚠</span> {errors.agreeToTerms.message}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account…
          </span>
        ) : 'Create Student Account'}
      </Button>
    </form>
  );
};
