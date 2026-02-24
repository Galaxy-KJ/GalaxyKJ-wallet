'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { NetworkType } from '@/types/invisible-wallet';
import { Loader2 } from 'lucide-react';

type ForgotPassphraseFlowProps = {
  email: string;
  network: NetworkType;
  platformId: string;
  validatePassphrase: (passphrase: string) => { isValid: boolean; errors: string[] };
};

type RecoveryStep = 'request' | 'verify' | 'reset' | 'done';

export function ForgotPassphraseFlow({
  email,
  network,
  platformId,
  validatePassphrase,
}: ForgotPassphraseFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<RecoveryStep>('request');
  const [working, setWorking] = useState(false);

  const [localEmail, setLocalEmail] = useState(email);
  const [otp, setOtp] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const passphraseValidation = useMemo(() => {
    return newPassphrase ? validatePassphrase(newPassphrase) : { isValid: false, errors: [] };
  }, [newPassphrase, validatePassphrase]);

  const resetLocalState = () => {
    setStep('request');
    setOtp('');
    setNewPassphrase('');
    setConfirmPassphrase('');
    setRecoveryToken('');
    setFeedback(null);
    setDevOtp(null);
  };

  const handleRequestOtp = async () => {
    setWorking(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: localEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      if (result.devOtp) {
        setDevOtp(String(result.devOtp));
      }

      setFeedback('OTP sent. Check your email for the 6-character code.');
      setStep('verify');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to request OTP');
    } finally {
      setWorking(false);
    }
  };

  const handleVerifyOtp = async () => {
    setWorking(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: localEmail, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      setRecoveryToken(String(result.recoveryToken));
      setFeedback('OTP verified. Set your new passphrase.');
      setStep('reset');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setWorking(false);
    }
  };

  const handleResetPassphrase = async () => {
    setWorking(true);
    setFeedback(null);

    try {
      if (newPassphrase !== confirmPassphrase) {
        throw new Error('Passphrase confirmation does not match');
      }

      if (!passphraseValidation.isValid) {
        throw new Error('New passphrase does not meet strength requirements');
      }

      const response = await fetch('/api/recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryToken,
          newPassphrase,
          platformId,
          network,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset passphrase');
      }

      setStep('done');
      setFeedback('Passphrase has been reset. You can now recover wallet using your new passphrase.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to reset passphrase');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-4 rounded-md border border-violet-300 bg-linear-to-br from-violet-50 to-purple-100 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-violet-900">Forgot Passphrase?</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-violet-800 hover:bg-violet-200/60"
          onClick={() => {
            if (!open) {
              setLocalEmail(email);
            }
            setOpen(prev => !prev);
            if (open) {
              resetLocalState();
            }
          }}
        >
          {open ? 'Hide' : 'Start Recovery'}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 rounded-md border border-violet-200 bg-white/70 p-3 backdrop-blur-sm">
          {feedback && <Alert>{feedback}</Alert>}

          {step === 'request' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="recovery-email">Wallet Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  value={localEmail}
                  onChange={(e) => setLocalEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <Button type="button" className="w-full" disabled={working || !localEmail} onClick={handleRequestOtp}>
                {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Recovery OTP
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="recovery-otp">Enter OTP</Label>
                <Input
                  id="recovery-otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase())}
                  placeholder="6-character code"
                  maxLength={6}
                />
                {devOtp && (
                  <p className="text-xs text-amber-700 mt-1">
                    Dev OTP: <span className="font-mono">{devOtp}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setStep('request')}>
                  Back
                </Button>
                <Button type="button" className="w-full" disabled={working || otp.trim().length !== 6} onClick={handleVerifyOtp}>
                  {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify OTP
                </Button>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-passphrase">New Passphrase</Label>
                <Input
                  id="new-passphrase"
                  type="password"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  placeholder="Enter new passphrase"
                />
              </div>
              <div>
                <Label htmlFor="confirm-passphrase">Confirm New Passphrase</Label>
                <Input
                  id="confirm-passphrase"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm new passphrase"
                />
              </div>

              {newPassphrase && !passphraseValidation.isValid && (
                <ul className="text-xs text-red-600 space-y-1">
                  {passphraseValidation.errors.map((msg, idx) => (
                    <li key={`${msg}-${idx}`}>- {msg}</li>
                  ))}
                </ul>
              )}

              <Button
                type="button"
                className="w-full"
                disabled={working || !newPassphrase || !confirmPassphrase}
                onClick={handleResetPassphrase}
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Passphrase
              </Button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetLocalState();
                  setOpen(false);
                }}
              >
                Close Recovery Flow
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
