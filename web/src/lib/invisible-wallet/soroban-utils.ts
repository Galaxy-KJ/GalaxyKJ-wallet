/**
 * Soroban Smart Contract Utilities
 *
 * Helper functions for encoding/decoding Soroban contract arguments
 * and working with XDR ScVal types for smart contract invocation.
 */

import { xdr, nativeToScVal, scValToNative, Address, Contract } from '@stellar/stellar-sdk';

/**
 * Soroban utility functions for contract interaction
 */
export class SorobanUtils {
  /**
   * Encodes a JavaScript value to Stellar ScVal XDR
   * Supports: string, number, boolean, bigint, Address
   */
  static encodeArg(value: string | number | boolean | bigint | Address): string {
    try {
      let scVal: xdr.ScVal;

      if (value instanceof Address) {
        scVal = value.toScVal();
      } else {
        scVal = nativeToScVal(value);
      }

      return scVal.toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to encode argument: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encodes multiple arguments to ScVal XDR array
   */
  static encodeArgs(values: (string | number | boolean | bigint | Address)[]): string[] {
    return values.map(v => this.encodeArg(v));
  }

  /**
   * Decodes an ScVal XDR result to a JavaScript value
   */
  static decodeResult(resultXdr: string): unknown {
    try {
      const scVal = xdr.ScVal.fromXDR(resultXdr, 'base64');
      return scValToNative(scVal);
    } catch (error) {
      throw new Error(`Failed to decode result: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a Contract instance from a contract ID
   */
  static getContract(contractId: string): Contract {
    try {
      return new Contract(contractId);
    } catch (error) {
      throw new Error(`Invalid contract ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates a contract ID format (C...)
   */
  static isValidContractId(contractId: string): boolean {
    try {
      // Contract IDs should start with 'C' and be 56 characters long
      if (!contractId || !contractId.startsWith('C') || contractId.length !== 56) {
        return false;
      }
      // Try to create a Contract instance to validate
      new Contract(contractId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Converts a WASM hash to a contract ID
   * Useful for deploying contracts
   */
  static contractIdFromWasm(wasmHash: string): string {
    try {
      const hashBuffer = Buffer.from(wasmHash, 'hex');
      const address = Address.fromContractId(hashBuffer);
      return address.toString();
    } catch (error) {
      throw new Error(`Failed to convert WASM hash to contract ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates an Address from a Stellar account (G...) or contract (C...)
   */
  static createAddress(strKey: string): Address {
    try {
      return new Address(strKey);
    } catch (error) {
      throw new Error(`Invalid address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encodes a symbol (function name) for Soroban
   */
  static encodeSymbol(symbol: string): string {
    try {
      const scVal = xdr.ScVal.scvSymbol(symbol);
      return scVal.toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to encode symbol: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encodes a bytes value for Soroban
   */
  static encodeBytes(bytes: Buffer | Uint8Array): string {
    try {
      const scVal = xdr.ScVal.scvBytes(bytes);
      return scVal.toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to encode bytes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encodes a vector (array) of values for Soroban
   */
  static encodeVec(values: unknown[]): string {
    try {
      const scVals = values.map(v => {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') {
          return nativeToScVal(v);
        }
        throw new Error(`Unsupported value type in vector: ${typeof v}`);
      });

      const scVal = xdr.ScVal.scvVec(scVals);
      return scVal.toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to encode vector: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encodes a map for Soroban
   */
  static encodeMap(entries: Record<string, unknown>): string {
    try {
      const mapEntries = Object.entries(entries).map(([key, value]) => {
        const keyScVal = nativeToScVal(key);
        const valScVal = nativeToScVal(value);
        return new xdr.ScMapEntry({ key: keyScVal, val: valScVal });
      });

      const scVal = xdr.ScVal.scvMap(mapEntries);
      return scVal.toXDR('base64');
    } catch (error) {
      throw new Error(`Failed to encode map: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
