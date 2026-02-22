import { Command } from 'commander';
import chalk from 'chalk';

const STUB_MSG = `Not yet implemented. Depends on @galaxy/wallet/multisig (issue #73).
Track progress: https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/73`;

export function registerMultisigCommands(parent: Command): void {
  const multisig = parent
    .command('multisig')
    .description('Multi-signature wallet operations (coming soon)');

  multisig
    .command('create')
    .description('Create a multi-signature wallet')
    .option('--threshold <n>', 'Required signatures')
    .option('--signers <addresses>', 'Comma-separated signer addresses')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });

  multisig
    .command('sign <tx-id>')
    .description('Sign a multi-signature transaction')
    .action(() => {
      console.log(chalk.yellow(STUB_MSG));
    });
}
