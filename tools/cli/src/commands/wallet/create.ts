import { Command } from 'commander';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  addWallet,
  getWallet,
  removeWallet,
  storeSecret,
  WalletConfig,
} from '../../utils/wallet-storage';
import { fundTestnetAccount, NetworkType } from '../../utils/stellar-helpers';

function validateWalletName(name: string): string | true {
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(name)) {
    return 'Name must be 1-32 characters: letters, numbers, hyphens, underscores.';
  }
  return true;
}

async function promptForName(): Promise<string> {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Wallet name:',
      validate: validateWalletName,
    },
  ]);
  return name;
}

export function registerCreateCommands(parent: Command): void {
  parent
    .command('create [name]')
    .description('Create a new Stellar wallet')
    .option('-n, --network <network>', 'Network (testnet or mainnet)', 'testnet')
    .option('--json', 'Output as JSON')
    .action(async (name: string | undefined, opts: { network: string; json?: boolean }) => {
      try {
        const network = opts.network as NetworkType;
        if (network !== 'testnet' && network !== 'mainnet') {
          console.error(chalk.red('Error: --network must be "testnet" or "mainnet".'));
          process.exitCode = 1;
          return;
        }

        if (!name) {
          if (!process.stdin.isTTY) {
            console.error(chalk.red('Error: Wallet name is required in non-interactive mode.'));
            process.exitCode = 1;
            return;
          }
          name = await promptForName();
        }

        const nameCheck = validateWalletName(name);
        if (nameCheck !== true) {
          console.error(chalk.red(`Error: ${nameCheck}`));
          process.exitCode = 1;
          return;
        }

        const existing = await getWallet(name);
        if (existing) {
          console.error(chalk.red(`Error: Wallet "${name}" already exists.`));
          process.exitCode = 1;
          return;
        }

        const keypair = Keypair.random();
        const wallet: WalletConfig = {
          name,
          publicKey: keypair.publicKey(),
          type: 'standard',
          network,
          createdAt: new Date().toISOString(),
        };

        await addWallet(wallet);

        try {
          await storeSecret(name, keypair.secret());
        } catch (err) {
          await removeWallet(name);
          console.error(chalk.red('Error: Failed to store secret key in system keychain.'));
          console.error(chalk.yellow('Make sure your system keychain is available (macOS Keychain, GNOME libsecret, or Windows Credential Manager).'));
          process.exitCode = 1;
          return;
        }

        if (network === 'testnet') {
          const spinner = ora('Funding testnet account...').start();
          const funded = await fundTestnetAccount(keypair.publicKey());
          if (funded) {
            spinner.succeed('Testnet account funded');
          } else {
            spinner.warn('Could not fund testnet account (you can fund it manually later)');
          }
        }

        if (opts.json) {
          console.log(JSON.stringify({
            name: wallet.name,
            publicKey: wallet.publicKey,
            secretKey: keypair.secret(),
            network: wallet.network,
            createdAt: wallet.createdAt,
          }, null, 2));
        } else {
          console.log('');
          console.log(chalk.green('✓ Wallet created successfully'));
          console.log('');
          console.log(`  Name:       ${wallet.name}`);
          console.log(`  Public Key: ${wallet.publicKey}`);
          console.log(`  Secret Key: ${keypair.secret()}`);
          console.log(`  Network:    ${wallet.network}`);
          console.log('');
          console.log(chalk.yellow('⚠ Save your secret key! It will not be shown again.'));
          console.log(chalk.dim('  Secret key is stored in your system keychain.'));
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exitCode = 1;
      }
    });

  parent
    .command('import <secret-key>')
    .description('Import a wallet from a secret key')
    .option('--name <name>', 'Wallet name')
    .option('-n, --network <network>', 'Network (testnet or mainnet)', 'testnet')
    .option('--json', 'Output as JSON')
    .action(async (secretKey: string, opts: { name?: string; network: string; json?: boolean }) => {
      try {
        const network = opts.network as NetworkType;
        if (network !== 'testnet' && network !== 'mainnet') {
          console.error(chalk.red('Error: --network must be "testnet" or "mainnet".'));
          process.exitCode = 1;
          return;
        }

        secretKey = secretKey.trim();
        if (!StrKey.isValidEd25519SecretSeed(secretKey)) {
          console.error(chalk.red('Error: Invalid secret key.'));
          console.error(chalk.dim('  Secret keys start with "S" and are 56 characters long.'));
          process.exitCode = 1;
          return;
        }

        let keypair: ReturnType<typeof Keypair.fromSecret>;
        try {
          keypair = Keypair.fromSecret(secretKey);
        } catch {
          console.error(chalk.red('Error: Could not parse secret key.'));
          process.exitCode = 1;
          return;
        }

        let name = opts.name;
        if (!name) {
          if (!process.stdin.isTTY) {
            console.error(chalk.red('Error: --name is required in non-interactive mode.'));
            process.exitCode = 1;
            return;
          }
          name = await promptForName();
        }

        const nameCheck = validateWalletName(name);
        if (nameCheck !== true) {
          console.error(chalk.red(`Error: ${nameCheck}`));
          process.exitCode = 1;
          return;
        }

        const existing = await getWallet(name);
        if (existing) {
          console.error(chalk.red(`Error: Wallet "${name}" already exists.`));
          process.exitCode = 1;
          return;
        }

        const wallet: WalletConfig = {
          name,
          publicKey: keypair.publicKey(),
          type: 'standard',
          network,
          createdAt: new Date().toISOString(),
        };

        await addWallet(wallet);

        try {
          await storeSecret(name, secretKey);
        } catch (err) {
          await removeWallet(name);
          console.error(chalk.red('Error: Failed to store secret key in system keychain.'));
          process.exitCode = 1;
          return;
        }

        if (opts.json) {
          console.log(JSON.stringify({
            name: wallet.name,
            publicKey: wallet.publicKey,
            network: wallet.network,
            createdAt: wallet.createdAt,
          }, null, 2));
        } else {
          console.log('');
          console.log(chalk.green('✓ Wallet imported successfully'));
          console.log('');
          console.log(`  Name:       ${wallet.name}`);
          console.log(`  Public Key: ${wallet.publicKey}`);
          console.log(`  Network:    ${wallet.network}`);
        }
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exitCode = 1;
      }
    });
}
