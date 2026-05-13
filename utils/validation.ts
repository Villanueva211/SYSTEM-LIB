import { z } from 'zod';

export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const appointmentSchema = z.object({
  date: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Date must be in the future',
  }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  duration_minutes: z.number().min(15).max(480),
  notes: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
