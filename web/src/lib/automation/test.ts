import { PriceMonitor } from "./price-monitor";
import { AssetPriceManager } from "./asset-price-manager";
import { ExecutionEngine } from "./execution-engine";
import { Networks } from "@stellar/stellar-sdk";

// ============================================================================
// TEST 1: Basic Price Monitoring
// ============================================================================
async function testBasicMonitoring() {
  console.log("\n🧪 TEST 1: Basic Price Monitoring");
  console.log("=".repeat(60));

  const manager = new AssetPriceManager();
  const monitor = new PriceMonitor(60000); // Poll every 60 seconds

  // Register assets
  manager.registerAssets([
    { code: "XLM", type: "Stellar", enabled: true },
    { code: "USDC", type: "Stellar", enabled: true },
    { code: "BTC", type: "Other", enabled: true },
  ]);

  console.log("✅ Registered assets:", manager.getRegisteredAssets());

  // Listen for price change events
  monitor.on("priceChange", (data) => {
    const { asset, oldPrice, newPrice, changePercent } = data;
    console.log(
      `📈 ${asset} changed from $${oldPrice} → $${newPrice} (${changePercent.toFixed(
        2
      )}%)`
    );

    // Get and display stats
    const stats = manager.getPriceStats(asset);
    if (stats) {
      console.log(`   📊 Stats:`);
      console.log(`      Current: $${stats.current.toFixed(6)}`);
      console.log(`      Min: $${stats.min.toFixed(6)}`);
      console.log(`      Max: $${stats.max.toFixed(6)}`);
      console.log(`      Avg: $${stats.avg.toFixed(6)}`);
      console.log(`      Volatility: ${stats.volatility.toFixed(6)}`);
      console.log(`      24h Change: ${stats.change24h.toFixed(2)}%`);
    }

    // Get trend
    const trend = manager.getPriceTrend(asset, 5);
    console.log(`   📉 Trend (5 periods): ${trend}`);
  });

  // Handle errors
  monitor.on("error", ({ asset, error }) => {
    console.error(`❌ Error fetching price for ${asset}:`, error);
  });

  // Start monitoring
  await monitor.startMonitoring(["XLM", "USDC", "BTC"]);
  console.log("✅ Monitor started successfully");

  // Run for 3 minutes then stop
  setTimeout(() => {
    console.log("\n⏰ Test duration complete, stopping monitor...");
    monitor.stopMonitoring();
  }, 180000);
}

// ============================================================================
// TEST 2: Asset Price Manager Features
// ============================================================================
async function testAssetPriceManager() {
  console.log("\n🧪 TEST 2: Asset Price Manager Features");
  console.log("=".repeat(60));

  const manager = new AssetPriceManager();

  // Register multiple assets
  manager.registerAssets([
    { code: "BTC", type: "Other", enabled: true },
    { code: "ETH", type: "Other", enabled: true },
    { code: "XLM", type: "Stellar", enabled: true },
  ]);

  console.log("📝 Registered Assets:");
  manager.getRegisteredAssets().forEach((asset) => {
    console.log(`   - ${asset.code} (${asset.type})`);
  });

  // Fetch single price
  console.log("\n🔍 Fetching single price for BTC...");
  const btcPrice = await manager.fetchPrice("BTC");
  if (btcPrice) {
    console.log(`✅ BTC Price: $${btcPrice.priceUSD}`);
    console.log(`   Timestamp: ${btcPrice.timestampDate}`);
  }

  // Fetch multiple prices
  console.log("\n🔍 Fetching multiple prices...");
  const prices = await manager.fetchMultiplePrices(["BTC", "ETH", "XLM"]);
  prices.forEach((price, asset) => {
    if (price) {
      console.log(`✅ ${asset}: $${price.priceUSD}`);
    } else {
      console.log(`❌ ${asset}: No data`);
    }
  });

  // Get cached prices
  console.log("\n💾 Cached Prices:");
  const cached = manager.getAllCachedPrices();
  cached.forEach((price, asset) => {
    console.log(`   ${asset}: $${price.priceUSD}`);
  });

  // Test price validation
  console.log("\n🔍 Testing price validation...");
  if (btcPrice) {
    const isValid = manager.validatePrice("BTC", btcPrice);
    console.log(
      `   BTC price validation: ${isValid ? "✅ Valid" : "❌ Invalid"}`
    );
  }

  // Test outlier detection
  console.log("\n🚨 Testing outlier detection...");
  const testPrice = { price: "999999999", priceUSD: "999999", timestamp: "0" };
  const isOutlier = manager.isOutlier("BTC", 999999);
  console.log(
    `   Extreme price outlier: ${isOutlier ? "✅ Detected" : "❌ Not detected"}`
  );

  // Get price history
  console.log("\n📊 Price History:");
  const history = manager.getPriceHistory("BTC");
  if (history) {
    console.log(`   Asset: ${history.asset}`);
    console.log(`   Data points: ${history.prices.length}`);
    if (history.prices.length > 0) {
      const latest = history.prices[history.prices.length - 1];
      console.log(
        `   Latest: $${latest.price} at ${new Date(
          latest.timestamp
        ).toISOString()}`
      );
    }
  }

  // Get price stats
  console.log("\n📈 Price Statistics:");
  const stats = manager.getPriceStats("BTC");
  if (stats) {
    console.log(`   Current: $${stats.current.toFixed(2)}`);
    console.log(`   Min: $${stats.min.toFixed(2)}`);
    console.log(`   Max: $${stats.max.toFixed(2)}`);
    console.log(`   Average: $${stats.avg.toFixed(2)}`);
    console.log(`   Volatility: ${stats.volatility.toFixed(2)}`);
    console.log(`   24h Change: ${stats.change24h.toFixed(2)}%`);
  }

  // Get price trend
  const trend = manager.getPriceTrend("BTC", 10);
  console.log(`\n📉 Price Trend: ${trend}`);
}

// ============================================================================
// TEST 3: Execution Engine with Automation Rules
// ============================================================================
async function testExecutionEngine() {
  console.log("\n🧪 TEST 3: Execution Engine with Automation Rules");
  console.log("=".repeat(60));

  const engine = new ExecutionEngine(
    "https://soroban-testnet.stellar.org",
    Networks.TESTNET
  );

  // Test 1: Price Target Rule
  console.log("\n➕ Adding Price Target Rule...");
  engine.addRule({
    id: "btc-price-target",
    type: "price_target",
    enabled: true,
    sourceAsset: "BTC",
    targetAsset: "USDC",
    amount: "0.1",
    condition: {
      operator: "gte",
      value: 118000,
    },
    slippagePercent: 1.0,
    createdAt: Date.now(),
  });

  // Test 2: Stop Loss Rule
  console.log("➕ Adding Stop Loss Rule...");
  engine.addRule({
    id: "btc-stop-loss",
    type: "stop_loss",
    enabled: true,
    sourceAsset: "BTC",
    targetAsset: "USDC",
    amount: "0.5",
    condition: {
      operator: "lte",
      value: 40000,
    },
    slippagePercent: 2.0,
    createdAt: Date.now(),
  });

  // Test 3: Take Profit Rule
  console.log("➕ Adding Take Profit Rule...");
  engine.addRule({
    id: "eth-take-profit",
    type: "take_profit",
    enabled: true,
    sourceAsset: "ETH",
    targetAsset: "USDC",
    amount: "1.0",
    condition: {
      operator: "gte",
      value: 3000,
    },
    slippagePercent: 1.5,
    createdAt: Date.now(),
  });

  // Test 4: Percentage Change Rule
  console.log("➕ Adding Percentage Change Rule...");
  engine.addRule({
    id: "xlm-percent-change",
    type: "percentage_change",
    enabled: true,
    sourceAsset: "XLM",
    targetAsset: "USDC",
    amount: "1000",
    condition: {
      operator: "gte",
      value: 5, // 5% change
    },
    slippagePercent: 0.5,
    createdAt: Date.now(),
  });

  // Display active rules
  console.log("\n📋 Active Rules:");
  const rules = engine.getActiveRules();
  rules.forEach((rule, index) => {
    console.log(`   ${index + 1}. ${rule.id} (${rule.type})`);
    console.log(`      ${rule.sourceAsset} → ${rule.targetAsset}`);
    console.log(`      Amount: ${rule.amount}`);
    console.log(
      `      Condition: ${rule.condition.operator} ${rule.condition.value}`
    );
    console.log(`      Max Slippage: ${rule.slippagePercent}%`);
  });

  // Start the engine
  console.log("\n🚀 Starting execution engine...");
  await engine.start();

  // Test manual execution
  console.log("\n🔧 Testing manual execution...");
  const manualResult = await engine.executeRuleManually("btc-price-target");
  console.log("\n📊 Manual Execution Result:");
  console.log(`   Success: ${manualResult.success ? "✅" : "❌"}`);
  if (manualResult.success) {
    console.log(`   Transaction: ${manualResult.transactionHash}`);
    console.log(
      `   Executed Price: $${manualResult.executedPrice?.toFixed(2)}`
    );
    console.log(`   Slippage: ${manualResult.slippage?.toFixed(4)}%`);
  } else {
    console.log(`   Error: ${manualResult.error}`);
  }

  // Wait 2 minutes for automatic executions
  console.log("\n⏰ Monitoring for automatic executions (2 minutes)...");
  await new Promise((resolve) => setTimeout(resolve, 120000));

  // Get execution statistics
  console.log("\n📊 Execution Statistics:");
  rules.forEach((rule) => {
    const stats = engine.getExecutionStats(rule.id);
    console.log(`\n   ${rule.id}:`);
    console.log(`      Total Executions: ${stats.totalExecutions}`);
    console.log(`      Successful: ${stats.successfulExecutions}`);
    console.log(`      Failed: ${stats.failedExecutions}`);
    console.log(`      Avg Slippage: ${stats.averageSlippage.toFixed(4)}%`);

    if (stats.lastExecution) {
      console.log(
        `      Last Execution: ${stats.lastExecution.success ? "✅" : "❌"}`
      );
      if (stats.lastExecution.transactionHash) {
        console.log(
          `      TX: ${stats.lastExecution.transactionHash.substring(0, 16)}...`
        );
      }
    }
  });

  // Get execution history
  console.log("\n📜 Execution History (BTC Price Target):");
  const history = engine.getExecutionHistory("btc-price-target");
  history.slice(-5).forEach((result, index) => {
    console.log(
      `   ${index + 1}. ${result.success ? "✅" : "❌"} at ${new Date(
        result.timestamp
      ).toISOString()}`
    );
    if (result.executedPrice) {
      console.log(
        `      Price: $${result.executedPrice.toFixed(
          2
        )}, Slippage: ${result.slippage?.toFixed(4)}%`
      );
    }
  });

  // Stop the engine
  console.log("\n🛑 Stopping execution engine...");
  engine.stop();
}

// ============================================================================
// TEST 4: Integration Test - All Components Together
// ============================================================================
async function testFullIntegration() {
  console.log("\n🧪 TEST 4: Full Integration Test");
  console.log("=".repeat(60));

  const manager = new AssetPriceManager();
  const monitor = new PriceMonitor(30000); // 30 second polling
  const engine = new ExecutionEngine(
    "https://soroban-testnet.stellar.org",
    Networks.TESTNET
  );

  // Setup assets
  const assets = ["BTC", "ETH", "XLM"];
  manager.registerAssets(
    assets.map((code) => ({
      code,
      type: code === "XLM" ? "Stellar" : "Other",
      enabled: true,
    }))
  );

  // Setup automation rules
  engine.addRule({
    id: "integration-test-rule",
    type: "percentage_change",
    enabled: true,
    sourceAsset: "BTC",
    targetAsset: "USDC",
    amount: "0.1",
    condition: { operator: "gte", value: 2 },
    slippagePercent: 1.0,
    createdAt: Date.now(),
  });

  // Monitor price changes
  monitor.on("priceChange", async (data) => {
    console.log(`\n🔔 Price Alert: ${data.asset}`);
    console.log(`   Old: $${data.oldPrice} → New: $${data.newPrice}`);
    console.log(`   Change: ${data.changePercent.toFixed(2)}%`);

    // Update manager cache
    await manager.fetchPrice(data.asset);

    // Check stats
    const stats = manager.getPriceStats(data.asset);
    if (stats) {
      console.log(`   📊 Volatility: ${stats.volatility.toFixed(4)}`);
      console.log(`   📈 Trend: ${manager.getPriceTrend(data.asset)}`);
    }
  });

  // Start all components
  console.log("\n🚀 Starting integrated system...");
  await monitor.startMonitoring(assets);
  await engine.start();

  console.log("✅ All components running");
  console.log("   - Price Monitor: Active");
  console.log("   - Asset Manager: Active");
  console.log("   - Execution Engine: Active");

  // Run for 5 minutes
  console.log("\n⏰ Running integration test for 5 minutes...");
  await new Promise((resolve) => setTimeout(resolve, 300000));

  // Cleanup
  console.log("\n🧹 Cleaning up...");
  monitor.stopMonitoring();
  engine.stop();
  manager.clearAll();
  console.log("✅ Integration test complete");
}

// ============================================================================
// TEST 5: Error Handling and Edge Cases
// ============================================================================
async function testErrorHandling() {
  console.log("\n🧪 TEST 5: Error Handling and Edge Cases");
  console.log("=".repeat(60));

  const manager = new AssetPriceManager();

  // Test 1: Fetch price for unregistered asset
  console.log("\n❌ Test: Fetch unregistered asset");
  const result1 = await manager.fetchPrice("UNKNOWN_ASSET");
  console.log(`   Result: ${result1 ? "Data returned" : "Null (expected)"}`);

  // Test 2: Register then unregister asset
  console.log("\n🔄 Test: Register and unregister");
  manager.registerAsset({ code: "TEST", type: "Other", enabled: true });
  console.log("   ✅ Asset registered");
  manager.unregisterAsset("TEST");
  console.log("   ✅ Asset unregistered");

  // Test 3: Disabled asset
  console.log("\n⛔ Test: Disabled asset");
  manager.registerAsset({ code: "DISABLED", type: "Other", enabled: false });
  const result2 = await manager.fetchPrice("DISABLED");
  console.log(`   Result: ${result2 ? "Data returned" : "Null (expected)"}`);

  // Test 4: Price stats with no history
  console.log("\n📊 Test: Stats with no history");
  const stats = manager.getPriceStats("NONEXISTENT");
  console.log(`   Stats: ${stats ? "Data returned" : "Null (expected)"}`);

  // Test 5: Price trend with insufficient data
  console.log("\n📉 Test: Trend with insufficient data");
  const trend = manager.getPriceTrend("NEW_ASSET", 10);
  console.log(`   Trend: ${trend} (expected: stable)`);

  console.log("\n✅ Error handling tests complete");
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("🧪 REFLECTOR PRICE ORACLE TEST SUITE");
  console.log("=".repeat(60));

  try {
    // Run individual tests
    await testBasicMonitoring();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testAssetPriceManager();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testExecutionEngine();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testFullIntegration();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testErrorHandling();

    console.log("\n");
    console.log("=".repeat(60));
    console.log("✅ ALL TESTS COMPLETED");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

// Run all tests
runAllTests().catch(console.error);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down test suite...");
  process.exit(0);
});

// ============================================================================
// EXPORT FOR INDIVIDUAL TEST EXECUTION
// ============================================================================
export {
  testBasicMonitoring,
  testAssetPriceManager,
  testExecutionEngine,
  testFullIntegration,
  testErrorHandling,
  runAllTests,
};
