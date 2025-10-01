import {
  Keypair,
  TransactionBuilder,
  Operation,
  xdr,
} from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "../stellar/config";

const ORACLE_CONTRACT_ADDRESS =
  "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63";

export class ReflectorPriceService {
  private rpcServer: StellarSdk.rpc.Server;
  private sourceKeypair: StellarSdk.Keypair;

  constructor(sourceSecret: string) {
    this.rpcServer = new StellarSdk.rpc.Server(STELLAR_CONFIG.sorobanRpcURL, {
      allowHttp: false,
    });
    this.sourceKeypair = Keypair.fromSecret(sourceSecret);
  }

  /**
   * Create Asset enum: Asset::Other(Symbol)
   * In Soroban, enums are Vec with [discriminant_name, value]
   */
  private createAsset(assetCode: string): xdr.ScVal {
    const symbol = xdr.ScVal.scvSymbol(assetCode);

    return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol("Other"), symbol]);
  }

  async fetchAssetPrice(assetCode: string) {
    try {
      const account = await this.rpcServer.getAccount(
        this.sourceKeypair.publicKey()
      );

      const asset = this.createAsset(assetCode);

      const txBuilder = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      }).addOperation(
        Operation.invokeContractFunction({
          contract: ORACLE_CONTRACT_ADDRESS,
          function: "lastprice",
          args: [asset],
        })
      );

      const transaction = txBuilder.setTimeout(30).build();

      const simulation = await this.rpcServer.simulateTransaction(transaction);

      if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        const result = simulation.result?.retval;

        if (!result || result.switch().name === "scvVoid") {
          return null;
        }

        return this.parsePriceData(result);
      } else {
        console.error("Simulation failed:", simulation.error);
      }

      return null;
    } catch (err) {
      console.error("Oracle fetch error:", err);
      return null;
    }
  }

  private parsePriceData(scval: xdr.ScVal): {
    price: string;
    timestamp: string;
    priceUSD: string;
  } | null {
    try {
      // The result is directly a Map (PriceData struct)
      if (scval.switch().name === "scvMap") {
        const map = scval.map();
        if (!map) return null;

        const result: any = {};

        map.forEach((entry) => {
          const key = entry.key().sym()?.toString();
          const valScVal = entry.val();

          if (key === "price") {
            result.price = this.parseI128(valScVal);
          } else if (key === "timestamp") {
            result.timestamp = valScVal.u64()?.toString();
          }
        });

        // Convert price to human-readable format (Reflector uses 14 decimals)
        if (result.price) {
          const priceBigInt = BigInt(result.price);
          const divisor = BigInt(10 ** 14);
          const priceNum = Number(priceBigInt) / Number(divisor);
          result.priceUSD = priceNum.toFixed(6);
        }

        // Convert timestamp to Date
        if (result.timestamp) {
          result.timestampDate = new Date(
            Number(result.timestamp) * 1000
          ).toISOString();
        }

        return result;
      }

      return null;
    } catch (err) {
      console.error("Error parsing price data:", err);
      return null;
    }
  }

  private parseI128(scval: xdr.ScVal): string {
    if (scval.switch().name === "scvI128") {
      const i128Parts = scval.i128();
      const hi = BigInt(i128Parts.hi().toString());
      const lo = BigInt(i128Parts.lo().toString());

      // Combine hi and lo parts
      const value = (hi << 64n) | lo;
      return value.toString();
    }

    return "0";
  }

  /**
   * Fetch multiple asset prices in parallel
   */
  async fetchMultiplePrices(assetCodes: string[]) {
    const promises = assetCodes.map((code) =>
      this.fetchAssetPrice(code).then((price) => ({ asset: code, ...price }))
    );

    return Promise.all(promises);
  }
}
