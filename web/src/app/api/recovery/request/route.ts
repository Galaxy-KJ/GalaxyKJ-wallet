import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/invisible-wallet/recovery-db';
import {
  generateOtp,
  getOtpExpiryDate,
  hashOtp,
  recoveryConfig,
  sendRecoveryOtpEmail,
} from '@/lib/invisible-wallet/recovery-server';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email || ''));

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({
        error: 'Recovery backend is not configured. Missing Supabase admin environment.',
      }, { status: 503 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('wallet_recovery_otps')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', oneHourAgo);

    if (countError) {
      throw countError;
    }

    if ((count || 0) >= recoveryConfig.maxOtpRequestsPerHour) {
      return NextResponse.json({
        error: `Rate limit exceeded: max ${recoveryConfig.maxOtpRequestsPerHour} OTP requests per hour`,
      }, { status: 429 });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(email, otp);

    const { error: upsertError } = await supabase
      .from('wallet_recovery_otps')
      .insert({
        email,
        otp_hash: otpHash,
        expires_at: getOtpExpiryDate().toISOString(),
      });

    if (upsertError) {
      throw upsertError;
    }

    await sendRecoveryOtpEmail(email, otp);

    const response: Record<string, unknown> = {
      success: true,
      message: 'If this email is registered, a recovery OTP has been sent.',
      ttlMinutes: recoveryConfig.otpTtlMinutes,
    };

    if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
      response.devOtp = otp;
      response.devNote = 'RESEND_API_KEY not configured; OTP printed to server logs and returned for development.';
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
