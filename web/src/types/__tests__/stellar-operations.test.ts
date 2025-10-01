/**
 * Unit tests for Stellar operations type definitions
 * 
 * These tests verify that the type definitions are correctly structured
 * and compatible with the Stellar SDK.
 */

import { Asset, Operation } from '@stellar/stellar-sdk';
import type {
  PaymentOperationParams,
  CreateAccountOperationParams,
  ChangeTrustOperationParams,
  PathPaymentStrictSendOperationParams,
  PathPaymentStrictReceiveOperationParams,
  ManageSellOfferOperationParams,
  ManageBuyOfferOperationParams,
  StellarOperationParams,
  TransactionBuilderParams,
  TransactionResult,
  HorizonErrorResponse,
} from '../stellar-operations';

describe('Stellar Operations Type Definitions', () => {
  describe('PaymentOperationParams', () => {
    it('should accept valid payment operation parameters', () => {
      const paymentParams: PaymentOperationParams = {
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        asset: Asset.native(),
        amount: '100.5000000',
      };

      expect(paymentParams.destination).toBeDefined();
      expect(paymentParams.asset).toBeDefined();
      expect(paymentParams.amount).toBe('100.5000000');
    });

    it('should accept optional source parameter', () => {
      const paymentParams: PaymentOperationParams = {
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        asset: Asset.native(),
        amount: '100.5000000',
        source: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      };

      expect(paymentParams.source).toBeDefined();
    });

    it('should work with custom assets', () => {
      const customAsset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const paymentParams: PaymentOperationParams = {
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        asset: customAsset,
        amount: '50.0000000',
      };

      expect(paymentParams.asset).toBe(customAsset);
    });

    it('should be compatible with Operation.payment', () => {
      const paymentParams: PaymentOperationParams = {
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        asset: Asset.native(),
        amount: '100.5000000',
      };

      // This should compile without errors
      const operation = Operation.payment(paymentParams);
      expect(operation).toBeDefined();
    });
  });

  describe('CreateAccountOperationParams', () => {
    it('should accept valid create account parameters', () => {
      const createAccountParams: CreateAccountOperationParams = {
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        startingBalance: '2.0000000',
      };

      expect(createAccountParams.destination).toBeDefined();
      expect(createAccountParams.startingBalance).toBe('2.0000000');
    });

    it('should be compatible with Operation.createAccount', () => {
      const createAccountParams: CreateAccountOperationParams = {
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        startingBalance: '2.0000000',
      };

      const operation = Operation.createAccount(createAccountParams);
      expect(operation).toBeDefined();
    });
  });

  describe('ChangeTrustOperationParams', () => {
    it('should accept valid change trust parameters', () => {
      const asset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const changeTrustParams: ChangeTrustOperationParams = {
        asset,
        limit: '1000000.0000000',
      };

      expect(changeTrustParams.asset).toBe(asset);
      expect(changeTrustParams.limit).toBe('1000000.0000000');
    });

    it('should accept undefined limit for maximum trust', () => {
      const asset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const changeTrustParams: ChangeTrustOperationParams = {
        asset,
      };

      expect(changeTrustParams.limit).toBeUndefined();
    });

    it('should be compatible with Operation.changeTrust', () => {
      const asset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const changeTrustParams: ChangeTrustOperationParams = {
        asset,
        limit: '1000000.0000000',
      };

      const operation = Operation.changeTrust(changeTrustParams);
      expect(operation).toBeDefined();
    });
  });

  describe('PathPaymentStrictSendOperationParams', () => {
    it('should accept valid path payment strict send parameters', () => {
      const sendAsset = Asset.native();
      const destAsset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const pathPaymentParams: PathPaymentStrictSendOperationParams = {
        sendAsset,
        sendAmount: '100.0000000',
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        destAsset,
        destMin: '95.0000000',
      };

      expect(pathPaymentParams.sendAsset).toBe(sendAsset);
      expect(pathPaymentParams.destAsset).toBe(destAsset);
      expect(pathPaymentParams.sendAmount).toBe('100.0000000');
      expect(pathPaymentParams.destMin).toBe('95.0000000');
    });

    it('should accept optional path parameter', () => {
      const sendAsset = Asset.native();
      const destAsset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );
      const intermediateAsset = new Asset(
        'BTC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const pathPaymentParams: PathPaymentStrictSendOperationParams = {
        sendAsset,
        sendAmount: '100.0000000',
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        destAsset,
        destMin: '95.0000000',
        path: [intermediateAsset],
      };

      expect(pathPaymentParams.path).toHaveLength(1);
      expect(pathPaymentParams.path?.[0]).toBe(intermediateAsset);
    });

    it('should be compatible with Operation.pathPaymentStrictSend', () => {
      const sendAsset = Asset.native();
      const destAsset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const pathPaymentParams: PathPaymentStrictSendOperationParams = {
        sendAsset,
        sendAmount: '100.0000000',
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        destAsset,
        destMin: '95.0000000',
      };

      const operation = Operation.pathPaymentStrictSend(pathPaymentParams);
      expect(operation).toBeDefined();
    });
  });

  describe('PathPaymentStrictReceiveOperationParams', () => {
    it('should accept valid path payment strict receive parameters', () => {
      const sendAsset = Asset.native();
      const destAsset = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const pathPaymentParams: PathPaymentStrictReceiveOperationParams = {
        sendAsset,
        sendMax: '105.0000000',
        destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
        destAsset,
        destAmount: '100.0000000',
      };

      expect(pathPaymentParams.sendMax).toBe('105.0000000');
      expect(pathPaymentParams.destAmount).toBe('100.0000000');
    });
  });

  describe('ManageSellOfferOperationParams', () => {
    it('should accept valid manage sell offer parameters with string price', () => {
      const selling = Asset.native();
      const buying = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const manageSellOfferParams: ManageSellOfferOperationParams = {
        selling,
        buying,
        amount: '100.0000000',
        price: '1.5',
      };

      expect(manageSellOfferParams.price).toBe('1.5');
    });

    it('should accept price as object with numerator and denominator', () => {
      const selling = Asset.native();
      const buying = new Asset(
        'USDC',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      const manageSellOfferParams: ManageSellOfferOperationParams = {
        selling,
        buying,
        amount: '100.0000000',
        price: { n: 3, d: 2 }, // 1.5
      };

      expect(manageSellOfferParams.price).toEqual({ n: 3, d: 2 });
    });
  });

  describe('StellarOperationParams Union Type', () => {
    it('should accept any valid operation type', () => {
      const operations: StellarOperationParams[] = [
        {
          destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
          asset: Asset.native(),
          amount: '100.0000000',
        } as PaymentOperationParams,
        {
          destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
          startingBalance: '2.0000000',
        } as CreateAccountOperationParams,
      ];

      expect(operations).toHaveLength(2);
    });
  });

  describe('TransactionResult', () => {
    it('should match Horizon transaction response structure', () => {
      const result: TransactionResult = {
        successful: true,
        hash: 'abc123',
        ledger: 12345,
        envelope_xdr: 'xdr_envelope',
        result_xdr: 'xdr_result',
        fee_charged: '100',
      };

      expect(result.successful).toBe(true);
      expect(result.hash).toBe('abc123');
      expect(result.ledger).toBe(12345);
    });
  });

  describe('HorizonErrorResponse', () => {
    it('should match Horizon error response structure', () => {
      const error: HorizonErrorResponse = {
        type: 'transaction_failed',
        title: 'Transaction Failed',
        status: 400,
        detail: 'The transaction failed',
        extras: {
          result_codes: {
            transaction: 'tx_failed',
            operations: ['op_underfunded'],
          },
        },
      };

      expect(error.status).toBe(400);
      expect(error.extras?.result_codes?.operations).toContain('op_underfunded');
    });
  });
});

