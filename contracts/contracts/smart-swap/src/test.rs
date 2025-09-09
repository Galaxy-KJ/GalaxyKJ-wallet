#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

fn create_test_env() -> (Env, Address, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let oracle_address = Address::generate(&env);
    let dex_address = Address::generate(&env);
    
    // Initialize contract
    SmartSwap::initialize(env.clone(), admin.clone(), oracle_address, dex_address).unwrap();
    
    (env, admin, user, oracle_address)
}

fn create_test_swap_request(env: &Env) -> CreateSwapRequest {
    CreateSwapRequest {
        source_asset: Symbol::new(env, "XLM"),
        destination_asset: Symbol::new(env, "USDC"),
        condition_type: SwapConditionType::PercentageIncrease(10), // 10% increase
        amount_to_swap: 100_0000000, // 100 XLM
        max_slippage: 500,           // 5% slippage
        expires_at: env.ledger().timestamp() + 86400, // 24 hours
        max_executions: 1,
    }
}

fn create_advanced_swap_request(env: &Env, condition_type: SwapConditionType) -> CreateSwapRequest {
    CreateSwapRequest {
        source_asset: Symbol::new(env, "XLM"),
        destination_asset: Symbol::new(env, "BTC"),
        condition_type,
        amount_to_swap: 1000_0000000, // 1000 XLM
        max_slippage: 300,            // 3% slippage
        expires_at: env.ledger().timestamp() + 3600, // 1 hour
        max_executions: 0, // Unlimited executions
    }
}

#[test]
fn test_contract_initialization() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let oracle_address = Address::generate(&env);
    let dex_address = Address::generate(&env);
    
    let result = SmartSwap::initialize(env.clone(), admin.clone(), oracle_address, dex_address);
    assert!(result.is_ok());
    
    // Test double initialization fails
    let result = SmartSwap::initialize(env.clone(), admin, Address::generate(&env), Address::generate(&env));
    assert_eq!(result, Err(Symbol::new(&env, "already_initialized")));
}

#[test]
fn test_create_swap_condition_success() {
    let (env, _admin, user, _oracle) = create_test_env();
    let request = create_test_swap_request(&env);
    
    let result = SmartSwap::create_swap_condition(env.clone(), user.clone(), request);
    assert!(result.is_ok());
    
    let condition_id = result.unwrap();
    assert_eq!(condition_id, 1);
    
    // Verify condition was created
    let condition = SmartSwap::get_condition(env.clone(), condition_id);
    assert!(condition.is_some());
    
    let condition = condition.unwrap();
    assert_eq!(condition.owner, user);
    assert_eq!(condition.status, SwapStatus::Active);
    assert_eq!(condition.amount_to_swap, 100_0000000);
}

#[test]
fn test_create_swap_condition_validation_failures() {
    let (env, _admin, user, _oracle) = create_test_env();
    
    // Test invalid slippage
    let mut request = create_test_swap_request(&env);
    request.max_slippage = 6000; // 60% - too high
    
    let result = SmartSwap::create_swap_condition(env.clone(), user.clone(), request);
    assert_eq!(result, Err(Symbol::new(&env, "slippage_too_high")));
    
    // Test same asset swap
    let mut request = create_test_swap_request(&env);
    request.destination_asset = request.source_asset.clone();
    
    let result = SmartSwap::create_swap_condition(env.clone(), user.clone(), request);
    assert_eq!(result, Err(Symbol::new(&env, "same_assets")));
    
    // Test zero amount
    let mut request = create_test_swap_request(&env);
    request.amount_to_swap = 0;
    
    let result = SmartSwap::create_swap_condition(env.clone(), user.clone(), request);
    assert_eq!(result, Err(Symbol::new(&env, "amount_too_small")));
}

#[test]
fn test_multiple_condition_types() {
    let (env, _admin, user, _oracle) = create_test_env();
    
    // Test percentage increase
    let request1 = create_advanced_swap_request(&env, SwapConditionType::PercentageIncrease(15));
    let result1 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request1);
    assert!(result1.is_ok());
    
    // Test percentage decrease  
    let request2 = create_advanced_swap_request(&env, SwapConditionType::PercentageDecrease(20));
    let result2 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request2);
    assert!(result2.is_ok());
    
    // Test target price
    let request3 = create_advanced_swap_request(&env, SwapConditionType::TargetPrice(150000));
    let result3 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request3);
    assert!(result3.is_ok());
    
    // Test price above
    let request4 = create_advanced_swap_request(&env, SwapConditionType::PriceAbove(200000));
    let result4 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request4);
    assert!(result4.is_ok());
    
    // Test price below
    let request5 = create_advanced_swap_request(&env, SwapConditionType::PriceBelow(100000));
    let result5 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request5);
    assert!(result5.is_ok());
    
    // Verify all conditions were created
    let user_conditions = SmartSwap::get_user_conditions(env.clone(), user);
    assert_eq!(user_conditions.len(), 5);
}

#[test]
fn test_cancel_condition() {
    let (env, _admin, user, _oracle) = create_test_env();
    let request = create_test_swap_request(&env);
    
    let condition_id = SmartSwap::create_swap_condition(env.clone(), user.clone(), request).unwrap();
    
    // Cancel the condition
    let result = SmartSwap::cancel_condition(env.clone(), user.clone(), condition_id);
    assert!(result.is_ok());
    
    // Verify condition is cancelled
    let condition = SmartSwap::get_condition(env.clone(), condition_id).unwrap();
    assert_eq!(condition.status, SwapStatus::Cancelled);
}

#[test]
fn test_cancel_condition_unauthorized() {
    let (env, _admin, user, _oracle) = create_test_env();
    let other_user = Address::generate(&env);
    let request = create_test_swap_request(&env);
    
    let condition_id = SmartSwap::create_swap_condition(env.clone(), user.clone(), request).unwrap();
    
    // Try to cancel with different user
    let result = SmartSwap::cancel_condition(env.clone(), other_user, condition_id);
    assert_eq!(result, Err(Symbol::new(&env, "not_owner")));
}

#[test]
fn test_swap_condition_should_execute_logic() {
    let env = Env::default();
    
    // Test percentage increase condition
    let condition = SwapCondition {
        id: 1,
        owner: Address::generate(&env),
        source_asset: Symbol::new(&env, "XLM"),
        destination_asset: Symbol::new(&env, "USDC"),
        condition_type: SwapConditionType::PercentageIncrease(10), // 10% increase needed
        amount_to_swap: 100_0000000,
        min_amount_out: 90_0000000,
        max_slippage: 500,
        reference_price: 100000, // Reference price
        created_at: env.ledger().timestamp(),
        expires_at: env.ledger().timestamp() + 3600,
        status: SwapStatus::Active,
        last_check: env.ledger().timestamp(),
        execution_count: 0,
        max_executions: 1,
    };
    
    // Should not execute at same price
    assert!(!condition.should_execute(100000));
    
    // Should not execute at 5% increase
    assert!(!condition.should_execute(105000));
    
    // Should execute at 10% increase
    assert!(condition.should_execute(110000));
    
    // Should execute at 15% increase
    assert!(condition.should_execute(115000));
}

#[test]
fn test_swap_condition_target_price_logic() {
    let env = Env::default();
    
    let condition = SwapCondition {
        id: 1,
        owner: Address::generate(&env),
        source_asset: Symbol::new(&env, "XLM"),
        destination_asset: Symbol::new(&env, "USDC"),
        condition_type: SwapConditionType::TargetPrice(120000), // Target price
        amount_to_swap: 100_0000000,
        min_amount_out: 90_0000000,
        max_slippage: 500,
        reference_price: 100000,
        created_at: env.ledger().timestamp(),
        expires_at: env.ledger().timestamp() + 3600,
        status: SwapStatus::Active,
        last_check: env.ledger().timestamp(),
        execution_count: 0,
        max_executions: 1,
    };
    
    // Should not execute far from target
    assert!(!condition.should_execute(100000));
    assert!(!condition.should_execute(130000));
    
    // Should execute at target (within tolerance)
    assert!(condition.should_execute(120000));
    assert!(condition.should_execute(119900)); // Within 0.1% tolerance
    assert!(condition.should_execute(120100)); // Within 0.1% tolerance
}

#[test]
fn test_get_swap_quote() {
    let (env, _admin, _user, _oracle) = create_test_env();
    
    let result = SmartSwap::get_swap_quote(
        env.clone(),
        Symbol::new(&env, "XLM"),
        Symbol::new(&env, "USDC"),
        100_0000000,
    );
    
    assert!(result.is_ok());
    let quote = result.unwrap();
    assert_eq!(quote.amount_in, 100_0000000);
    assert!(quote.amount_out > 0);
    assert!(quote.estimated_gas > 0);
}

#[test]
fn test_add_supported_asset() {
    let (env, admin, _user, _oracle) = create_test_env();
    
    let btc_symbol = Symbol::new(&env, "BTC");
    let result = SmartSwap::add_supported_asset(env.clone(), admin.clone(), btc_symbol.clone());
    assert!(result.is_ok());
    
    // Test unauthorized access
    let unauthorized = Address::generate(&env);
    let result = SmartSwap::add_supported_asset(env.clone(), unauthorized, Symbol::new(&env, "ETH"));
    assert_eq!(result, Err(Symbol::new(&env, "unauthorized")));
}

#[test]
fn test_pause_functionality() {
    let (env, admin, user, _oracle) = create_test_env();
    
    // Pause contract
    let result = SmartSwap::set_pause_status(env.clone(), admin.clone(), true);
    assert!(result.is_ok());
    
    // Try to create condition while paused
    let request = create_test_swap_request(&env);
    let result = SmartSwap::create_swap_condition(env.clone(), user.clone(), request);
    assert_eq!(result, Err(Symbol::new(&env, "contract_paused")));
    
    // Unpause and try again
    SmartSwap::set_pause_status(env.clone(), admin, false).unwrap();
    let request = create_test_swap_request(&env);
    let result = SmartSwap::create_swap_condition(env.clone(), user, request);
    assert!(result.is_ok());
}

#[test]
fn test_global_stats_tracking() {
    let (env, _admin, user, _oracle) = create_test_env();
    
    // Initial stats should be zero
    let stats = SmartSwap::get_global_stats(env.clone());
    assert_eq!(stats.total_conditions_created, 0);
    assert_eq!(stats.active_conditions_count, 0);
    
    // Create a condition
    let request = create_test_swap_request(&env);
    SmartSwap::create_swap_condition(env.clone(), user.clone(), request).unwrap();
    
    // Stats should be updated
    let stats = SmartSwap::get_global_stats(env.clone());
    assert_eq!(stats.total_conditions_created, 1);
    assert_eq!(stats.active_conditions_count, 1);
    
    // Cancel the condition
    SmartSwap::cancel_condition(env.clone(), user, 1).unwrap();
    
    // Active count should decrease
    let stats = SmartSwap::get_global_stats(env.clone());
    assert_eq!(stats.total_conditions_created, 1);
    assert_eq!(stats.active_conditions_count, 0);
}

#[test]
fn test_user_condition_limit() {
    let (env, admin, user, _oracle) = create_test_env();
    
    // Update config to have low limit for testing
    let oracle_config = OracleConfigManager::create_default_config(&env, Address::generate(&env));
    let dex_config = DexConfigManager::create_default_config(&env, Address::generate(&env));
    
    let config = ContractConfig {
        admin: admin.clone(),
        oracle_config,
        dex_config,
        paused: false,
        max_conditions_per_user: 2, // Set low limit
        min_condition_value: 10_0000000,
    };
    
    env.storage().instance().set(&DataKey::Admin, &config);
    
    // Create conditions up to limit
    let request1 = create_test_swap_request(&env);
    let result1 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request1);
    assert!(result1.is_ok());
    
    let request2 = create_test_swap_request(&env);
    let result2 = SmartSwap::create_swap_condition(env.clone(), user.clone(), request2);
    assert!(result2.is_ok());
    
    // Third condition should fail
    let request3 = create_test_swap_request(&env);
    let result3 = SmartSwap::create_swap_condition(env.clone(), user, request3);
    assert_eq!(result3, Err(Symbol::new(&env, "condition_limit_exceeded")));
}

#[test]
fn test_cleanup_expired_conditions() {
    let (env, _admin, user, _oracle) = create_test_env();
    
    // Create condition that expires soon
    let mut request = create_test_swap_request(&env);
    request.expires_at = env.ledger().timestamp() + 1; // Expires in 1 second
    
    let condition_id = SmartSwap::create_swap_condition(env.clone(), user, request).unwrap();
    
    // Fast forward time
    env.ledger().with_mut(|li| {
        li.timestamp += 10; // Move 10 seconds forward
    });
    
    // Cleanup expired conditions
    let cleaned_count = SmartSwap::cleanup_expired_conditions(env.clone(), 10);
    assert_eq!(cleaned_count, 1);
    
    // Verify condition is marked as expired
    let condition = SmartSwap::get_condition(env.clone(), condition_id).unwrap();
    assert_eq!(condition.status, SwapStatus::Expired);
}

#[test]
fn test_price_oracle_integration() {
    let env = Env::default();
    let oracle_address = Address::generate(&env);
    let oracle_config = OracleConfigManager::create_default_config(&env, oracle_address);
    
    // Test getting price
    let result = PriceOracleClient::get_price(&env, &oracle_config, Symbol::new(&env, "XLM"));
    assert!(result.success);
    assert!(result.price_data.is_some());
    
    let price_data = result.price_data.unwrap();
    assert_eq!(price_data.asset_symbol, Symbol::new(&env, "XLM"));
    assert!(price_data.price > 0);
    assert!(price_data.confidence >= 70);
}

#[test]
fn test_exchange_rate_calculation() {
    let env = Env::default();
    let oracle_address = Address::generate(&env);
    let oracle_config = OracleConfigManager::create_default_config(&env, oracle_address);
    
    let result = PriceOracleClient::calculate_exchange_rate(
        &env,
        &oracle_config,
        Symbol::new(&env, "XLM"),
        Symbol::new(&env, "USDC"),
    );
    
    assert!(result.is_ok());
    let exchange_rate = result.unwrap();
    assert!(exchange_rate > 0);
}

#[test]
fn test_dex_integration() {
    let env = Env::default();
    let dex_address = Address::generate(&env);
    let dex_config = DexConfigManager::create_default_config(&env, dex_address);
    
    // Test getting swap quote
    let result = StellarDexIntegration::get_swap_quote(
        &env,
        &dex_config,
        Symbol::new(&env, "XLM"),
        Symbol::new(&env, "USDC"),
        100_0000000,
    );
    
    assert!(result.is_ok());
    let quote = result.unwrap();
    assert_eq!(quote.amount_in, 100_0000000);
    assert!(quote.amount_out > 0);
    assert!(quote.estimated_gas > 0);
}

#[test]
fn test_liquidity_check() {
    let env = Env::default();
    let dex_address = Address::generate(&env);
    let dex_config = DexConfigManager::create_default_config(&env, dex_address);
    
    let result = StellarDexIntegration::check_liquidity(
        &env,
        &dex_config,
        Symbol::new(&env, "XLM"),
        Symbol::new(&env, "USDC"),
        100_0000000,
    );
    
    assert!(result.is_ok());
    assert!(result.unwrap()); // Should have sufficient liquidity for test amount
}

#[test]
fn test_slippage_calculation() {
    let expected_amount = 100_0000000;
    let actual_amount = 95_0000000;
    
    let slippage = SwapConditionManager::calculate_slippage(expected_amount, actual_amount);
    assert_eq!(slippage, 500); // 5% slippage in basis points
    
    // Test no slippage
    let slippage = SwapConditionManager::calculate_slippage(expected_amount, expected_amount);
    assert_eq!(slippage, 0);
    
    // Test better than expected
    let slippage = SwapConditionManager::calculate_slippage(expected_amount, 105_0000000);
    assert_eq!(slippage, 0);
}

#[test]
fn test_swap_condition_validation() {
    let env = Env::default();
    let current_time = env.ledger().timestamp();
    
    // Test valid condition
    let valid_condition = SwapCondition {
        id: 1,
        owner: Address::generate(&env),
        source_asset: Symbol::new(&env, "XLM"),
        destination_asset: Symbol::new(&env, "USDC"),
        condition_type: SwapConditionType::PercentageIncrease(10),
        amount_to_swap: 100_0000000,
        min_amount_out: 90_0000000,
        max_slippage: 500,
        reference_price: 100000,
        created_at: current_time,
        expires_at: current_time + 3600,
        status: SwapStatus::Active,
        last_check: current_time,
        execution_count: 0,
        max_executions: 1,
    };
    
    assert!(valid_condition.is_valid(&env).is_ok());
    
    // Test expired condition
    let mut expired_condition = valid_condition.clone();
    expired_condition.expires_at = current_time - 1;
    
    assert!(expired_condition.is_valid(&env).is_err());
    
    // Test cancelled condition
    let mut cancelled_condition = valid_condition.clone();
    cancelled_condition.status = SwapStatus::Cancelled;
    
    assert!(cancelled_condition.is_valid(&env).is_err());
}

#[test]
fn test_create_swap_request_validation() {
    let env = Env::default();
    
    // Test valid request
    let valid_request = CreateSwapRequest {
        source_asset: Symbol::new(&env, "XLM"),
        destination_asset: Symbol::new(&env, "USDC"),
        condition_type: SwapConditionType::PercentageIncrease(10),
        amount_to_swap: 100_0000000,
        max_slippage: 500,
        expires_at: env.ledger().timestamp() + 3600,
        max_executions: 1,
    };
    
    assert!(valid_request.validate(&env).is_ok());
    
    // Test invalid slippage
    let mut invalid_request = valid_request.clone();
    invalid_request.max_slippage = 6000; // Too high
    
    assert!(invalid_request.validate(&env).is_err());
    
    // Test same assets
    let mut invalid_request = valid_request.clone();
    invalid_request.destination_asset = invalid_request.source_asset.clone();
    
    assert!(invalid_request.validate(&env).is_err());
}