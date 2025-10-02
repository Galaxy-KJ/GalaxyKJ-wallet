import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  BASE_FEE,
  xdr,
} from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";
import { ReflectorPriceService } from "./reflector-price-service";
import { AssetPriceManager, PriceData } from "./asset-price-manager";
import { PriceMonitor } from "./price-monitor";

export interface AutomationRule {
  id: string;
  type: "price_target" | "percentage_change" | "stop_loss" | "take_profit";
  enabled: boolean;
  sourceAsset: string;
  targetAsset: string;
  amount: string;
  condition: {
    operator: "gt" | "lt" | "gte" | "lte" | "eq";
    value: number; 
  };
  slippagePercent: number; // Max acceptable slippage
  createdAt: number;
  lastExecuted?: number;
}

export interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  executedPrice?: number;
  slippage?: number;
  error?: string;
  timestamp: number;
}

export interface ExecutionContext {
  rule: AutomationRule;
  currentPrice: number;
  priceData: PriceData;
  estimatedSlippage: number;
}

export class ExecutionEngine {
  private priceService: ReflectorPriceService;
  private priceManager: AssetPriceManager;
  private priceMonitor: PriceMonitor;
  private rpcServer: StellarSdk.rpc.Server;
  private activeRules: Map<string, AutomationRule> = new Map();
  private executionHistory: Map<string, ExecutionResult[]> = new Map();
  private isRunning: boolean = false;

  constructor(rpcUrl: string, networkPassphrase: string = Networks.PUBLIC) {
    this.priceService = new ReflectorPriceService();
    this.priceManager = new AssetPriceManager();
    this.priceMonitor = new PriceMonitor(60000); 
    this.rpcServer = new StellarSdk.rpc.Server(rpcUrl, { allowHttp: false });

    this.priceMonitor.on("priceChange", (data) => {
      this.handlePriceChange(data);
    });
  }

  /**
   * Add automation rule
   */
  addRule(rule: AutomationRule): void {
    this.activeRules.set(rule.id, rule);
    console.log(`✅ Added automation rule: ${rule.id} (${rule.type})`);

    // Register assets for monitoring
    this.priceManager.registerAsset({
      code: rule.sourceAsset,
      type: "Other",
      enabled: true,
    });

    if (rule.targetAsset) {
      this.priceManager.registerAsset({
        code: rule.targetAsset,
        type: "Other",
        enabled: true,
      });
    }
  }

  /**
   * Remove automation rule
   */
  removeRule(ruleId: string): void {
    this.activeRules.delete(ruleId);
    console.log(`🗑️  Removed automation rule: ${ruleId}`);
  }

  /**
   * Get all active rules
   */
  getActiveRules(): AutomationRule[] {
    return Array.from(this.activeRules.values());
  }

  /**
   * Start the execution engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("⚠️  Execution engine is already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting execution engine...");

    // Get unique assets from all rules
    const assetsToMonitor = new Set<string>();
    this.activeRules.forEach((rule) => {
      assetsToMonitor.add(rule.sourceAsset);
      if (rule.targetAsset) {
        assetsToMonitor.add(rule.targetAsset);
      }
    });

    // Start monitoring prices
    await this.priceMonitor.startMonitoring(Array.from(assetsToMonitor));

    console.log("✅ Execution engine started");
  }

  /**
   * Stop the execution engine
   */
  stop(): void {
    this.isRunning = false;
    this.priceMonitor.stopMonitoring();
    console.log("🛑 Execution engine stopped");
  }

  /**
   * Handle price change events
   */
  private async handlePriceChange(data: {
    asset: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
  }): Promise<void> {
    console.log(
      `🔔 Price change: ${data.asset} ${data.oldPrice} → ${
        data.newPrice
      } (${data.changePercent.toFixed(2)}%)`
    );

    // Check all rules for this asset
    for (const rule of this.activeRules.values()) {
      if (rule.enabled && rule.sourceAsset === data.asset) {
        await this.evaluateAndExecute(rule, data.newPrice);
      }
    }
  }

  /**
   * Evaluate rule condition and execute if met
   */
  private async evaluateAndExecute(
    rule: AutomationRule,
    currentPrice: number
  ): Promise<void> {
    const shouldExecute = this.evaluateCondition(rule, currentPrice);

    if (!shouldExecute) {
      return;
    }

    console.log(`🎯 Rule ${rule.id} condition met, preparing execution...`);

    // Get fresh price data
    const priceData = await this.priceService.fetchAssetPrice(rule.sourceAsset);

    if (!priceData) {
      console.error(`❌ Failed to get price data for ${rule.sourceAsset}`);
      return;
    }

    // Estimate slippage
    const estimatedSlippage = this.estimateSlippage(
      currentPrice,
      parseFloat(rule.amount)
    );

    // Check if slippage is acceptable
    if (estimatedSlippage > rule.slippagePercent) {
      console.warn(
        `⚠️  Estimated slippage (${estimatedSlippage.toFixed(
          2
        )}%) exceeds limit (${rule.slippagePercent}%)`
      );
      return;
    }

    const context: ExecutionContext = {
      rule,
      currentPrice,
      priceData,
      estimatedSlippage,
    };

    // Execute the swap
    await this.executeSwap(context);
  }

  /**
   * Evaluate if condition is met
   */
  private evaluateCondition(
    rule: AutomationRule,
    currentPrice: number
  ): boolean {
    const { operator, value } = rule.condition;

    switch (rule.type) {
      case "price_target":
        return this.comparePrice(currentPrice, operator, value);

      case "percentage_change": {
        const cachedPrice = this.priceManager.getCachedPrice(rule.sourceAsset);
        if (!cachedPrice) return false;

        const basePrice = parseFloat(cachedPrice.priceUSD);
        const changePercent = ((currentPrice - basePrice) / basePrice) * 100;

        return this.comparePrice(Math.abs(changePercent), operator, value);
      }

      case "stop_loss":
        return currentPrice <= value;

      case "take_profit":
        return currentPrice >= value;

      default:
        return false;
    }
  }

  /**
   * Compare price with condition
   */
  private comparePrice(
    price: number,
    operator: string,
    target: number
  ): boolean {
    switch (operator) {
      case "gt":
        return price > target;
      case "lt":
        return price < target;
      case "gte":
        return price >= target;
      case "lte":
        return price <= target;
      case "eq":
        return Math.abs(price - target) < 0.0001; 
      default:
        return false;
    }
  }

  /**
   * Estimate slippage based on trade size
   */
  private estimateSlippage(price: number, amount: number): number {
      const tradeValue = price * amount;

    if (tradeValue < 1000) return 0.1; // 0.1%
    if (tradeValue < 10000) return 0.5; // 0.5%
    if (tradeValue < 100000) return 1.0; // 1%
    return 2.0; // 2%
  }

  /**
   * Execute swap transaction
   */
  private async executeSwap(
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { rule, currentPrice, estimatedSlippage } = context;

    console.log(`🔄 Executing swap for rule ${rule.id}...`);
    console.log(`   Asset: ${rule.sourceAsset} → ${rule.targetAsset}`);
    console.log(`   Amount: ${rule.amount}`);
    console.log(`   Price: $${currentPrice}`);
    console.log(`   Estimated Slippage: ${estimatedSlippage.toFixed(2)}%`);

    const result: ExecutionResult = {
      success: false,
      timestamp: Date.now(),
    };

    try {
      const executedPrice = this.simulateExecution(
        currentPrice,
        estimatedSlippage
      );

      const actualSlippage =
        Math.abs(executedPrice - currentPrice) / currentPrice;

      // Verify slippage protection
      if (actualSlippage * 100 > rule.slippagePercent) {
        throw new Error(
          `Slippage protection triggered: ${(actualSlippage * 100).toFixed(2)}%`
        );
      }

      result.success = true;
      result.executedPrice = executedPrice;
      result.slippage = actualSlippage * 100;
      result.transactionHash = this.generateMockTxHash();

      // Update rule execution timestamp
      rule.lastExecuted = Date.now();

      console.log(`✅ Swap executed successfully`);
      console.log(`   Transaction: ${result.transactionHash}`);
      console.log(`   Executed Price: $${executedPrice}`);
      console.log(`   Actual Slippage: ${result.slippage?.toFixed(4)}%`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Swap execution failed:`, result.error);
    }

    this.addExecutionHistory(rule.id, result);

    return result;
  }

  /**
   * Simulate execution with slippage
   */
  private simulateExecution(
    targetPrice: number,
    estimatedSlippage: number
  ): number {

    const slippageFactor = 1 + (Math.random() * estimatedSlippage) / 100;
    return targetPrice * slippageFactor;
  }

  /**
   * Build actual swap transaction
   * NOTE: This is a template - implement according to your swap protocol
   */
  private async buildSwapTransaction(
    sourceKeypair: Keypair,
    context: ExecutionContext
  ): Promise<StellarSdk.Transaction> {
    const { rule, currentPrice } = context;

    const account = await this.rpcServer.getAccount(sourceKeypair.publicKey());

    // Calculate minimum amount out with slippage protection
    const expectedAmount = parseFloat(rule.amount) * currentPrice;
    const minAmountOut = expectedAmount * (1 - rule.slippagePercent / 100);

    // Build transaction (pseudocode - implement based on your DEX)
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    })
      .addOperation(
        // Add your swap operation here
        // This could be a path payment, liquidity pool operation, etc.
        Operation.payment({
          destination: sourceKeypair.publicKey(),
          asset: Asset.native(),
          amount: "0", // Placeholder
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);

    return transaction;
  }

  /**
   * Add execution to history
   */
  private addExecutionHistory(ruleId: string, result: ExecutionResult): void {
    if (!this.executionHistory.has(ruleId)) {
      this.executionHistory.set(ruleId, []);
    }

    const history = this.executionHistory.get(ruleId)!;
    history.push(result);

    // Keep last 100 executions
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get execution history for a rule
   */
  getExecutionHistory(ruleId: string): ExecutionResult[] {
    return this.executionHistory.get(ruleId) || [];
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(ruleId: string): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageSlippage: number;
    lastExecution?: ExecutionResult;
  } {
    const history = this.getExecutionHistory(ruleId);

    const successfulExecutions = history.filter((r) => r.success).length;
    const failedExecutions = history.length - successfulExecutions;

    const slippages = history
      .filter((r) => r.success && r.slippage !== undefined)
      .map((r) => r.slippage!);

    const averageSlippage =
      slippages.length > 0
        ? slippages.reduce((a, b) => a + b, 0) / slippages.length
        : 0;

    return {
      totalExecutions: history.length,
      successfulExecutions,
      failedExecutions,
      averageSlippage,
      lastExecution: history[history.length - 1],
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(ruleId?: string): void {
    if (ruleId) {
      this.executionHistory.delete(ruleId);
    } else {
      this.executionHistory.clear();
    }
  }

  /**
   * Generate mock transaction hash for demo
   */
  private generateMockTxHash(): string {
    return (
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")
    );
  }

  /**
   * Manual execution of a rule (bypass conditions)
   */
  async executeRuleManually(ruleId: string): Promise<ExecutionResult> {
    const rule = this.activeRules.get(ruleId);

    if (!rule) {
      return {
        success: false,
        error: "Rule not found",
        timestamp: Date.now(),
      };
    }

    const priceData = await this.priceService.fetchAssetPrice(rule.sourceAsset);

    if (!priceData) {
      return {
        success: false,
        error: "Failed to fetch price data",
        timestamp: Date.now(),
      };
    }

    const currentPrice = parseFloat(priceData.priceUSD);
    const estimatedSlippage = this.estimateSlippage(
      currentPrice,
      parseFloat(rule.amount)
    );

    const context: ExecutionContext = {
      rule,
      currentPrice,
      priceData,
      estimatedSlippage,
    };

    return this.executeSwap(context);
  }
}
