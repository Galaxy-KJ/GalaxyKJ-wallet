import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type RecoveryOtpRecord = {
  id: string;
  email: string;
  otp_hash: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  attempts: number;
};

export type StoredInvisibleWallet = {
  id: string;
  email: string;
  platform_id: string;
  network: 'testnet' | 'mainnet';
  public_key: string;
  encrypted_secret: string;
  salt: string;
  iv: string;
  recovery_ciphertext: string | null;
  recovery_salt: string | null;
  recovery_iv: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
