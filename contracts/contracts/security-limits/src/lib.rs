#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec, Bytes};

mod user_limits;
mod alert_rules;
mod security;

use user_limits::{UserLimits, TransactionAttempt, store_user_limits, load_user_limits, store_transaction_attempt};
use alert_rules::{AlertRule, Alert, AlertType, store_alert_rule, load_alert_rule, store_alert, get_user_alerts, get_unresolved_alerts};
use security::{SecurityStatus, SecurityMetrics, detect_suspicious_activity, get_security_status, is_address_whitelisted, is_address_blacklisted, add_to_whitelist, add_to_blacklist, remove_from_whitelist, remove_from_blacklist, is_emergency_stop_active, activate_emergency_stop, deactivate_emergency_stop, reset_user_risk_score};

#[contract]
pub struct SecurityContract;

#[contractimpl]
impl SecurityContract {
    /// Initialize user limits with custom daily and monthly limits
    pub fn set_user_limits(
        env: Env,
        user: Address,
        daily_limit: i128,
        monthly_limit: i128,
    ) -> bool {
        user.require_auth();
        
        if is_emergency_stop_active(&env) {
            return false;
        }
        
        // Validate input: limits must be positive
        if daily_limit <= 0 || monthly_limit <= 0 {
            return false;
        }
        
        // Validate input: monthly limit should be >= daily limit
        if monthly_limit < daily_limit {
            return false;
        }
        
        let current_time = env.ledger().timestamp();
        let limits = UserLimits::new(daily_limit, monthly_limit, current_time);
        store_user_limits(&env, &user, &limits);
        true
    }

    /// Get user's current limits and spending
    pub fn get_user_limits(env: Env, user: Address) -> Option<UserLimits> {
        load_user_limits(&env, &user)
    }

    /// Verify if a transaction is within limits and not suspicious
    pub fn verify_transaction(
        env: Env,
        user: Address,
        recipient: Address,
        amount: i128,
        transaction_hash: Bytes,
    ) -> bool {
        user.require_auth();
        
        if is_emergency_stop_active(&env) {
            return false;
        }
        
        // Validate input: amount must be positive
        if amount <= 0 {
            return false;
        }
        
        // Check if recipient is blacklisted
        if is_address_blacklisted(&env, &recipient) {
            return false;
        }
        
        let current_time = env.ledger().timestamp();
        
        // Load and update user limits
        let mut limits = load_user_limits(&env, &user).unwrap_or_default();
        limits.reset_daily_if_needed(current_time);
        limits.reset_monthly_if_needed(current_time);
        
        // Check if transaction is within limits
        if !limits.can_spend(amount) {
            return false;
        }
        
        // Check security status
        let security_status = get_security_status(&env, &user);
        if matches!(security_status, SecurityStatus::Blocked) {
            return false;
        }
        
        // Detect suspicious activity and generate alerts
        let alerts = detect_suspicious_activity(&env, &user, &recipient, amount, current_time);
        for alert in alerts.iter() {
            store_alert(&env, &alert);
        }
        
        // If too many suspicious alerts, block transaction
        if alerts.len() > 2 {
            return false;
        }
        
        // Update spending limits
        limits.add_spending(amount);
        store_user_limits(&env, &user, &limits);
        
        // Store transaction attempt for audit trail
        let attempt = TransactionAttempt {
            user: user.clone(),
            amount,
            timestamp: current_time,
            transaction_hash,
        };
        store_transaction_attempt(&env, &attempt);
        
        true
    }

    /// Add an address to whitelist
    pub fn add_to_whitelist(env: Env, admin: Address, address: Address) -> bool {
        admin.require_auth();
        
        if is_emergency_stop_active(&env) {
            return false;
        }
        
        add_to_whitelist(&env, &address);
        true
    }

    /// Add an address to blacklist
    pub fn add_to_blacklist(env: Env, admin: Address, address: Address) -> bool {
        admin.require_auth();
        
        if is_emergency_stop_active(&env) {
            return false;
        }
        
        add_to_blacklist(&env, &address);
        true
    }

    /// Remove an address from whitelist
    pub fn remove_from_whitelist(env: Env, admin: Address, address: Address) -> bool {
        admin.require_auth();
        remove_from_whitelist(&env, &address);
        true
    }

    /// Remove an address from blacklist
    pub fn remove_from_blacklist(env: Env, admin: Address, address: Address) -> bool {
        admin.require_auth();
        remove_from_blacklist(&env, &address);
        true
    }

    /// Check if address is whitelisted
    pub fn is_whitelisted(env: Env, address: Address) -> bool {
        is_address_whitelisted(&env, &address)
    }

    /// Check if address is blacklisted
    pub fn is_blacklisted(env: Env, address: Address) -> bool {
        is_address_blacklisted(&env, &address)
    }

    /// Create a custom alert rule
    pub fn create_alert_rule(
        env: Env,
        admin: Address,
        rule_id: u64,
        alert_type: AlertType,
        threshold_amount: Option<i128>,
        time_window_seconds: Option<u64>,
        max_transactions: Option<u32>,
        description: String,
    ) -> bool {
        admin.require_auth();
        
        // Validate input: threshold_amount must be positive if provided
        if let Some(threshold) = threshold_amount {
            if threshold <= 0 {
                return false;
            }
        }
        
        // Validate input: time_window_seconds must be positive if provided
        if let Some(time_window) = time_window_seconds {
            if time_window == 0 {
                return false;
            }
        }
        
        // Validate input: max_transactions must be positive if provided
        if let Some(max_tx) = max_transactions {
            if max_tx == 0 {
                return false;
            }
        }
        
        let rule = AlertRule {
            rule_id,
            alert_type,
            is_enabled: true,
            threshold_amount,
            time_window_seconds,
            max_transactions,
            description,
        };
        
        store_alert_rule(&env, &rule);
        true
    }

    /// Get user's alerts
    pub fn get_alerts(env: Env, user: Address, limit: u32) -> Vec<Alert> {
        get_user_alerts(&env, &user, limit)
    }

    /// Get user's unresolved alerts
    pub fn get_unresolved_alerts(env: Env, user: Address) -> Vec<Alert> {
        get_unresolved_alerts(&env, &user)
    }

    /// Resolve an alert
    pub fn resolve_alert(env: Env, user: Address, alert_id: u64) -> bool {
        user.require_auth();
        
        if let Some(mut alert) = crate::alert_rules::load_alert(&env, &user, alert_id) {
            alert.resolve();
            store_alert(&env, &alert);
            true
        } else {
            false
        }
    }

    /// Get user's security status
    pub fn get_security_status(env: Env, user: Address) -> SecurityStatus {
        get_security_status(&env, &user)
    }

    /// Reset user's risk score (admin function)
    pub fn reset_risk_score(env: Env, admin: Address, user: Address) -> bool {
        admin.require_auth();
        reset_user_risk_score(&env, &user);
        true
    }

    /// Get remaining daily limit for user
    pub fn get_remaining_daily_limit(env: Env, user: Address) -> i128 {
        if let Some(limits) = load_user_limits(&env, &user) {
            limits.get_remaining_daily()
        } else {
            0
        }
    }

    /// Get remaining monthly limit for user
    pub fn get_remaining_monthly_limit(env: Env, user: Address) -> i128 {
        if let Some(limits) = load_user_limits(&env, &user) {
            limits.get_remaining_monthly()
        } else {
            0
        }
    }

    /// Emergency stop - blocks all transactions (admin only)
    pub fn emergency_stop(env: Env, admin: Address) -> bool {
        admin.require_auth();
        activate_emergency_stop(&env);
        true
    }

    /// Resume operations after emergency stop (admin only)
    pub fn resume_operations(env: Env, admin: Address) -> bool {
        admin.require_auth();
        deactivate_emergency_stop(&env);
        true
    }

    /// Check if emergency stop is active
    pub fn is_emergency_stop_active(env: Env) -> bool {
        is_emergency_stop_active(&env)
    }

    /// Update user limits (user can update their own limits)
    pub fn update_user_limits(
        env: Env,
        user: Address,
        daily_limit: i128,
        monthly_limit: i128,
    ) -> bool {
        user.require_auth();
        
        if is_emergency_stop_active(&env) {
            return false;
        }
        
        // Validate input: limits must be positive
        if daily_limit <= 0 || monthly_limit <= 0 {
            return false;
        }
        
        // Validate input: monthly limit should be >= daily limit
        if monthly_limit < daily_limit {
            return false;
        }
        
        if let Some(mut limits) = load_user_limits(&env, &user) {
            let current_time = env.ledger().timestamp();
            limits.reset_daily_if_needed(current_time);
            limits.reset_monthly_if_needed(current_time);
            
            limits.daily_limit = daily_limit;
            limits.monthly_limit = monthly_limit;
            
            store_user_limits(&env, &user, &limits);
            true
        } else {
            Self::set_user_limits(env, user, daily_limit, monthly_limit)
        }
    }

    /// Disable user limits (admin function for trusted users)
    pub fn disable_user_limits(env: Env, admin: Address, user: Address) -> bool {
        admin.require_auth();
        
        if let Some(mut limits) = load_user_limits(&env, &user) {
            limits.is_active = false;
            store_user_limits(&env, &user, &limits);
            true
        } else {
            false
        }
    }

    /// Enable user limits (admin function)
    pub fn enable_user_limits(env: Env, admin: Address, user: Address) -> bool {
        admin.require_auth();
        
        if let Some(mut limits) = load_user_limits(&env, &user) {
            limits.is_active = true;
            store_user_limits(&env, &user, &limits);
            true
        } else {
            false
        }
    }
}

mod test;
