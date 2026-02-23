import { NextRequest, NextResponse } from 'next/server';
import { CryptoService } from '@/lib/invisible-wallet/crypto-service';
import { getSupabaseAdminClient } from '@/lib/invisible-wallet/recovery-db';
import { verifyRecoveryToken } from '@/lib/invisible-wallet/recovery-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.recoveryToken || '');
    const newPassphrase = String(body?.newPassphrase || '');
    const platformId = String(body?.platformId || 'galaxy-smart-wallet-demo');
    const network = String(body?.network || 'testnet');

    if (!token || !newPassphrase) {
      return NextResponse.json({ error: 'Recovery token and new passphrase are required' }, { status: 400 });
    }

    const validation = CryptoService.validatePassphraseStrength(newPassphrase);
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Passphrase does not meet strength requirements',
        details: validation.errors,
      }, { status: 400 });
    }

    const payload = verifyRecoveryToken(token);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json({
        error: 'Recovery backend is not configured. Missing Supabase admin environment.',
      }, { status: 503 });
    }

    const { data: otpRecord, error: otpError } = await supabase
      .from('wallet_recovery_otps')
      .select('*')
      .eq('id', payload.otpId)
      .eq('email', payload.email)
      .is('used_at', null)
      .maybeSingle();

    if (otpError) {
      throw otpError;
    }

    if (!otpRecord) {
      return NextResponse.json({ error: 'Recovery token already used or invalid' }, { status: 400 });
    }

    const { data: wallet, error: walletError } = await supabase
      .from('invisible_wallets')
      .select('*')
      .eq('email', payload.email)
      .eq('platform_id', platformId)
      .eq('network', network)
      .maybeSingle();

    if (walletError) {
      throw walletError;
    }

    if (!wallet) {
      return NextResponse.json({
        error: 'No server-side wallet found for this account. Recovery reset requires Supabase-backed wallet storage.',
      }, { status: 404 });
    }

    if (!wallet.recovery_ciphertext) {
      return NextResponse.json({
        error: 'Recovery not enabled for this wallet record. Missing recovery ciphertext.',
      }, { status: 409 });
    }

    const recoveryKey = process.env.RECOVERY_MASTER_KEY;
    if (!recoveryKey) {
      return NextResponse.json({
        error: 'Server misconfigured: RECOVERY_MASTER_KEY missing',
      }, { status: 500 });
    }

    const privateKey = await CryptoService.decryptPrivateKey(
      {
        ciphertext: wallet.recovery_ciphertext,
        salt: wallet.salt,
        iv: wallet.iv,
        metadata: {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000,
          saltLength: 32,
          ivLength: 16,
        },
      },
      recoveryKey
    );

    const reEncrypted = await CryptoService.encryptPrivateKey(privateKey, newPassphrase);

    const { error: updateError } = await supabase
      .from('invisible_wallets')
      .update({
        encrypted_secret: reEncrypted.ciphertext,
        salt: reEncrypted.salt,
        iv: reEncrypted.iv,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (updateError) {
      throw updateError;
    }

    const { error: otpUseError } = await supabase
      .from('wallet_recovery_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', payload.otpId);

    if (otpUseError) {
      throw otpUseError;
    }

    return NextResponse.json({
      success: true,
      message: 'Passphrase reset completed successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
