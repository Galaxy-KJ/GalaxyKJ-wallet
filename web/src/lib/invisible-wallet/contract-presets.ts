/**
 * Soroban Smart Contract Presets
 *
 * Pre-configured helpers for invoking specific smart contracts in the project.
 * Provides type-safe, easy-to-use interfaces for SmartSwap, PriceOracle,
 * SecurityLimits, and AutomatedPayment contracts.
 */

import { InvisibleWalletSDK } from './sdk';
import { ContractInvocationResponse, NetworkType } from '@/types/invisible-wallet';
import { SorobanUtils } from './soroban-utils';

/**
 * Contract IDs configuration
 * These should be updated with actual deployed contract IDs
 */
export const CONTRACT_IDS = {
  testnet: {
    smartSwap: process.env.NEXT_PUBLIC_SMARTSWAP_CONTRACT_ID_TESTNET || '',
    priceOracle: process.env.NEXT_PUBLIC_PRICEORACLE_CONTRACT_ID_TESTNET || '',
    securityLimits: process.env.NEXT_PUBLIC_SECURITYLIMITS_CONTRACT_ID_TESTNET || '',
    automatedPayment: process.env.NEXT_PUBLIC_AUTOMATEDPAYMENT_CONTRACT_ID_TESTNET || '',
  },
  mainnet: {
    smartSwap: process.env.NEXT_PUBLIC_SMARTSWAP_CONTRACT_ID_MAINNET || '',
    priceOracle: process.env.NEXT_PUBLIC_PRICEORACLE_CONTRACT_ID_MAINNET || '',
    securityLimits: process.env.NEXT_PUBLIC_SECURITYLIMITS_CONTRACT_ID_MAINNET || '',
    automatedPayment: process.env.NEXT_PUBLIC_AUTOMATEDPAYMENT_CONTRACT_ID_MAINNET || '',
  },
};

/**
 * SmartSwap contract preset
 */
export class SmartSwapContract {
  constructor(private sdk: InvisibleWalletSDK) {}

  /**
   * Swap tokens from one asset to another
   */
  async swap(params: {
    walletId: string;
    email: string;
    passphrase: string;
    fromAsset: string;
    toAsset: string;
    amount: bigint;
    minReceived: bigint;
    network?: NetworkType;
    simulateOnly?: boolean;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].smartSwap;

    if (!contractId) {
      throw new Error(`SmartSwap contract ID not configured for ${network}`);
    }

    const fromAssetAddr = SorobanUtils.createAddress(params.fromAsset);
    const toAssetAddr = SorobanUtils.createAddress(params.toAsset);

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'swap',
      [fromAssetAddr, toAssetAddr, params.amount, params.minReceived],
      { network, simulateOnly: params.simulateOnly }
    );
  }

  /**
   * Get exchange rate between two assets
   */
  async getRate(params: {
    walletId: string;
    email: string;
    passphrase: string;
    fromAsset: string;
    toAsset: string;
    network?: NetworkType;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].smartSwap;

    if (!contractId) {
      throw new Error(`SmartSwap contract ID not configured for ${network}`);
    }

    const fromAssetAddr = SorobanUtils.createAddress(params.fromAsset);
    const toAssetAddr = SorobanUtils.createAddress(params.toAsset);

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'get_rate',
      [fromAssetAddr, toAssetAddr],
      { network, simulateOnly: true }
    );
  }
}

/**
 * PriceOracle contract preset
 */
export class PriceOracleContract {
  constructor(private sdk: InvisibleWalletSDK) {}

  /**
   * Get current price for an asset
   */
  async getPrice(params: {
    walletId: string;
    email: string;
    passphrase: string;
    asset: string;
    network?: NetworkType;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].priceOracle;

    if (!contractId) {
      throw new Error(`PriceOracle contract ID not configured for ${network}`);
    }

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'get_price',
      [params.asset],
      { network, simulateOnly: true }
    );
  }

  /**
   * Update price for an asset (admin only)
   */
  async updatePrice(params: {
    walletId: string;
    email: string;
    passphrase: string;
    asset: string;
    price: bigint;
    network?: NetworkType;
    simulateOnly?: boolean;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].priceOracle;

    if (!contractId) {
      throw new Error(`PriceOracle contract ID not configured for ${network}`);
    }

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'update_price',
      [params.asset, params.price],
      { network, simulateOnly: params.simulateOnly }
    );
  }
}

/**
 * SecurityLimits contract preset
 */
export class SecurityLimitsContract {
  constructor(private sdk: InvisibleWalletSDK) {}

  /**
   * Check if a transaction is within limits
   */
  async checkLimit(params: {
    walletId: string;
    email: string;
    passphrase: string;
    userAddress: string;
    amount: bigint;
    network?: NetworkType;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].securityLimits;

    if (!contractId) {
      throw new Error(`SecurityLimits contract ID not configured for ${network}`);
    }

    const userAddr = SorobanUtils.createAddress(params.userAddress);

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'check_limit',
      [userAddr, params.amount],
      { network, simulateOnly: true }
    );
  }

  /**
   * Set daily limit for a user
   */
  async setDailyLimit(params: {
    walletId: string;
    email: string;
    passphrase: string;
    userAddress: string;
    limit: bigint;
    network?: NetworkType;
    simulateOnly?: boolean;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].securityLimits;

    if (!contractId) {
      throw new Error(`SecurityLimits contract ID not configured for ${network}`);
    }

    const userAddr = SorobanUtils.createAddress(params.userAddress);

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'set_daily_limit',
      [userAddr, params.limit],
      { network, simulateOnly: params.simulateOnly }
    );
  }
}

/**
 * AutomatedPayment contract preset
 */
export class AutomatedPaymentContract {
  constructor(private sdk: InvisibleWalletSDK) {}

  /**
   * Schedule a recurring payment
   */
  async schedule(params: {
    walletId: string;
    email: string;
    passphrase: string;
    toAddress: string;
    amount: bigint;
    intervalSeconds: number;
    network?: NetworkType;
    simulateOnly?: boolean;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].automatedPayment;

    if (!contractId) {
      throw new Error(`AutomatedPayment contract ID not configured for ${network}`);
    }

    const toAddr = SorobanUtils.createAddress(params.toAddress);

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'schedule',
      [toAddr, params.amount, params.intervalSeconds],
      { network, simulateOnly: params.simulateOnly }
    );
  }

  /**
   * Cancel a scheduled payment
   */
  async cancel(params: {
    walletId: string;
    email: string;
    passphrase: string;
    paymentId: bigint;
    network?: NetworkType;
    simulateOnly?: boolean;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].automatedPayment;

    if (!contractId) {
      throw new Error(`AutomatedPayment contract ID not configured for ${network}`);
    }

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'cancel',
      [params.paymentId],
      { network, simulateOnly: params.simulateOnly }
    );
  }

  /**
   * Get payment details
   */
  async getPayment(params: {
    walletId: string;
    email: string;
    passphrase: string;
    paymentId: bigint;
    network?: NetworkType;
  }): Promise<ContractInvocationResponse> {
    const network = params.network || 'testnet';
    const contractId = CONTRACT_IDS[network].automatedPayment;

    if (!contractId) {
      throw new Error(`AutomatedPayment contract ID not configured for ${network}`);
    }

    return this.sdk.invokeContract(
      params.walletId,
      params.email,
      params.passphrase,
      contractId,
      'get_payment',
      [params.paymentId],
      { network, simulateOnly: true }
    );
  }
}

/**
 * Contract presets factory
 */
export function createContractPresets(sdk: InvisibleWalletSDK) {
  return {
    smartSwap: new SmartSwapContract(sdk),
    priceOracle: new PriceOracleContract(sdk),
    securityLimits: new SecurityLimitsContract(sdk),
    automatedPayment: new AutomatedPaymentContract(sdk),
  };
}
