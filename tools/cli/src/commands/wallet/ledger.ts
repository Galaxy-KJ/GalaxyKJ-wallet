import { Command } from 'commander';
import chalk from 'chalk';

const STUB_MSG = `Not yet implemented. Depends on @galaxy/wallet/auth/hardware (issue #74).
Track progress: https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/74`;

export function registerLedgerCommands(parent: Command): void {
  const ledger = parent
    .command('ledger')
    .description('Ledger hardware wallet operations (coming soon)');

  ledger
    .command('connect')
    .description('Connect to a Ledger device')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });

  ledger
    .command('accounts')
    .description('List accounts on Ledger device')
    .option('--start-index <n>', 'Start index', '0')
    .option('--count <n>', 'Number of accounts', '5')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });
}
