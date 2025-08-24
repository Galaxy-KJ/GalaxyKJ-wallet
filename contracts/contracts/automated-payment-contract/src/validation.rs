use crate::error::ContractError;
use crate::payment_schedule::{PaymentFrequency, PaymentSchedule};
use soroban_sdk::{token, Address, Env};

pub fn validate_schedule_params(
    payer: &Address,
    recipient: &Address,
    amount: u128,
    start_time: u64,
    end_time: Option<u64>,
    current_time: u64,
) -> Result<(), ContractError> {
    if amount == 0 {
        return Err(ContractError::InvalidAmount);
    }

    if payer == recipient {
        return Err(ContractError::InvalidInput);
    }

    // Allow start_time to be current_time or future
    if start_time < current_time {
        return Err(ContractError::InvalidStartTime);
    }

    if let Some(end) = end_time {
        if end <= start_time {
            return Err(ContractError::InvalidEndTime);
        }
    }

    Ok(())
}

pub fn validate_funds(
    env: &Env,
    token: &Address,
    payer: &Address,
    required_amount: u128,
) -> Result<(), ContractError> {
    let token_client = token::Client::new(env, token);
    let balance = token_client.balance(payer);
    
    if balance < required_amount as i128 {
        return Err(ContractError::InsufficientBalance);
    }

    Ok(())
}

pub fn calculate_required_funds(
    frequency: &PaymentFrequency,
    amount: u128,
    start_time: u64,
    end_time: Option<u64>,
) -> u128 {
    if let Some(end) = end_time {
        let duration = end.saturating_sub(start_time);
        let payment_intervals = match frequency {
            PaymentFrequency::Daily => duration / 86400,
            PaymentFrequency::Weekly => duration / 604800,
            PaymentFrequency::Monthly => duration / 2592000,
        };
        
        // Add 1 to include the first payment, ensure at least 1 payment
        amount.saturating_mul((payment_intervals as u128).max(1))
    } else {
        // For indefinite schedules, require at least 3 payments upfront
        amount.saturating_mul(3)
    }
}

pub fn can_execute_payment(schedule: &PaymentSchedule, current_time: u64) -> bool {
    if schedule.balance < schedule.amount {
        return false;
    }

    // For immediate execution (start_time == current_time), allow payment
    // For scheduled payments, check if current time >= next_payment_time
    if schedule.payment_count == 0 {
        // First payment - check against start_time
        if current_time < schedule.start_time {
            return false;
        }
    } else {
        // Subsequent payments - check against next_payment_time
        if current_time < schedule.next_payment_time {
            return false;
        }
    }

    if let Some(end_time) = schedule.end_time {
        if current_time > end_time {
            return false;
        }
    }

    true
}

pub fn should_retry_payment(failed_attempts: u32) -> bool {
    failed_attempts < 3
}