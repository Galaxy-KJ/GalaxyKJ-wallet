import { Command } from 'commander';
import chalk from 'chalk';

const STUB_MSG = `Not yet implemented. Depends on @galaxy/wallet/auth (issue #77).
Track progress: https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/77`;

export function registerBiometricCommands(parent: Command): void {
  const biometric = parent
    .command('biometric')
    .description('Biometric authentication operations (coming soon)');

  biometric
    .command('setup')
    .description('Set up biometric authentication')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });

  biometric
    .command('sign <transaction>')
    .description('Sign a transaction with biometric auth')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });
}
