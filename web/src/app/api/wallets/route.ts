import { NextResponse } from 'next/server';
import { CryptoService } from '@/lib/invisible-wallet/crypto-service';
import { getSupabaseAdminClient } from '@/lib/invisible-wallet/recovery-db';

const TABLE_NAME = process.env.WALLET_STORAGE_TABLE || 'wallets';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Wallet storage backend is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      id,
      email,
      emailHash,
      platformId,
      network,
      publicKey,
      encryptedSecret,
      salt,
      iv,
      status = 'active',
      metadata,
      lastAccessedAt,
    } = body ?? {};

    if (!platformId || !network || !publicKey || !encryptedSecret || !salt || !iv) {
      return NextResponse.json({ error: 'Missing required wallet fields.' }, { status: 400 });
    }

    if (!email && !emailHash) {
      return NextResponse.json({ error: 'Missing email or emailHash.' }, { status: 400 });
    }

    const hashedEmail = emailHash || await CryptoService.hashString(email);

    const record = {
      id,
      email_hash: hashedEmail,
      platform_id: platformId,
      public_key: publicKey,
      encrypted_secret: encryptedSecret,
      salt,
      iv,
      network,
      status,
      metadata: metadata ?? null,
      last_accessed_at: lastAccessedAt ?? new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(record, { onConflict: 'email_hash,platform_id,network' })
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id ?? id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Wallet storage backend is not configured.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const emailHash = searchParams.get('emailHash');
    const platformId = searchParams.get('platformId');
    const network = searchParams.get('network');

    if (!platformId || !network) {
      return NextResponse.json({ error: 'Missing platformId or network.' }, { status: 400 });
    }

    if (!email && !emailHash) {
      return NextResponse.json({ error: 'Missing email or emailHash.' }, { status: 400 });
    }

    const hashedEmail = emailHash || await CryptoService.hashString(email || '');

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('email_hash', hashedEmail)
      .eq('platform_id', platformId)
      .eq('network', network)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
