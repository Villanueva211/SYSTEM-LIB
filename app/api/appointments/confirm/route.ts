import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email, date, time, name } = await request.json();

    if (!email || !date || !time || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendBookingConfirmation(email, date, time, name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    // Return success anyway — email is non-critical
    return NextResponse.json({ success: true });
  }
}
