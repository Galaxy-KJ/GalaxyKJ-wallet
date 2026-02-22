import { Command } from 'commander';
import { registerCreateCommands } from './create';
import { registerListCommands } from './list';
import { registerBackupCommands } from './backup';
import { registerMultisigCommands } from './multisig';
import { registerLedgerCommands } from './ledger';
import { registerBiometricCommands } from './biometric';
import { registerRecoveryCommands } from './recovery';

export function registerWalletCommands(program: Command): void {
  const wallet = program
    .command('wallet')
    .description('Manage Stellar wallets');

  registerCreateCommands(wallet);
  registerListCommands(wallet);
  registerBackupCommands(wallet);
  registerMultisigCommands(wallet);
  registerLedgerCommands(wallet);
  registerBiometricCommands(wallet);
  registerRecoveryCommands(wallet);
}
