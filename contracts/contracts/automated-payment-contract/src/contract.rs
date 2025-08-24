use crate::error::ContractError;
use crate::events::*;
use crate::payment_schedule;
use crate::payment_schedule::*;
use crate::validation;
use soroban_sdk::{token, Address, Env, Vec};

pub fn create_schedule(
    env: &Env,
    payer: &Address,
    recipient: &Address,
    token: &Address,
    amount: u128,
    frequency: PaymentFrequency,
    start_time: u64,
    end_time: Option<u64>,
) -> Result<u64, ContractError> {
    let current_time = env.ledger().timestamp();

    validation::validate_schedule_params(payer, recipient, amount, start_time, end_time, current_time)?;
    
    let required_funds = validation::calculate_required_funds(&frequency, amount, start_time, end_time);
    validation::validate_funds(env, token, payer, required_funds)?;

    let schedule_id = get_next_schedule_id(env);
    
    let next_payment_time = start_time;

    // Transfer initial funds to contract
    let contract_address = env.current_contract_address();
    let token_client = token::Client::new(env, token);
    token_client.transfer(payer, &contract_address, &(required_funds as i128));

    let schedule = PaymentSchedule {
        id: schedule_id,
        payer: payer.clone(),
        recipient: recipient.clone(),
        token: token.clone(),
        amount,
        frequency: frequency.clone(),
        status: ScheduleStatus::Active,
        balance: required_funds,
        total_paid: 0,
        payment_count: 0,
        failed_attempts: 0,
        start_time,
        end_time,
        next_payment_time,
        created_at: current_time,
        last_payment_at: None,
    };

    set_schedule(env, &schedule);
    add_user_schedule(env, payer, schedule_id);
    add_user_schedule(env, recipient, schedule_id);

    emit_schedule_created(
        env,
        schedule_id,
        payer.clone(),
        recipient.clone(),
        token.clone(),
        amount,
        frequency,
        start_time,
        end_time,
    );

    Ok(schedule_id)
}

pub fn execute_payment(
    env: &Env,
    schedule_id: u64,
) -> Result<(), ContractError> {
    let mut schedule = get_schedule(env, schedule_id)?;
    
    if schedule.status != ScheduleStatus::Active {
        return Err(ContractError::ScheduleNotActive);
    }

    let current_time = env.ledger().timestamp();
    
    if !validation::can_execute_payment(&schedule, current_time) {
        return Err(ContractError::PaymentNotDue);
    }

    // Attempt payment
    let contract_address = env.current_contract_address();
    let token_client = token::Client::new(env, &schedule.token);
    
    match token_client.try_transfer(&contract_address, &schedule.recipient, &(schedule.amount as i128)) {
        Ok(_) => {
            // Payment successful
            schedule.balance = schedule.balance.checked_sub(schedule.amount)
                .ok_or(ContractError::InvalidAmount)?;
            schedule.total_paid = schedule.total_paid.checked_add(schedule.amount)
                .ok_or(ContractError::InvalidAmount)?;
            schedule.payment_count += 1;
            schedule.failed_attempts = 0;
            schedule.last_payment_at = Some(current_time);
            schedule.next_payment_time = calculate_next_payment_time(&schedule.frequency, current_time);

            // Check if schedule should be completed
            if let Some(end_time) = schedule.end_time {
                if schedule.next_payment_time > end_time || schedule.balance < schedule.amount {
                    schedule.status = ScheduleStatus::Completed;
                    
                    // Refund remaining balance
                    if schedule.balance > 0 {
                        token_client.transfer(&contract_address, &schedule.payer, &(schedule.balance as i128));
                        emit_schedule_refunded(env, schedule_id, schedule.payer.clone(), schedule.balance);
                        schedule.balance = 0;
                    }
                }
            } else {
                // For infinite schedules, mark as completed if no balance left
                if schedule.balance < schedule.amount {
                    schedule.status = ScheduleStatus::Completed;
                }
            }

            set_schedule(env, &schedule);
            emit_payment_executed(env, schedule_id, schedule.recipient.clone(), schedule.amount);

            Ok(())
        }
        Err(_) => {
            // Payment failed
            schedule.failed_attempts += 1;
            
            if !validation::should_retry_payment(schedule.failed_attempts) {
                schedule.status = ScheduleStatus::Inactive;
                emit_schedule_deactivated(env, schedule_id, schedule.payer.clone());
            }

            set_schedule(env, &schedule);
            emit_payment_failed(env, schedule_id, schedule.amount, schedule.failed_attempts);

            Err(ContractError::PaymentFailed)
        }
    }
}

pub fn update_schedule_status(
    env: &Env,
    schedule_id: u64,
    payer: &Address,
    active: bool,
) -> Result<(), ContractError> {
    let mut schedule = get_schedule(env, schedule_id)?;

    if schedule.payer != *payer {
        return Err(ContractError::PayerOnly);
    }

    if schedule.status == ScheduleStatus::Cancelled || schedule.status == ScheduleStatus::Completed {
        return Err(ContractError::OperationNotAllowed);
    }

    let new_status = if active {
        ScheduleStatus::Active
    } else {
        ScheduleStatus::Inactive
    };

    if schedule.status == new_status {
        return Ok(());
    }

    schedule.status = new_status;
    set_schedule(env, &schedule);

    if active {
        emit_schedule_activated(env, schedule_id, payer.clone());
    } else {
        emit_schedule_deactivated(env, schedule_id, payer.clone());
    }

    Ok(())
}

pub fn cancel_schedule(
    env: &Env,
    schedule_id: u64,
    payer: &Address,
) -> Result<(), ContractError> {
    let mut schedule = get_schedule(env, schedule_id)?;

    if schedule.payer != *payer {
        return Err(ContractError::PayerOnly);
    }

    if schedule.status == ScheduleStatus::Cancelled {
        return Err(ContractError::ScheduleAlreadyCancelled);
    }

    let refund_amount = schedule.balance;

    // Refund remaining balance
    if refund_amount > 0 {
        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(env, &schedule.token);
        token_client.transfer(&contract_address, payer, &(refund_amount as i128));
    }

    schedule.status = ScheduleStatus::Cancelled;
    schedule.balance = 0;

    set_schedule(env, &schedule);

    emit_schedule_cancelled(env, schedule_id, payer.clone(), refund_amount);

    Ok(())
}

pub fn top_up_schedule(
    env: &Env,
    schedule_id: u64,
    payer: &Address,
    amount: u128,
) -> Result<(), ContractError> {
    let mut schedule = get_schedule(env, schedule_id)?;

    if schedule.payer != *payer {
        return Err(ContractError::PayerOnly);
    }

    if schedule.status != ScheduleStatus::Active && schedule.status != ScheduleStatus::Inactive {
        return Err(ContractError::OperationNotAllowed);
    }

    if amount == 0 {
        return Err(ContractError::InvalidAmount);
    }

    validation::validate_funds(env, &schedule.token, payer, amount)?;

    // Transfer funds to contract
    let contract_address = env.current_contract_address();
    let token_client = token::Client::new(env, &schedule.token);
    token_client.transfer(payer, &contract_address, &(amount as i128));

    schedule.balance = schedule.balance.checked_add(amount)
        .ok_or(ContractError::InvalidAmount)?;

    set_schedule(env, &schedule);

    emit_schedule_topped_up(env, schedule_id, payer.clone(), amount);

    Ok(())
}

pub fn get_schedule(env: &Env, schedule_id: u64) -> Result<PaymentSchedule, ContractError> {
    payment_schedule::get_schedule(env, schedule_id).ok_or(ContractError::ScheduleNotFound)
}

pub fn get_user_schedules(
    env: &Env,
    user: &Address,
    offset: u32,
    limit: u32,
) -> Result<Vec<u64>, ContractError> {
    let all_schedules = payment_schedule::get_user_schedules(env, user);
    let mut result = Vec::new(env);
    
    let start = offset as usize;
    let end = (offset + limit) as usize;
    let schedules_len = all_schedules.len() as usize;
    
    for i in start..end.min(schedules_len) {
        if let Some(schedule_id) = all_schedules.get(i as u32) {
            result.push_back(schedule_id);
        }
    }

    Ok(result)
}