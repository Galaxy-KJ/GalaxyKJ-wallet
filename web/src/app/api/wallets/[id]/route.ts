import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/invisible-wallet/recovery-db';

const TABLE_NAME = process.env.WALLET_STORAGE_TABLE || 'wallets';

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Wallet storage backend is not configured.' },
        { status: 500 }
      );
    }

    const { id } = context.params;
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
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

export async function PUT(request: Request, context: RouteContext) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Wallet storage backend is not configured.' },
        { status: 500 }
      );
    }

    const { id } = context.params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body?.status) {
      updates.status = body.status;
    }

    if (body?.metadata) {
      updates.metadata = body.metadata;
    }

    if (body?.last_accessed_at || body?.lastAccessedAt) {
      updates.last_accessed_at = body.last_accessed_at || body.lastAccessedAt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Wallet storage backend is not configured.' },
        { status: 500 }
      );
    }

    const { id } = context.params;
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
