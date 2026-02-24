import crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const RECOVERY_TOKEN_TTL_SECONDS = 5 * 60;

export type RecoveryTokenPayload = {
  email: string;
  otpId: string;
  issuedAt: number;
  expiresAt: number;
};

function base64UrlEncode(input: Buffer | string): string {
  const source = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return source
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  return Buffer.from(base64 + '='.repeat(padLength), 'base64');
}

function getRecoveryTokenSecret(): string {
  return process.env.RECOVERY_TOKEN_SECRET || 'dev-recovery-token-secret-change-me';
}

export function hashOtp(email: string, otp: string): string {
  const normalizedOtp = otp.toUpperCase().trim();
  return crypto
    .createHash('sha256')
    .update(`${email.toLowerCase().trim()}::${normalizedOtp}`)
    .digest('hex');
}

export function generateOtp(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(OTP_LENGTH);
  let otp = '';

  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += alphabet[bytes[i] % alphabet.length];
  }

  return otp;
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export function createRecoveryToken(payload: { email: string; otpId: string }): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + RECOVERY_TOKEN_TTL_SECONDS;
  const body: RecoveryTokenPayload = {
    email: payload.email.toLowerCase().trim(),
    otpId: payload.otpId,
    issuedAt,
    expiresAt,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', getRecoveryTokenSecret())
    .update(encodedPayload)
    .digest();

  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function verifyRecoveryToken(token: string): RecoveryTokenPayload {
  const [encodedPayload, encodedSignature] = token.split('.');

  if (!encodedPayload || !encodedSignature) {
    throw new Error('Invalid recovery token format');
  }

  const expectedSignature = crypto
    .createHmac('sha256', getRecoveryTokenSecret())
    .update(encodedPayload)
    .digest();

  const providedSignature = base64UrlDecode(encodedSignature);
  if (!crypto.timingSafeEqual(expectedSignature, providedSignature)) {
    throw new Error('Invalid recovery token signature');
  }

  const parsed = JSON.parse(base64UrlDecode(encodedPayload).toString('utf-8')) as RecoveryTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (parsed.expiresAt <= now) {
    throw new Error('Recovery token expired');
  }

  return parsed;
}

export async function sendRecoveryOtpEmail(email: string, otp: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RECOVERY_EMAIL_FROM;

  if (!resendApiKey || !sender) {
    console.info('[Recovery OTP] Email provider not configured. OTP for', email, '=>', otp);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: email,
      subject: 'Galaxy Wallet passphrase recovery code',
      html: `<p>Your Galaxy Wallet recovery code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send recovery email: ${response.status} ${body}`);
  }
}

export const recoveryConfig = {
  otpLength: OTP_LENGTH,
  otpTtlMinutes: OTP_TTL_MINUTES,
  maxOtpRequestsPerHour: 3,
  recoveryTokenTtlSeconds: RECOVERY_TOKEN_TTL_SECONDS,
};
