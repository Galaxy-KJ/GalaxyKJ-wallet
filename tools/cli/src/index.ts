#!/usr/bin/env node

import { Command } from 'commander';
import { registerWalletCommands } from './commands/wallet';

const program = new Command();

program
  .name('galaxy')
  .description('Galaxy DevKit CLI - Stellar blockchain development toolkit')
  .version('0.1.0');

registerWalletCommands(program);

program.parse();
