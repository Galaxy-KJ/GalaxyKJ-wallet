import {
  WalletAccount,
  WalletBalance,
  WalletTransaction,
} from "@/types/wallet";
import { Asset, Operation } from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";
import type {
  PaymentOperationParams,
  CreateAccountOperationParams,
  ChangeTrustOperationParams,
  PathPaymentStrictSendOperationParams,
} from "@/types/stellar-operations";

/**
 * Horizon API response types
 */

interface HorizonAccountResponse {
  id: string;
  sequence: string;
  subentry_count: number;
  home_domain?: string;
  inflation_destination?: string;
  last_modified_ledger: number;
  last_modified_time: string;
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
    auth_clawback_enabled: boolean;
  };
  balances: Array<{
    balance: string;
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    buying_liabilities?: string;
    selling_liabilities?: string;
    is_authorized?: boolean;
    last_modified_ledger?: number;
  }>;
  signers: Array<{
    weight: number;
    key: string;
    type: string;
  }>;
  data_attr: Record<string, string>;
}

interface HorizonTransactionResponse {
  _embedded: {
    records: Array<{
      id: string;
      hash: string;
      source_account: string;
      fee_charged: string;
      successful: boolean;
      created_at: string;
      memo?: string;
      memo_type?: string;
    }>;
  };
}

/**
 * StellarService class
 * Provides methods for interacting with the Stellar network via Horizon API
 */
class StellarService {
  private horizonUrl: string = "";
  private server: StellarSdk.Horizon.Server | null = null;

  async initialize(horizonUrl: string): Promise<void> {
    try {
      this.horizonUrl = horizonUrl;
      this.server = new StellarSdk.Horizon.Server(horizonUrl);
      console.log(" Stellar service initialized with URL:", horizonUrl);
    } catch (error) {
      console.error(" Failed to initialize Stellar service:", error);
      throw new Error("Failed to initialize Stellar service");
    }
  }

  private async makeRequest<T = unknown>(endpoint: string): Promise<T> {
    const url = `${this.horizonUrl}${endpoint}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Account not found");
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async loadAccount(publicKey: string): Promise<WalletAccount> {
    if (!this.horizonUrl) {
      throw new Error("Stellar service not initialized");
    }

    const accountResponse = await this.makeRequest<HorizonAccountResponse>(
      `/accounts/${publicKey}`
    );

    return {
      publicKey: accountResponse.id,
      sequence: accountResponse.sequence,
      subentry_count: accountResponse.subentry_count,
      home_domain: accountResponse.home_domain,
      inflation_destination: accountResponse.inflation_destination,
      last_modified_ledger: accountResponse.last_modified_ledger,
      last_modified_time: accountResponse.last_modified_time,
      thresholds: {
        low_threshold: accountResponse.thresholds.low_threshold,
        med_threshold: accountResponse.thresholds.med_threshold,
        high_threshold: accountResponse.thresholds.high_threshold,
      },
      flags: {
        auth_required: accountResponse.flags.auth_required,
        auth_revocable: accountResponse.flags.auth_revocable,
        auth_immutable: accountResponse.flags.auth_immutable,
        auth_clawback_enabled: accountResponse.flags.auth_clawback_enabled,
      },
      signers: accountResponse.signers.map((signer) => ({
        weight: signer.weight,
        key: signer.key,
        type: signer.type,
      })),
      data: accountResponse.data_attr,
    };
  }

  async getAccountResponse(publicKey: string): Promise<HorizonAccountResponse> {
    if (!this.horizonUrl) {
      throw new Error("Stellar service not initialized");
    }

    return await this.makeRequest<HorizonAccountResponse>(
      `/accounts/${publicKey}`
    );
  }

  async loadBalance(
    accountResponse: HorizonAccountResponse
  ): Promise<WalletBalance> {
    const xlmBalance = accountResponse.balances.find(
      (balance) => balance.asset_type === "native"
    );

    const assetBalances = accountResponse.balances
      .filter((balance) => balance.asset_type !== "native")
      .map((balance) => ({
        asset: {
          code: balance.asset_code || "",
          issuer: balance.asset_issuer || "",
          isNative: () => false,
          getCode: () => balance.asset_code || "",
          getIssuer: () => balance.asset_issuer || "",
        } as Asset,
        balance: balance.balance,
        buying_liabilities: balance.buying_liabilities || "0",
        selling_liabilities: balance.selling_liabilities || "0",
        authorized: balance.is_authorized || false,
        last_modified_ledger: balance.last_modified_ledger || 0,
      }));

    return {
      xlm: {
        balance: xlmBalance?.balance || "0",
        buying_liabilities: xlmBalance?.buying_liabilities || "0",
        selling_liabilities: xlmBalance?.selling_liabilities || "0",
      },
      assets: assetBalances,
      totalXLMValue: xlmBalance?.balance || "0",
    };
  }

  async loadTransactions(publicKey: string): Promise<WalletTransaction[]> {
    if (!this.horizonUrl) {
      throw new Error("Stellar service not initialized");
    }

    const transactionResponse =
      await this.makeRequest<HorizonTransactionResponse>(
        `/accounts/${publicKey}/transactions?order=desc&limit=50`
      );

    const transactions: WalletTransaction[] =
      transactionResponse._embedded.records.map((record) => ({
        id: record.id,
        hash: record.hash,
        type: "other" as const,
        amount: record.fee_charged,
        asset: "XLM",
        from: record.source_account,
        to: record.source_account,
        timestamp: new Date(record.created_at),
        fee: record.fee_charged,
        successful: record.successful,
        memo: record.memo,
      }));

    return transactions;
  }

  buildPaymentOperation(
    params: PaymentOperationParams
  ): ReturnType<typeof Operation.payment> {
    return Operation.payment({
      destination: params.destination,
      asset: params.asset,
      amount: params.amount,
      source: params.source,
    });
  }

  buildCreateAccountOperation(
    params: CreateAccountOperationParams
  ): ReturnType<typeof Operation.createAccount> {
    return Operation.createAccount({
      destination: params.destination,
      startingBalance: params.startingBalance,
      source: params.source,
    });
  }

  buildChangeTrustOperation(
    params: ChangeTrustOperationParams
  ): ReturnType<typeof Operation.changeTrust> {
    return Operation.changeTrust({
      asset: params.asset,
      limit: params.limit,
      source: params.source,
    });
  }

  buildPathPaymentStrictSendOperation(
    params: PathPaymentStrictSendOperationParams
  ): ReturnType<typeof Operation.pathPaymentStrictSend> {
    return Operation.pathPaymentStrictSend({
      sendAsset: params.sendAsset,
      sendAmount: params.sendAmount,
      destination: params.destination,
      destAsset: params.destAsset,
      destMin: params.destMin,
      path: params.path,
      source: params.source,
    });
  }

  getServer(): StellarSdk.Horizon.Server {
    if (!this.server) {
      throw new Error("Stellar service not initialized");
    }
    return this.server;
  }
}

// Export a singleton instance
export const stellarService = new StellarService();
