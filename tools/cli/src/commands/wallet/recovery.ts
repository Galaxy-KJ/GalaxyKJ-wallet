import { Command } from 'commander';
import chalk from 'chalk';

const STUB_MSG = `Not yet implemented. Depends on @galaxy/wallet/recovery (issue #76).
Track progress: https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/76`;

export function registerRecoveryCommands(parent: Command): void {
  const recovery = parent
    .command('recovery')
    .description('Social recovery operations (coming soon)');

  recovery
    .command('setup')
    .description('Set up social recovery with guardians')
    .option('--guardians <addresses>', 'Comma-separated guardian addresses')
    .option('--threshold <n>', 'Required guardian approvals')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });

  recovery
    .command('initiate')
    .description('Initiate wallet recovery')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });
}
