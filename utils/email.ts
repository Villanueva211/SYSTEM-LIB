import nodemailer, { Transporter } from 'nodemailer';
import { format } from 'date-fns';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error('Missing SMTP configuration');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@autobook.com',
      ...options,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    // Silently fail in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

export const sendBookingConfirmation = async (
  email: string,
  appointmentDate: string,
  appointmentTime: string,
  userName: string
): Promise<void> => {
  const appointmentDateTime = `${appointmentDate} at ${appointmentTime}`;

  await sendEmail({
    to: email,
    subject: 'Appointment Booking Confirmation - AutoBook',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Hi ${userName},</p>
      <p>Your appointment has been successfully booked!</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date & Time:</strong> ${appointmentDateTime}</p>
        <p><strong>Booking Reference:</strong> ${generateReference()}</p>
      </div>
      <p>You will receive a reminder email 24 hours before your appointment.</p>
      <p>If you need to reschedule or cancel, please visit your dashboard.</p>
      <p>Thank you for booking with AutoBook!</p>
    `,
  });
};

export const sendAppointmentReminder = async (
  email: string,
  appointmentDate: string,
  appointmentTime: string,
  userName: string
): Promise<void> => {
  const appointmentDateTime = `${appointmentDate} at ${appointmentTime}`;

  await sendEmail({
    to: email,
    subject: 'Appointment Reminder - AutoBook',
    html: `
      <h2>Appointment Reminder</h2>
      <p>Hi ${userName},</p>
      <p>This is a reminder about your upcoming appointment:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date & Time:</strong> ${appointmentDateTime}</p>
      </div>
      <p>Please arrive 5-10 minutes early.</p>
      <p>Thank you!</p>
    `,
  });
};

export const sendCancellationNotification = async (
  email: string,
  appointmentDate: string,
  appointmentTime: string,
  userName: string
): Promise<void> => {
  const appointmentDateTime = `${appointmentDate} at ${appointmentTime}`;

  await sendEmail({
    to: email,
    subject: 'Appointment Cancelled - AutoBook',
    html: `
      <h2>Appointment Cancellation</h2>
      <p>Hi ${userName},</p>
      <p>Your appointment has been cancelled:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date & Time:</strong> ${appointmentDateTime}</p>
      </div>
      <p>If you would like to book another appointment, please visit our website.</p>
      <p>Thank you!</p>
    `,
  });
};

const generateReference = (): string => {
  return `AB-${Date.now().toString(36).toUpperCase()}`;
};
