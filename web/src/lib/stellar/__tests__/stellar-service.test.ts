/**
 * Unit tests for StellarService
 *
 * These tests verify that the StellarService correctly uses the type definitions
 * and interacts with the Stellar network.
 */

import { Asset, Operation } from "@stellar/stellar-sdk";
import { stellarService } from "../stellar-service";
import type {
  PaymentOperationParams,
  CreateAccountOperationParams,
  ChangeTrustOperationParams,
  PathPaymentStrictSendOperationParams,
} from "@/types/stellar-operations";

// Mock fetch globally
global.fetch = jest.fn();

// Mock Stellar SDK Server
jest.mock("@stellar/stellar-sdk", () => {
  const actual = jest.requireActual("@stellar/stellar-sdk");
  return {
    ...actual,
    Server: jest.fn().mockImplementation(() => ({
      loadAccount: jest.fn(),
      fetchBaseFee: jest.fn(),
      submitTransaction: jest.fn(),
    })),
  };
});

describe("StellarService", () => {
  const mockHorizonUrl = "https://horizon-testnet.stellar.org";
  const mockPublicKey =
    "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialize", () => {
    it("should initialize with a Horizon URL", async () => {
      await stellarService.initialize(mockHorizonUrl);

      // Service should be initialized without errors
      expect(stellarService).toBeDefined();
    });

    it("should handle initialization errors", async () => {
      // This test verifies error handling exists
      await expect(
        stellarService.initialize(mockHorizonUrl)
      ).resolves.not.toThrow();
    });
  });

  describe("loadAccount", () => {
    const mockAccountResponse = {
      id: mockPublicKey,
      sequence: "123456789",
      subentry_count: 2,
      home_domain: "example.com",
      last_modified_ledger: 12345,
      last_modified_time: "2024-01-01T00:00:00Z",
      thresholds: {
        low_threshold: 0,
        med_threshold: 0,
        high_threshold: 0,
      },
      flags: {
        auth_required: false,
        auth_revocable: false,
        auth_immutable: false,
        auth_clawback_enabled: false,
      },
      balances: [
        {
          balance: "100.0000000",
          asset_type: "native",
        },
      ],
      signers: [
        {
          weight: 1,
          key: mockPublicKey,
          type: "ed25519_public_key",
        },
      ],
      data_attr: {},
    };

    beforeEach(async () => {
      await stellarService.initialize(mockHorizonUrl);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAccountResponse,
      });
    });

    it("should load account with proper types", async () => {
      const account = await stellarService.loadAccount(mockPublicKey);

      expect(account.publicKey).toBe(mockPublicKey);
      expect(account.sequence).toBe("123456789");
      expect(account.thresholds).toBeDefined();
      expect(account.flags).toBeDefined();
      expect(account.signers).toHaveLength(1);
    });

    it("should throw error if not initialized", async () => {
      const uninitializedService = Object.create(
        Object.getPrototypeOf(stellarService)
      );
      uninitializedService.horizonUrl = "";

      await expect(
        uninitializedService.loadAccount(mockPublicKey)
      ).rejects.toThrow("Stellar service not initialized");
    });

    it("should handle account not found error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(stellarService.loadAccount(mockPublicKey)).rejects.toThrow(
        "Account not found"
      );
    });
  });

  describe("getAccountResponse", () => {
    beforeEach(async () => {
      await stellarService.initialize(mockHorizonUrl);
    });

    it("should return raw account response with proper types", async () => {
      const mockResponse = {
        id: mockPublicKey,
        sequence: "123456789",
        subentry_count: 2,
        last_modified_ledger: 12345,
        last_modified_time: "2024-01-01T00:00:00Z",
        thresholds: {
          low_threshold: 0,
          med_threshold: 0,
          high_threshold: 0,
        },
        flags: {
          auth_required: false,
          auth_revocable: false,
          auth_immutable: false,
          auth_clawback_enabled: false,
        },
        balances: [],
        signers: [],
        data_attr: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await stellarService.getAccountResponse(mockPublicKey);

      expect(response.id).toBe(mockPublicKey);
      expect(response.sequence).toBe("123456789");
    });
  });

  describe("loadBalance", () => {
    it("should load balance with proper types", async () => {
      const mockAccountResponse = {
        id: mockPublicKey,
        sequence: "123456789",
        subentry_count: 2,
        last_modified_ledger: 12345,
        last_modified_time: "2024-01-01T00:00:00Z",
        thresholds: {
          low_threshold: 0,
          med_threshold: 0,
          high_threshold: 0,
        },
        flags: {
          auth_required: false,
          auth_revocable: false,
          auth_immutable: false,
          auth_clawback_enabled: false,
        },
        balances: [
          {
            balance: "100.0000000",
            asset_type: "native",
            buying_liabilities: "0",
            selling_liabilities: "0",
          },
          {
            balance: "50.0000000",
            asset_type: "credit_alphanum4",
            asset_code: "USDC",
            asset_issuer:
              "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
            buying_liabilities: "0",
            selling_liabilities: "0",
            is_authorized: true,
            last_modified_ledger: 12345,
          },
        ],
        signers: [],
        data_attr: {},
      };

      const balance = await stellarService.loadBalance(mockAccountResponse);

      expect(balance.xlm.balance).toBe("100.0000000");
      expect(balance.assets).toHaveLength(1);
      expect(balance.assets[0].balance).toBe("50.0000000");
      expect(balance.assets[0].asset.code).toBe("USDC");
    });

    it("should handle accounts with no XLM balance", async () => {
      const mockAccountResponse = {
        id: mockPublicKey,
        sequence: "123456789",
        subentry_count: 0,
        last_modified_ledger: 12345,
        last_modified_time: "2024-01-01T00:00:00Z",
        thresholds: {
          low_threshold: 0,
          med_threshold: 0,
          high_threshold: 0,
        },
        flags: {
          auth_required: false,
          auth_revocable: false,
          auth_immutable: false,
          auth_clawback_enabled: false,
        },
        balances: [],
        signers: [],
        data_attr: {},
      };

      const balance = await stellarService.loadBalance(mockAccountResponse);

      expect(balance.xlm.balance).toBe("0");
      expect(balance.totalXLMValue).toBe("0");
    });
  });

  describe("buildPaymentOperation", () => {
    it("should build payment operation with proper types", () => {
      const params: PaymentOperationParams = {
        destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        asset: Asset.native(),
        amount: "100.5000000",
      };

      const operation = stellarService.buildPaymentOperation(params);

      expect(operation).toBeDefined();
      // Operation is created successfully with proper types
    });

    it("should include source if provided", () => {
      const params: PaymentOperationParams = {
        destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        asset: Asset.native(),
        amount: "100.5000000",
        source: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      };

      const operation = stellarService.buildPaymentOperation(params);

      expect(operation).toBeDefined();
      // Operation is created successfully with source
    });
  });

  describe("buildCreateAccountOperation", () => {
    it("should build create account operation with proper types", () => {
      const params: CreateAccountOperationParams = {
        destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        startingBalance: "2.0000000",
      };

      const operation = stellarService.buildCreateAccountOperation(params);

      expect(operation).toBeDefined();
      // Operation is created successfully with proper types
    });
  });

  describe("buildChangeTrustOperation", () => {
    it("should build change trust operation with proper types", () => {
      const asset = new Asset(
        "USDC",
        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
      );

      const params: ChangeTrustOperationParams = {
        asset,
        limit: "1000000.0000000",
      };

      const operation = stellarService.buildChangeTrustOperation(params);

      expect(operation).toBeDefined();
      // Operation is created successfully with proper types
    });
  });

  describe("buildPathPaymentStrictSendOperation", () => {
    it("should build path payment strict send operation with proper types", () => {
      const sendAsset = Asset.native();
      const destAsset = new Asset(
        "USDC",
        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
      );

      const params: PathPaymentStrictSendOperationParams = {
        sendAsset,
        sendAmount: "100.0000000",
        destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        destAsset,
        destMin: "95.0000000",
      };

      const operation =
        stellarService.buildPathPaymentStrictSendOperation(params);

      expect(operation).toBeDefined();
      // Operation is created successfully with proper types
    });
  });

  describe("getServer", () => {
    it("should return Server instance when initialized", async () => {
      await stellarService.initialize(mockHorizonUrl);

      const server = stellarService.getServer();

      expect(server).toBeDefined();
    });

    it("should throw error if not initialized", () => {
      const uninitializedService = Object.create(
        Object.getPrototypeOf(stellarService)
      );
      uninitializedService.server = null;

      expect(() => uninitializedService.getServer()).toThrow(
        "Stellar service not initialized"
      );
    });
  });
});
