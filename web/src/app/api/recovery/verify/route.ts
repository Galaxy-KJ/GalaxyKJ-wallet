import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/invisible-wallet/recovery-db';
import { createRecoveryToken, hashOtp } from '@/lib/invisible-wallet/recovery-server';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email || ''));
    const otpInput = String(body?.otp || '').trim().toUpperCase();

    if (!email || !otpInput || otpInput.length !== 6) {
      return NextResponse.json({ error: 'Email and 6-character OTP are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({
        error: 'Recovery backend is not configured. Missing Supabase admin environment.',
      }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('wallet_recovery_otps')
      .select('*')
      .eq('email', email)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'No active OTP found for this email' }, { status: 404 });
    }

    const expired = new Date(data.expires_at).getTime() <= Date.now();
    if (expired) {
      return NextResponse.json({ error: 'OTP has expired. Request a new code.' }, { status: 400 });
    }

    const computedHash = hashOtp(email, otpInput);
    if (computedHash !== data.otp_hash) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const recoveryToken = createRecoveryToken({ email, otpId: data.id });

    return NextResponse.json({
      success: true,
      recoveryToken,
      expiresInSeconds: 5 * 60,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
