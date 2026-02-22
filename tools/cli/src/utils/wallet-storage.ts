import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as keytar from 'keytar';
import { StrKey } from '@stellar/stellar-sdk';

const CONFIG_DIR = path.join(os.homedir(), '.galaxy', 'wallets');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const KEYTAR_SERVICE = 'galaxy-devkit';

export interface WalletConfig {
  name: string;
  publicKey: string;
  type: 'standard' | 'multisig' | 'ledger';
  network: 'testnet' | 'mainnet';
  createdAt: string;
}

interface ConfigFile {
  version: number;
  wallets: WalletConfig[];
}

export async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function loadConfig(): Promise<WalletConfig[]> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed: ConfigFile = JSON.parse(raw);
    return parsed.wallets || [];
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    if (err instanceof SyntaxError) {
      throw new Error(`Wallet config file is corrupted: ${CONFIG_FILE}\nDelete it and try again, or restore from backup.`);
    }
    throw err;
  }
}

export async function saveConfig(wallets: WalletConfig[]): Promise<void> {
  await ensureConfigDir();
  const data: ConfigFile = { version: 1, wallets };
  const json = JSON.stringify(data, null, 2);
  const tmpFile = CONFIG_FILE + '.tmp';
  await fs.writeFile(tmpFile, json, 'utf-8');
  await fs.rename(tmpFile, CONFIG_FILE);
}

export async function addWallet(wallet: WalletConfig): Promise<void> {
  if (!StrKey.isValidEd25519PublicKey(wallet.publicKey)) {
    throw new Error(`Invalid public key: ${wallet.publicKey}`);
  }
  const wallets = await loadConfig();
  if (wallets.some((w) => w.name === wallet.name)) {
    throw new Error(`Wallet "${wallet.name}" already exists. Choose a different name.`);
  }
  wallets.push(wallet);
  await saveConfig(wallets);
}

export async function getWallet(name: string): Promise<WalletConfig | undefined> {
  const wallets = await loadConfig();
  return wallets.find((w) => w.name === name);
}

export async function listWallets(): Promise<WalletConfig[]> {
  return loadConfig();
}

export async function removeWallet(name: string): Promise<boolean> {
  const wallets = await loadConfig();
  const idx = wallets.findIndex((w) => w.name === name);
  if (idx === -1) return false;
  wallets.splice(idx, 1);
  await saveConfig(wallets);
  return true;
}

export async function storeSecret(name: string, secret: string): Promise<void> {
  await keytar.setPassword(KEYTAR_SERVICE, name, secret);
}

export async function getSecret(name: string): Promise<string | null> {
  return keytar.getPassword(KEYTAR_SERVICE, name);
}

export async function deleteSecret(name: string): Promise<boolean> {
  return keytar.deletePassword(KEYTAR_SERVICE, name);
}
