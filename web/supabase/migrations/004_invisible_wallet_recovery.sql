-- Storage for server-side encrypted wallet records used by passphrase recovery.
create table if not exists public.invisible_wallets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  platform_id text not null,
  network text not null check (network in ('testnet', 'mainnet')),
  public_key text not null,
  encrypted_secret text not null,
  salt text not null,
  iv text not null,
  recovery_ciphertext text,
  recovery_salt text,
  recovery_iv text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, platform_id, network)
);

create index if not exists idx_invisible_wallets_email_platform_network
  on public.invisible_wallets (email, platform_id, network);

create table if not exists public.wallet_recovery_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  attempts integer not null default 0
);

create index if not exists idx_wallet_recovery_otps_email_created
  on public.wallet_recovery_otps (email, created_at desc);

create index if not exists idx_wallet_recovery_otps_active
  on public.wallet_recovery_otps (email, used_at, expires_at);
