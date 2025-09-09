#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Map, Symbol, Vec, log,
};

mod swap_condition;
mod price_oracle;
mod dex_integration;

pub use swap_condition::*;
pub use price_oracle::*;
pub use dex_integration::*;

#[contracttype]
pub enum DataKey {
    SwapConditions,                    // Map<u64, SwapCondition>
    UserConditions(Address),           // Address -> Vec<u64> (condition IDs)
    SwapExecutions,                    // Map<u64, Vec<SwapExecution>>
    NextConditionId,                   // u64
    OracleConfig,                      // OracleConfig
    DexConfig,                         // DexConfig
    Admin,                             // Address
    PausedStatus,                      // bool
    SupportedAssets,                   // Vec<Symbol>
    GlobalStats,                       // GlobalStats
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractConfig {
    pub admin: Address,
    pub oracle_config: OracleConfig,
    pub dex_config: DexConfig,
    pub paused: bool,
    pub max_conditions_per_user: u32,
    pub min_condition_value: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GlobalStats {
    pub total_conditions_created: u64,
    pub total_conditions_executed: u64,
    pub total_volume_swapped: u64,
    pub total_fees_collected: u64,
    pub active_conditions_count: u64,
}

#[contract]
pub struct SmartSwap;

#[contractimpl]
impl SmartSwap {
    pub fn initialize(
        env: Env,
        admin: Address,
        oracle_address: Address,
        dex_address: Address,
    ) -> Result<(), Symbol> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Symbol::new(&env, "already_initialized"));
        }

        let oracle_config = OracleConfigManager::create_default_config(&env, oracle_address);
        let dex_config = DexConfigManager::create_default_config(&env, dex_address);

        let config = ContractConfig {
            admin: admin.clone(),
            oracle_config,
            dex_config,
            paused: false,
            max_conditions_per_user: 50,
            min_condition_value: 10_0000000, // 10 XLM minimum
        };

        env.storage().instance().set(&DataKey::Admin, &config);
        env.storage().instance().set(&DataKey::SwapConditions, &Map::<u64, SwapCondition>::new(&env));
        env.storage().instance().set(&DataKey::SwapExecutions, &Map::<u64, Vec<SwapExecution>>::new(&env));
        env.storage().instance().set(&DataKey::NextConditionId, &1u64);
        env.storage().instance().set(&DataKey::SupportedAssets, &Vec::<Symbol>::new(&env));
        env.storage().instance().set(&DataKey::GlobalStats, &GlobalStats {
            total_conditions_created: 0,
            total_conditions_executed: 0,
            total_volume_swapped: 0,
            total_fees_collected: 0,
            active_conditions_count: 0,
        });

        log!(&env, "Smart Swap contract initialized with admin: {}", admin);
        Ok(())
    }

    pub fn create_swap_condition(
        env: Env,
        caller: Address,
        request: CreateSwapRequest,
    ) -> Result<u64, Symbol> {
        caller.require_auth();
        Self::check_not_paused(&env)?;

        // Validate the request
        request.validate(&env)?;

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        // Check user condition limit
        Self::check_user_condition_limit(&env, &caller, config.max_conditions_per_user)?;

        // Validate minimum value
        if request.amount_to_swap < config.min_condition_value {
            return Err(Symbol::new(&env, "amount_below_minimum"));
        }

        // Get current price from oracle
        let price_result = PriceOracleClient::get_price(
            &env,
            &config.oracle_config,
            request.source_asset.clone(),
        );

        if !price_result.success {
            return Err(price_result.error_message.unwrap_or(Symbol::new(&env, "price_unavailable")));
        }

        let current_price = price_result.price_data.ok_or_else(|| Symbol::new(&env, "no_price_data"))?;

        // Validate price data for swap
        PriceOracleClient::validate_price_for_swap(&env, &current_price, &config.oracle_config)?;

        // Check DEX liquidity
        let has_liquidity = StellarDexIntegration::check_liquidity(
            &env,
            &config.dex_config,
            request.source_asset.clone(),
            request.destination_asset.clone(),
            request.amount_to_swap,
        )?;

        if !has_liquidity {
            return Err(Symbol::new(&env, "insufficient_liquidity"));
        }

        // Generate condition ID and create condition
        let condition_id = Self::get_next_condition_id(&env);
        let swap_condition = SwapCondition::new(
            &env,
            condition_id,
            caller.clone(),
            request,
            current_price.price,
        );

        // Store the condition
        let mut conditions: Map<u64, SwapCondition> = env
            .storage()
            .instance()
            .get(&DataKey::SwapConditions)
            .unwrap_or_else(|| Map::new(&env));

        conditions.set(condition_id, swap_condition);
        env.storage().instance().set(&DataKey::SwapConditions, &conditions);

        // Update user conditions
        Self::add_user_condition(&env, &caller, condition_id);

        // Update global stats
        Self::update_global_stats(&env, |stats| {
            stats.total_conditions_created += 1;
            stats.active_conditions_count += 1;
        });

        log!(&env, "Swap condition created: {} for user: {}", condition_id, caller);
        Ok(condition_id)
    }

    pub fn check_and_execute_condition(
        env: Env,
        condition_id: u64,
    ) -> Result<Option<SwapExecution>, Symbol> {
        Self::check_not_paused(&env)?;

        let mut conditions: Map<u64, SwapCondition> = env
            .storage()
            .instance()
            .get(&DataKey::SwapConditions)
            .ok_or_else(|| Symbol::new(&env, "no_conditions"))?;

        let mut condition = conditions.get(&condition_id)
            .ok_or_else(|| Symbol::new(&env, "condition_not_found"))?;

        // Validate condition is still active
        condition.is_valid(&env)?;

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        // Get current price
        let price_result = PriceOracleClient::get_price(
            &env,
            &config.oracle_config,
            condition.source_asset.clone(),
        );

        if !price_result.success {
            return Err(price_result.error_message.unwrap_or(Symbol::new(&env, "price_unavailable")));
        }

        let current_price = price_result.price_data.ok_or_else(|| Symbol::new(&env, "no_price_data"))?;

        // Check if condition should be executed
        if !condition.should_execute(current_price.price) {
            // Update last check time
            condition.last_check = env.ledger().timestamp();
            conditions.set(condition_id, condition);
            env.storage().instance().set(&DataKey::SwapConditions, &conditions);
            return Ok(None);
        }

        // Execute the swap
        let execution_result = Self::execute_swap(&env, &config, &condition, &current_price)?;

        if execution_result.success {
            // Update condition with execution info
            condition.update_execution(&env, &execution_result);
            
            // Store execution record
            Self::store_execution_record(&env, condition_id, execution_result.clone());

            // Update global stats
            Self::update_global_stats(&env, |stats| {
                stats.total_conditions_executed += 1;
                stats.total_volume_swapped += execution_result.amount_in;
                if condition.status == SwapStatus::Executed {
                    stats.active_conditions_count = stats.active_conditions_count.saturating_sub(1);
                }
            });

            log!(&env, "Condition {} executed successfully", condition_id);
        } else {
            condition.mark_as_failed();
            log!(&env, "Condition {} execution failed: {:?}", condition_id, execution_result.error_message);
        }

        // Update condition status
        conditions.set(condition_id, condition);
        env.storage().instance().set(&DataKey::SwapConditions, &conditions);

        Ok(Some(execution_result))
    }

    pub fn cancel_condition(
        env: Env,
        caller: Address,
        condition_id: u64,
    ) -> Result<(), Symbol> {
        caller.require_auth();

        let mut conditions: Map<u64, SwapCondition> = env
            .storage()
            .instance()
            .get(&DataKey::SwapConditions)
            .ok_or_else(|| Symbol::new(&env, "no_conditions"))?;

        let mut condition = conditions.get(&condition_id)
            .ok_or_else(|| Symbol::new(&env, "condition_not_found"))?;

        // Check ownership
        if condition.owner != caller {
            return Err(Symbol::new(&env, "not_owner"));
        }

        // Check if condition can be cancelled
        match condition.status {
            SwapStatus::Active => {
                condition.cancel();
                conditions.set(condition_id, condition);
                env.storage().instance().set(&DataKey::SwapConditions, &conditions);

                // Update global stats
                Self::update_global_stats(&env, |stats| {
                    stats.active_conditions_count = stats.active_conditions_count.saturating_sub(1);
                });

                log!(&env, "Condition {} cancelled by user", condition_id);
                Ok(())
            }
            _ => Err(Symbol::new(&env, "cannot_cancel")),
        }
    }

    pub fn get_condition(env: Env, condition_id: u64) -> Option<SwapCondition> {
        let conditions: Map<u64, SwapCondition> = env
            .storage()
            .instance()
            .get(&DataKey::SwapConditions)
            .unwrap_or_else(|| Map::new(&env));

        conditions.get(&condition_id)
    }

    pub fn get_user_conditions(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::UserConditions(user))
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_condition_executions(env: Env, condition_id: u64) -> Vec<SwapExecution> {
        let executions: Map<u64, Vec<SwapExecution>> = env
            .storage()
            .instance()
            .get(&DataKey::SwapExecutions)
            .unwrap_or_else(|| Map::new(&env));

        executions.get(&condition_id).unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_swap_quote(
        env: Env,
        token_in: Symbol,
        token_out: Symbol,
        amount_in: u64,
    ) -> Result<SwapQuote, Symbol> {
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        StellarDexIntegration::get_swap_quote(&env, &config.dex_config, token_in, token_out, amount_in)
    }

    pub fn add_supported_asset(
        env: Env,
        caller: Address,
        asset_symbol: Symbol,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        let mut supported_assets: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::SupportedAssets)
            .unwrap_or_else(|| Vec::new(&env));

        if !supported_assets.iter().any(|asset| asset == asset_symbol) {
            supported_assets.push_back(asset_symbol.clone());
            env.storage().instance().set(&DataKey::SupportedAssets, &supported_assets);
        }

        log!(&env, "Asset added to supported list: {}", asset_symbol);
        Ok(())
    }

    pub fn set_pause_status(
        env: Env,
        caller: Address,
        paused: bool,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        config.paused = paused;
        env.storage().instance().set(&DataKey::Admin, &config);

        log!(&env, "Contract pause status set to: {}", paused);
        Ok(())
    }

    pub fn update_oracle_config(
        env: Env,
        caller: Address,
        new_oracle_config: OracleConfig,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        // Validate new config
        OracleConfigManager::validate_config(&env, &new_oracle_config)?;

        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        config.oracle_config = new_oracle_config;
        env.storage().instance().set(&DataKey::Admin, &config);

        log!(&env, "Oracle configuration updated");
        Ok(())
    }

    pub fn update_dex_config(
        env: Env,
        caller: Address,
        new_dex_config: DexConfig,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        // Validate new config
        DexConfigManager::validate_config(&env, &new_dex_config)?;

        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        config.dex_config = new_dex_config;
        env.storage().instance().set(&DataKey::Admin, &config);

        log!(&env, "DEX configuration updated");
        Ok(())
    }

    pub fn get_global_stats(env: Env) -> GlobalStats {
        env.storage()
            .instance()
            .get(&DataKey::GlobalStats)
            .unwrap_or(GlobalStats {
                total_conditions_created: 0,
                total_conditions_executed: 0,
                total_volume_swapped: 0,
                total_fees_collected: 0,
                active_conditions_count: 0,
            })
    }

    pub fn cleanup_expired_conditions(env: Env, limit: u32) -> u32 {
        let mut conditions: Map<u64, SwapCondition> = env
            .storage()
            .instance()
            .get(&DataKey::SwapConditions)
            .unwrap_or_else(|| Map::new(&env));

        let mut cleaned_count = 0u32;
        let current_time = env.ledger().timestamp();

        // Iterate through conditions and mark expired ones
        for (condition_id, mut condition) in conditions.iter() {
            if cleaned_count >= limit {
                break;
            }

            if current_time > condition.expires_at && condition.status == SwapStatus::Active {
                condition.mark_as_expired(&env);
                conditions.set(condition_id, condition);
                cleaned_count += 1;
            }
        }

        if cleaned_count > 0 {
            env.storage().instance().set(&DataKey::SwapConditions, &conditions);
            
            // Update global stats
            Self::update_global_stats(&env, |stats| {
                stats.active_conditions_count = stats.active_conditions_count.saturating_sub(cleaned_count as u64);
            });

            log!(&env, "Cleaned up {} expired conditions", cleaned_count);
        }

        cleaned_count
    }

    // Internal helper methods
    fn execute_swap(
        env: &Env,
        config: &ContractConfig,
        condition: &SwapCondition,
        current_price: &PriceData,
    ) -> Result<SwapExecution, Symbol> {
        // Create swap parameters
        let swap_params = SwapParams {
            token_in: condition.source_asset.clone(),
            token_out: condition.destination_asset.clone(),
            amount_in: condition.amount_to_swap,
            amount_out_min: condition.min_amount_out,
            to: condition.owner.clone(),
            deadline: env.ledger().timestamp() + 300, // 5 minutes deadline
        };

        // Execute swap through DEX integration
        let swap_result = StellarDexIntegration::execute_swap(env, &config.dex_config, swap_params);

        // Create execution record
        let execution = SwapExecution::new(
            env,
            condition.id,
            current_price.price,
            swap_result.amount_in,
            swap_result.amount_out,
            swap_result.gas_used,
            swap_result.transaction_hash.clone(),
        );

        if !swap_result.success {
            return Err(swap_result.error_message.unwrap_or(Symbol::new(env, "swap_failed")));
        }

        Ok(execution)
    }

    fn get_next_condition_id(env: &Env) -> u64 {
        let current_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextConditionId)
            .unwrap_or(1);
        
        env.storage().instance().set(&DataKey::NextConditionId, &(current_id + 1));
        current_id
    }

    fn add_user_condition(env: &Env, user: &Address, condition_id: u64) {
        let mut user_conditions: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserConditions(user.clone()))
            .unwrap_or_else(|| Vec::new(env));

        user_conditions.push_back(condition_id);
        env.storage().instance().set(&DataKey::UserConditions(user.clone()), &user_conditions);
    }

    fn check_user_condition_limit(
        env: &Env,
        user: &Address,
        max_conditions: u32,
    ) -> Result<(), Symbol> {
        let user_conditions: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::UserConditions(user.clone()))
            .unwrap_or_else(|| Vec::new(env));

        // Count active conditions
        let conditions: Map<u64, SwapCondition> = env
            .storage()
            .instance()
            .get(&DataKey::SwapConditions)
            .unwrap_or_else(|| Map::new(env));

        let active_count = user_conditions
            .iter()
            .filter(|&condition_id| {
                if let Some(condition) = conditions.get(&condition_id) {
                    condition.status == SwapStatus::Active
                } else {
                    false
                }
            })
            .count();

        if active_count >= max_conditions as usize {
            return Err(Symbol::new(env, "condition_limit_exceeded"));
        }

        Ok(())
    }

    fn store_execution_record(env: &Env, condition_id: u64, execution: SwapExecution) {
        let mut executions: Map<u64, Vec<SwapExecution>> = env
            .storage()
            .instance()
            .get(&DataKey::SwapExecutions)
            .unwrap_or_else(|| Map::new(env));

        let mut condition_executions = executions
            .get(&condition_id)
            .unwrap_or_else(|| Vec::new(env));

        condition_executions.push_back(execution);
        executions.set(condition_id, condition_executions);
        env.storage().instance().set(&DataKey::SwapExecutions, &executions);
    }

    fn update_global_stats<F>(env: &Env, update_fn: F)
    where
        F: FnOnce(&mut GlobalStats),
    {
        let mut stats = Self::get_global_stats(env.clone());
        update_fn(&mut stats);
        env.storage().instance().set(&DataKey::GlobalStats, &stats);
    }

    fn check_admin(env: &Env, caller: &Address) -> Result<(), Symbol> {
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(env, "not_initialized"))?;

        if caller != &config.admin {
            return Err(Symbol::new(env, "unauthorized"));
        }

        Ok(())
    }

    fn check_not_paused(env: &Env) -> Result<(), Symbol> {
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(env, "not_initialized"))?;

        if config.paused {
            return Err(Symbol::new(env, "contract_paused"));
        }

        Ok(())
    }
}