#![no_std]

mod error;
mod events;
mod storage;
mod payment_schedule;
mod validation;
mod contract;

mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

pub use error::*;
pub use events::*;
pub use contract::*;

#[contract]
pub struct AutomatedPaymentContract;

#[contractimpl]
impl AutomatedPaymentContract {
    /// Initialize the contract with admin
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if storage::has_admin(&env) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
        Ok(())
    }

    /// Create a new payment schedule
    pub fn create_schedule(
        env: Env,
        payer: Address,
        recipient: Address,
        token: Address,
        amount: u128,
        frequency: payment_schedule::PaymentFrequency,
        start_time: u64,
        end_time: Option<u64>,
    ) -> Result<u64, ContractError> {
        payer.require_auth();
        contract::create_schedule(&env, &payer, &recipient, &token, amount, frequency, start_time, end_time)
    }

    /// Execute scheduled payment
    pub fn execute_payment(
        env: Env,
        schedule_id: u64,
    ) -> Result<(), ContractError> {
        contract::execute_payment(&env, schedule_id)
    }

    /// Update schedule status
    pub fn update_schedule_status(
        env: Env,
        schedule_id: u64,
        payer: Address,
        active: bool,
    ) -> Result<(), ContractError> {
        payer.require_auth();
        contract::update_schedule_status(&env, schedule_id, &payer, active)
    }

    /// Get payment schedule
    pub fn get_schedule(
        env: Env,
        schedule_id: u64,
    ) -> Result<payment_schedule::PaymentSchedule, ContractError> {
        contract::get_schedule(&env, schedule_id)
    }

    /// Get user schedules
    pub fn get_user_schedules(
        env: Env,
        user: Address,
        offset: u32,
        limit: u32,
    ) -> Result<Vec<u64>, ContractError> {
        contract::get_user_schedules(&env, &user, offset, limit)
    }

    /// Cancel schedule and refund remaining funds
    pub fn cancel_schedule(
        env: Env,
        schedule_id: u64,
        payer: Address,
    ) -> Result<(), ContractError> {
        payer.require_auth();
        contract::cancel_schedule(&env, schedule_id, &payer)
    }

    /// Top up schedule balance
    pub fn top_up_schedule(
        env: Env,
        schedule_id: u64,
        payer: Address,
        amount: u128,
    ) -> Result<(), ContractError> {
        payer.require_auth();
        contract::top_up_schedule(&env, schedule_id, &payer, amount)
    }
}