import { Horizon, Networks } from '@stellar/stellar-sdk';

export type NetworkType = 'testnet' | 'mainnet';

export interface StellarBalance {
  asset: string;
  balance: string;
}

const STELLAR_NETWORKS = {
  testnet: {
    horizonURL: 'https://horizon-testnet.stellar.org',
    friendbotURL: 'https://friendbot.stellar.org',
    networkPassphrase: Networks.TESTNET,
  },
  mainnet: {
    horizonURL: 'https://horizon.stellar.org',
    friendbotURL: '',
    networkPassphrase: Networks.PUBLIC,
  },
} as const;

export function getNetworkConfig(network: NetworkType) {
  return STELLAR_NETWORKS[network];
}

export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  const { friendbotURL } = STELLAR_NETWORKS.testnet;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${friendbotURL}?addr=${publicKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchAccountBalances(
  publicKey: string,
  network: NetworkType,
): Promise<StellarBalance[]> {
  const { horizonURL } = STELLAR_NETWORKS[network];
  const server = new Horizon.Server(horizonURL);
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map((b: any) => ({
      asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
      balance: b.balance,
    }));
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return [];
    }
    throw err;
  }
}
