use soroban_sdk::{contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SwapConditionType {
    PercentageIncrease(u32), // Percentage increase (e.g., 10 = 10%)
    PercentageDecrease(u32), // Percentage decrease (e.g., 15 = 15%)
    TargetPrice(u64),        // Specific target price in stroops
    PriceAbove(u64),         // Execute when price goes above this value
    PriceBelow(u64),         // Execute when price goes below this value
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SwapStatus {
    Active,
    Executed,
    Cancelled,
    Failed,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapCondition {
    pub id: u64,
    pub owner: Address,
    pub source_asset: Symbol,
    pub destination_asset: Symbol,
    pub condition_type: SwapConditionType,
    pub amount_to_swap: u64,
    pub min_amount_out: u64, // Slippage protection
    pub max_slippage: u32,   // Maximum allowed slippage in basis points (100 = 1%)
    pub reference_price: u64, // Reference price when condition was created
    pub created_at: u64,
    pub expires_at: u64,
    pub status: SwapStatus,
    pub last_check: u64,
    pub execution_count: u32, // For recurring swaps
    pub max_executions: u32,  // 0 means unlimited
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapExecution {
    pub condition_id: u64,
    pub executed_at: u64,
    pub execution_price: u64,
    pub amount_in: u64,
    pub amount_out: u64,
    pub actual_slippage: u32, // In basis points
    pub gas_used: u64,
    pub tx_hash: Symbol, // Transaction hash as Symbol
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreateSwapRequest {
    pub source_asset: Symbol,
    pub destination_asset: Symbol,
    pub condition_type: SwapConditionType,
    pub amount_to_swap: u64,
    pub max_slippage: u32,
    pub expires_at: u64,
    pub max_executions: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapValidationError {
    pub error_code: u32,
    pub message: Symbol,
}

// Constants for swap validation
pub const MAX_SLIPPAGE_BASIS_POINTS: u32 = 5000; // 50% maximum slippage
pub const MIN_SLIPPAGE_BASIS_POINTS: u32 = 1;    // 0.01% minimum slippage
pub const MAX_SWAP_AMOUNT: u64 = 1_000_000_0000000; // 1M XLM equivalent
pub const MIN_SWAP_AMOUNT: u64 = 1_0000000;         // 1 XLM minimum
pub const MAX_CONDITION_LIFETIME: u64 = 86400 * 365; // 1 year maximum
pub const MIN_CONDITION_LIFETIME: u64 = 60;          // 1 minute minimum
pub const MAX_PERCENTAGE_CHANGE: u32 = 10000;        // 100% maximum change
pub const MIN_PERCENTAGE_CHANGE: u32 = 1;            // 0.01% minimum change

impl SwapCondition {
    pub fn new(
        env: &Env,
        id: u64,
        owner: Address,
        request: CreateSwapRequest,
        reference_price: u64,
    ) -> Self {
        let current_time = env.ledger().timestamp();
        
        Self {
            id,
            owner,
            source_asset: request.source_asset,
            destination_asset: request.destination_asset,
            condition_type: request.condition_type,
            amount_to_swap: request.amount_to_swap,
            min_amount_out: Self::calculate_min_amount_out(
                request.amount_to_swap,
                reference_price,
                request.max_slippage,
            ),
            max_slippage: request.max_slippage,
            reference_price,
            created_at: current_time,
            expires_at: request.expires_at,
            status: SwapStatus::Active,
            last_check: current_time,
            execution_count: 0,
            max_executions: request.max_executions,
        }
    }

    pub fn is_valid(&self, env: &Env) -> Result<(), SwapValidationError> {
        let current_time = env.ledger().timestamp();

        // Check if expired
        if current_time > self.expires_at {
            return Err(SwapValidationError {
                error_code: 1001,
                message: Symbol::new(env, "condition_expired"),
            });
        }

        // Check if already executed (for single execution swaps)
        if self.max_executions == 1 && self.execution_count >= 1 {
            return Err(SwapValidationError {
                error_code: 1002,
                message: Symbol::new(env, "already_executed"),
            });
        }

        // Check execution limit
        if self.max_executions > 0 && self.execution_count >= self.max_executions {
            return Err(SwapValidationError {
                error_code: 1003,
                message: Symbol::new(env, "execution_limit_reached"),
            });
        }

        // Check if cancelled or failed
        match self.status {
            SwapStatus::Cancelled => Err(SwapValidationError {
                error_code: 1004,
                message: Symbol::new(env, "condition_cancelled"),
            }),
            SwapStatus::Failed => Err(SwapValidationError {
                error_code: 1005,
                message: Symbol::new(env, "condition_failed"),
            }),
            SwapStatus::Expired => Err(SwapValidationError {
                error_code: 1006,
                message: Symbol::new(env, "condition_expired"),
            }),
            _ => Ok(()),
        }
    }

    pub fn should_execute(&self, current_price: u64) -> bool {
        match &self.condition_type {
            SwapConditionType::PercentageIncrease(percentage) => {
                let increase_required = (self.reference_price * (*percentage as u64)) / 100;
                current_price >= self.reference_price + increase_required
            }
            SwapConditionType::PercentageDecrease(percentage) => {
                let decrease_required = (self.reference_price * (*percentage as u64)) / 100;
                current_price <= self.reference_price.saturating_sub(decrease_required)
            }
            SwapConditionType::TargetPrice(target) => {
                // Allow small tolerance around target price (0.1%)
                let tolerance = target / 1000;
                current_price >= target.saturating_sub(tolerance)
                    && current_price <= target + tolerance
            }
            SwapConditionType::PriceAbove(threshold) => current_price > *threshold,
            SwapConditionType::PriceBelow(threshold) => current_price < *threshold,
        }
    }

    pub fn calculate_expected_output(&self, current_price: u64) -> u64 {
        // Simplified calculation - in production, this would query the DEX
        // This assumes 1:1 price ratio for demonstration
        let base_output = (self.amount_to_swap * current_price) / self.reference_price;
        
        // Apply slippage protection
        let slippage_factor = 10000 - self.max_slippage; // basis points
        (base_output * slippage_factor as u64) / 10000
    }

    pub fn update_execution(&mut self, env: &Env, execution: &SwapExecution) {
        self.execution_count += 1;
        self.last_check = env.ledger().timestamp();
        
        if self.max_executions > 0 && self.execution_count >= self.max_executions {
            self.status = SwapStatus::Executed;
        }
    }

    pub fn cancel(&mut self) {
        self.status = SwapStatus::Cancelled;
    }

    pub fn mark_as_failed(&mut self) {
        self.status = SwapStatus::Failed;
    }

    pub fn mark_as_expired(&mut self, env: &Env) {
        if env.ledger().timestamp() > self.expires_at {
            self.status = SwapStatus::Expired;
        }
    }

    fn calculate_min_amount_out(
        amount_in: u64,
        reference_price: u64,
        max_slippage: u32,
    ) -> u64 {
        let base_amount_out = (amount_in * reference_price) / reference_price; // Simplified
        let slippage_factor = 10000 - max_slippage; // basis points
        (base_amount_out * slippage_factor as u64) / 10000
    }
}

impl CreateSwapRequest {
    pub fn validate(&self, env: &Env) -> Result<(), SwapValidationError> {
        let current_time = env.ledger().timestamp();

        // Validate swap amount
        if self.amount_to_swap < MIN_SWAP_AMOUNT {
            return Err(SwapValidationError {
                error_code: 2001,
                message: Symbol::new(env, "amount_too_small"),
            });
        }

        if self.amount_to_swap > MAX_SWAP_AMOUNT {
            return Err(SwapValidationError {
                error_code: 2002,
                message: Symbol::new(env, "amount_too_large"),
            });
        }

        // Validate slippage
        if self.max_slippage < MIN_SLIPPAGE_BASIS_POINTS {
            return Err(SwapValidationError {
                error_code: 2003,
                message: Symbol::new(env, "slippage_too_low"),
            });
        }

        if self.max_slippage > MAX_SLIPPAGE_BASIS_POINTS {
            return Err(SwapValidationError {
                error_code: 2004,
                message: Symbol::new(env, "slippage_too_high"),
            });
        }

        // Validate expiration time
        let lifetime = self.expires_at.saturating_sub(current_time);
        if lifetime < MIN_CONDITION_LIFETIME {
            return Err(SwapValidationError {
                error_code: 2005,
                message: Symbol::new(env, "lifetime_too_short"),
            });
        }

        if lifetime > MAX_CONDITION_LIFETIME {
            return Err(SwapValidationError {
                error_code: 2006,
                message: Symbol::new(env, "lifetime_too_long"),
            });
        }

        // Validate assets are different
        if self.source_asset == self.destination_asset {
            return Err(SwapValidationError {
                error_code: 2007,
                message: Symbol::new(env, "same_assets"),
            });
        }

        // Validate condition type
        self.validate_condition_type(env)?;

        Ok(())
    }

    fn validate_condition_type(&self, env: &Env) -> Result<(), SwapValidationError> {
        match &self.condition_type {
            SwapConditionType::PercentageIncrease(percentage) => {
                if *percentage < MIN_PERCENTAGE_CHANGE || *percentage > MAX_PERCENTAGE_CHANGE {
                    return Err(SwapValidationError {
                        error_code: 2101,
                        message: Symbol::new(env, "invalid_percentage"),
                    });
                }
            }
            SwapConditionType::PercentageDecrease(percentage) => {
                if *percentage < MIN_PERCENTAGE_CHANGE || *percentage > MAX_PERCENTAGE_CHANGE {
                    return Err(SwapValidationError {
                        error_code: 2102,
                        message: Symbol::new(env, "invalid_percentage"),
                    });
                }
            }
            SwapConditionType::TargetPrice(price) => {
                if *price == 0 {
                    return Err(SwapValidationError {
                        error_code: 2103,
                        message: Symbol::new(env, "invalid_target_price"),
                    });
                }
            }
            SwapConditionType::PriceAbove(threshold) => {
                if *threshold == 0 {
                    return Err(SwapValidationError {
                        error_code: 2104,
                        message: Symbol::new(env, "invalid_price_threshold"),
                    });
                }
            }
            SwapConditionType::PriceBelow(threshold) => {
                if *threshold == 0 {
                    return Err(SwapValidationError {
                        error_code: 2105,
                        message: Symbol::new(env, "invalid_price_threshold"),
                    });
                }
            }
        }

        Ok(())
    }
}

impl SwapExecution {
    pub fn new(
        env: &Env,
        condition_id: u64,
        execution_price: u64,
        amount_in: u64,
        amount_out: u64,
        gas_used: u64,
        tx_hash: Symbol,
    ) -> Self {
        let actual_slippage = if amount_in > 0 {
            let expected_out = amount_in; // Simplified - should use actual DEX calculation
            if amount_out < expected_out {
                let slippage = ((expected_out - amount_out) * 10000) / expected_out;
                slippage as u32
            } else {
                0
            }
        } else {
            0
        };

        Self {
            condition_id,
            executed_at: env.ledger().timestamp(),
            execution_price,
            amount_in,
            amount_out,
            actual_slippage,
            gas_used,
            tx_hash,
        }
    }

    pub fn was_successful(&self) -> bool {
        self.amount_out > 0 && self.actual_slippage <= MAX_SLIPPAGE_BASIS_POINTS
    }
}

// Utility functions for swap condition management
pub struct SwapConditionManager;

impl SwapConditionManager {
    pub fn generate_condition_id(env: &Env, owner: &Address) -> u64 {
        let current_time = env.ledger().timestamp();
        let owner_hash = owner.to_string().len() as u64; // Simplified hash
        (current_time << 32) | owner_hash
    }

    pub fn calculate_slippage(expected_amount: u64, actual_amount: u64) -> u32 {
        if expected_amount == 0 {
            return 0;
        }

        if actual_amount >= expected_amount {
            return 0; // No slippage, better than expected
        }

        let difference = expected_amount - actual_amount;
        ((difference * 10000) / expected_amount) as u32
    }

    pub fn is_slippage_acceptable(actual_slippage: u32, max_slippage: u32) -> bool {
        actual_slippage <= max_slippage
    }
}