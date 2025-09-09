use soroban_sdk::{contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OracleConfig {
    pub oracle_contract_address: Address,
    pub max_price_age: u64,        // Maximum age of price data in seconds
    pub fallback_enabled: bool,    // Whether to use fallback prices
    pub min_confidence: u32,       // Minimum confidence level required
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    pub asset_symbol: Symbol,
    pub price: u64,
    pub timestamp: u64,
    pub confidence: u32,
    pub source_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceQueryResult {
    pub success: bool,
    pub price_data: Option<PriceData>,
    pub error_message: Option<Symbol>,
}

pub struct PriceOracleClient;

impl PriceOracleClient {
    pub fn new() -> Self {
        Self
    }

    pub fn get_price(
        env: &Env,
        oracle_config: &OracleConfig,
        asset_symbol: Symbol,
    ) -> PriceQueryResult {
        // Try to get current price from oracle
        match Self::query_oracle_price(env, oracle_config, asset_symbol.clone()) {
            Ok(price_data) => {
                // Validate price data quality
                if Self::is_price_data_valid(env, &price_data, oracle_config) {
                    PriceQueryResult {
                        success: true,
                        price_data: Some(price_data),
                        error_message: None,
                    }
                } else {
                    // Try fallback if enabled
                    if oracle_config.fallback_enabled {
                        Self::get_fallback_price(env, oracle_config, asset_symbol)
                    } else {
                        PriceQueryResult {
                            success: false,
                            price_data: None,
                            error_message: Some(Symbol::new(env, "invalid_price_data")),
                        }
                    }
                }
            }
            Err(error) => {
                // Try fallback if enabled
                if oracle_config.fallback_enabled {
                    Self::get_fallback_price(env, oracle_config, asset_symbol)
                } else {
                    PriceQueryResult {
                        success: false,
                        price_data: None,
                        error_message: Some(error),
                    }
                }
            }
        }
    }

    pub fn get_multiple_prices(
        env: &Env,
        oracle_config: &OracleConfig,
        asset_symbols: &[Symbol],
    ) -> Result<soroban_sdk::Vec<PriceData>, Symbol> {
        let mut prices = soroban_sdk::Vec::new(env);

        for asset_symbol in asset_symbols {
            let result = Self::get_price(env, oracle_config, asset_symbol.clone());
            if result.success {
                if let Some(price_data) = result.price_data {
                    prices.push_back(price_data);
                } else {
                    return Err(Symbol::new(env, "missing_price_data"));
                }
            } else {
                return Err(result.error_message.unwrap_or(Symbol::new(env, "price_query_failed")));
            }
        }

        Ok(prices)
    }

    pub fn calculate_exchange_rate(
        env: &Env,
        oracle_config: &OracleConfig,
        from_asset: Symbol,
        to_asset: Symbol,
    ) -> Result<u64, Symbol> {
        let from_price_result = Self::get_price(env, oracle_config, from_asset.clone());
        let to_price_result = Self::get_price(env, oracle_config, to_asset.clone());

        if !from_price_result.success || !to_price_result.success {
            return Err(Symbol::new(env, "failed_to_get_prices"));
        }

        let from_price = from_price_result.price_data.ok_or(Symbol::new(env, "missing_from_price"))?;
        let to_price = to_price_result.price_data.ok_or(Symbol::new(env, "missing_to_price"))?;

        if to_price.price == 0 {
            return Err(Symbol::new(env, "zero_destination_price"));
        }

        // Calculate exchange rate: (from_price / to_price) * scaling_factor
        let exchange_rate = (from_price.price * 1_0000000) / to_price.price; // Scale by 7 decimals
        Ok(exchange_rate)
    }

    pub fn validate_price_for_swap(
        env: &Env,
        price_data: &PriceData,
        oracle_config: &OracleConfig,
    ) -> Result<(), Symbol> {
        // Check price age
        let current_time = env.ledger().timestamp();
        if current_time.saturating_sub(price_data.timestamp) > oracle_config.max_price_age {
            return Err(Symbol::new(env, "price_too_old"));
        }

        // Check confidence level
        if price_data.confidence < oracle_config.min_confidence {
            return Err(Symbol::new(env, "insufficient_confidence"));
        }

        // Check if price is reasonable (not zero)
        if price_data.price == 0 {
            return Err(Symbol::new(env, "zero_price"));
        }

        Ok(())
    }

    // Internal helper methods
    fn query_oracle_price(
        env: &Env,
        oracle_config: &OracleConfig,
        asset_symbol: Symbol,
    ) -> Result<PriceData, Symbol> {
        // This would call the actual price oracle contract
        // For now, we'll simulate the call
        
        // In a real implementation, this would be:
        // let client = PriceOracleContractClient::new(env, &oracle_config.oracle_contract_address);
        // let aggregated_price = client.get_price(&asset_symbol)?;
        
        // Simulate oracle response
        let current_time = env.ledger().timestamp();
        
        // Mock price data for demonstration
        let mock_price = match asset_symbol.to_string().as_str() {
            "XLM" => 120000, // 0.12 USD in microunits
            "USDC" => 1000000, // 1.00 USD
            "BTC" => 45000000000, // 45,000 USD
            "ETH" => 3000000000, // 3,000 USD
            _ => return Err(Symbol::new(env, "unsupported_asset")),
        };

        Ok(PriceData {
            asset_symbol,
            price: mock_price,
            timestamp: current_time,
            confidence: 85, // 85% confidence
            source_count: 5, // 5 oracle sources
        })
    }

    fn get_fallback_price(
        env: &Env,
        oracle_config: &OracleConfig,
        asset_symbol: Symbol,
    ) -> PriceQueryResult {
        // This would call the fallback price function from the oracle contract
        // let client = PriceOracleContractClient::new(env, &oracle_config.oracle_contract_address);
        // let fallback_price = client.get_fallback_price(&asset_symbol);

        // For now, simulate fallback logic
        match Self::query_historical_price(env, asset_symbol.clone()) {
            Ok(price_data) => PriceQueryResult {
                success: true,
                price_data: Some(price_data),
                error_message: None,
            },
            Err(error) => PriceQueryResult {
                success: false,
                price_data: None,
                error_message: Some(error),
            },
        }
    }

    fn query_historical_price(env: &Env, asset_symbol: Symbol) -> Result<PriceData, Symbol> {
        // Simulate historical price lookup
        let current_time = env.ledger().timestamp();
        
        // Use slightly older prices as fallback
        let historical_price = match asset_symbol.to_string().as_str() {
            "XLM" => 118000, // Slightly older XLM price
            "USDC" => 999500, // Slightly older USDC price
            "BTC" => 44500000000, // Slightly older BTC price
            "ETH" => 2980000000, // Slightly older ETH price
            _ => return Err(Symbol::new(env, "no_historical_data")),
        };

        Ok(PriceData {
            asset_symbol,
            price: historical_price,
            timestamp: current_time - 300, // 5 minutes ago
            confidence: 70, // Lower confidence for historical data
            source_count: 3, // Fewer sources for historical data
        })
    }

    fn is_price_data_valid(
        env: &Env,
        price_data: &PriceData,
        oracle_config: &OracleConfig,
    ) -> bool {
        let current_time = env.ledger().timestamp();

        // Check if price is too old
        if current_time.saturating_sub(price_data.timestamp) > oracle_config.max_price_age {
            return false;
        }

        // Check confidence level
        if price_data.confidence < oracle_config.min_confidence {
            return false;
        }

        // Check if price is reasonable
        if price_data.price == 0 {
            return false;
        }

        // Check if we have enough oracle sources
        if price_data.source_count < 2 {
            return false;
        }

        true
    }

    pub fn estimate_swap_output(
        env: &Env,
        oracle_config: &OracleConfig,
        from_asset: Symbol,
        to_asset: Symbol,
        amount_in: u64,
    ) -> Result<u64, Symbol> {
        let exchange_rate = Self::calculate_exchange_rate(env, oracle_config, from_asset, to_asset)?;
        
        if exchange_rate == 0 {
            return Err(Symbol::new(env, "zero_exchange_rate"));
        }

        // Calculate expected output: (amount_in * exchange_rate) / scaling_factor
        let estimated_output = (amount_in * exchange_rate) / 1_0000000;
        Ok(estimated_output)
    }

    pub fn get_price_impact(
        env: &Env,
        oracle_config: &OracleConfig,
        asset_symbol: Symbol,
        swap_amount: u64,
        total_liquidity: u64,
    ) -> Result<u32, Symbol> {
        // Simple price impact calculation
        // In a real implementation, this would be more sophisticated
        
        if total_liquidity == 0 {
            return Err(Symbol::new(env, "zero_liquidity"));
        }

        // Price impact as percentage of swap size vs liquidity
        let impact_basis_points = ((swap_amount * 10000) / total_liquidity) as u32;
        
        // Cap at maximum reasonable impact
        Ok(impact_basis_points.min(5000)) // Max 50% impact
    }

    pub fn is_price_stable(
        env: &Env,
        oracle_config: &OracleConfig,
        asset_symbol: Symbol,
        stability_threshold: u32, // In basis points
    ) -> Result<bool, Symbol> {
        // Get current price
        let current_result = Self::get_price(env, oracle_config, asset_symbol.clone());
        if !current_result.success {
            return Err(Symbol::new(env, "failed_to_get_current_price"));
        }

        let current_price = current_result.price_data.ok_or(Symbol::new(env, "missing_current_price"))?;

        // Get historical price (simulate getting price from 1 hour ago)
        let historical_result = Self::get_fallback_price(env, oracle_config, asset_symbol);
        if !historical_result.success {
            return Err(Symbol::new(env, "failed_to_get_historical_price"));
        }

        let historical_price = historical_result.price_data.ok_or(Symbol::new(env, "missing_historical_price"))?;

        // Calculate price change
        if historical_price.price == 0 {
            return Err(Symbol::new(env, "invalid_historical_price"));
        }

        let price_change = if current_price.price > historical_price.price {
            current_price.price - historical_price.price
        } else {
            historical_price.price - current_price.price
        };

        let change_basis_points = ((price_change * 10000) / historical_price.price) as u32;
        
        Ok(change_basis_points <= stability_threshold)
    }
}

pub struct OracleConfigManager;

impl OracleConfigManager {
    pub fn create_default_config(env: &Env, oracle_address: Address) -> OracleConfig {
        OracleConfig {
            oracle_contract_address: oracle_address,
            max_price_age: 300,        // 5 minutes
            fallback_enabled: true,
            min_confidence: 70,        // 70% minimum confidence
        }
    }

    pub fn validate_config(env: &Env, config: &OracleConfig) -> Result<(), Symbol> {
        // Validate max price age (should be reasonable)
        if config.max_price_age == 0 || config.max_price_age > 3600 {
            return Err(Symbol::new(env, "invalid_max_price_age"));
        }

        // Validate minimum confidence
        if config.min_confidence > 100 {
            return Err(Symbol::new(env, "invalid_min_confidence"));
        }

        Ok(())
    }
}

// Constants for oracle integration
pub const DEFAULT_MAX_PRICE_AGE: u64 = 300;      // 5 minutes
pub const DEFAULT_MIN_CONFIDENCE: u32 = 70;       // 70%
pub const MAX_PRICE_AGE_LIMIT: u64 = 3600;        // 1 hour
pub const MIN_CONFIDENCE_LIMIT: u32 = 50;         // 50%
pub const PRICE_SCALING_FACTOR: u64 = 1_0000000;  // 7 decimal places