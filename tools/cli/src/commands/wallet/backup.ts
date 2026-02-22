import { Command } from 'commander';
import * as fs from 'fs/promises';
import chalk from 'chalk';
import { StrKey } from '@stellar/stellar-sdk';
import { listWallets, addWallet, getWallet, WalletConfig } from '../../utils/wallet-storage';

interface WalletBackup {
  version: number;
  createdAt: string;
  wallets: WalletConfig[];
}

export function registerBackupCommands(parent: Command): void {
  const backup = parent
    .command('backup')
    .description('Backup and restore wallet metadata');

  backup
    .command('create')
    .description('Create a backup of all wallet metadata')
    .requiredOption('-o, --output <file>', 'Output file path')
    .action(async (opts: { output: string }) => {
      try {
        const wallets = await listWallets();

        if (wallets.length === 0) {
          console.log('No wallets to back up.');
          return;
        }

        const data: WalletBackup = {
          version: 1,
          createdAt: new Date().toISOString(),
          wallets,
        };

        await fs.writeFile(opts.output, JSON.stringify(data, null, 2), 'utf-8');

        console.log(chalk.green(`✓ Backed up ${wallets.length} wallet(s) to ${opts.output}`));
        console.log(chalk.yellow('⚠ This backup does NOT include secret keys.'));
        console.log(chalk.dim('  Secret keys are stored in your system keychain.'));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exitCode = 1;
      }
    });

  parent
    .command('restore <file>')
    .description('Restore wallets from a backup file')
    .action(async (file: string) => {
      try {
        let raw: string;
        try {
          raw = await fs.readFile(file, 'utf-8');
        } catch {
          console.error(chalk.red(`Error: Could not read file "${file}".`));
          process.exitCode = 1;
          return;
        }

        let data: WalletBackup;
        try {
          data = JSON.parse(raw);
        } catch {
          console.error(chalk.red('Error: Invalid backup file (not valid JSON).'));
          process.exitCode = 1;
          return;
        }

        if (!data.version || !Array.isArray(data.wallets)) {
          console.error(chalk.red('Error: Invalid backup format (missing version or wallets).'));
          process.exitCode = 1;
          return;
        }

        let restored = 0;
        let skipped = 0;

        for (const wallet of data.wallets) {
          if (!wallet.name || !wallet.publicKey || !wallet.network) {
            console.log(chalk.yellow(`⚠ Skipping invalid entry (missing fields)`));
            skipped++;
            continue;
          }

          if (!StrKey.isValidEd25519PublicKey(wallet.publicKey)) {
            console.log(chalk.yellow(`⚠ Skipping "${wallet.name}" (invalid public key)`));
            skipped++;
            continue;
          }

          const existing = await getWallet(wallet.name);
          if (existing) {
            console.log(chalk.yellow(`⚠ Skipping "${wallet.name}" (already exists)`));
            skipped++;
            continue;
          }

          await addWallet({
            name: wallet.name,
            publicKey: wallet.publicKey,
            type: wallet.type || 'standard',
            network: wallet.network,
            createdAt: wallet.createdAt || new Date().toISOString(),
          });
          restored++;
        }

        console.log('');
        console.log(chalk.green(`✓ Restored ${restored} wallet(s).`));
        if (skipped > 0) {
          console.log(chalk.yellow(`  Skipped ${skipped} wallet(s).`));
        }
        if (restored > 0) {
          console.log(chalk.dim('  Note: Restored wallets do not have secret keys.'));
          console.log(chalk.dim('  Use "galaxy wallet import" to add secret keys.'));
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
