import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { listWallets, getWallet } from '../../utils/wallet-storage';
import { fetchAccountBalances } from '../../utils/stellar-helpers';

function truncateKey(key: string): string {
  if (key.length <= 16) return key;
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
}

export function registerListCommands(parent: Command): void {
  parent
    .command('list')
    .description('List all wallets')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const wallets = await listWallets();

        if (wallets.length === 0) {
          if (opts.json) {
            console.log('[]');
          } else {
            console.log('No wallets found. Create one with: galaxy wallet create');
          }
          return;
        }

        if (opts.json) {
          console.log(JSON.stringify(wallets, null, 2));
          return;
        }

        const table = new Table({
          head: ['Name', 'Public Key', 'Network', 'Type', 'Created'],
          style: { head: ['cyan'] },
        });

        for (const w of wallets) {
          table.push([
            w.name,
            truncateKey(w.publicKey),
            w.network,
            w.type,
            new Date(w.createdAt).toLocaleDateString(),
          ]);
        }

        console.log(table.toString());
        console.log(chalk.dim(`\n${wallets.length} wallet(s) total`));
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exitCode = 1;
      }
    });

  parent
    .command('show <name>')
    .description('Show wallet details')
    .option('--json', 'Output as JSON')
    .action(async (name: string, opts: { json?: boolean }) => {
      try {
        const wallet = await getWallet(name);
        if (!wallet) {
          console.error(chalk.red(`Error: Wallet "${name}" not found.`));
          process.exitCode = 1;
          return;
        }

        const spinner = ora('Fetching account balance...').start();
        let balances: { asset: string; balance: string }[] = [];
        let accountExists = true;

        try {
          balances = await fetchAccountBalances(wallet.publicKey, wallet.network);
          if (balances.length === 0) {
            accountExists = false;
          }
          spinner.stop();
        } catch {
          spinner.warn('Could not fetch balance (network error)');
          accountExists = false;
        }

        if (opts.json) {
          console.log(JSON.stringify({
            ...wallet,
            accountExists,
            balances,
          }, null, 2));
          return;
        }

        console.log('');
        console.log(`  Name:       ${wallet.name}`);
        console.log(`  Public Key: ${wallet.publicKey}`);
        console.log(`  Network:    ${wallet.network}`);
        console.log(`  Type:       ${wallet.type}`);
        console.log(`  Created:    ${wallet.createdAt}`);
        console.log('');

        if (!accountExists) {
          console.log(chalk.yellow(`  Account not funded on ${wallet.network}`));
        } else if (balances.length > 0) {
          const table = new Table({
            head: ['Asset', 'Balance'],
            style: { head: ['cyan'] },
          });
          for (const b of balances) {
            table.push([b.asset, b.balance]);
          }
          console.log(table.toString());
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
