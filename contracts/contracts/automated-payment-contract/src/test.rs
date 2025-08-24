#![cfg(test)]
extern crate std;

use crate::{AutomatedPaymentContract, AutomatedPaymentContractClient};
use crate::payment_schedule::{PaymentFrequency, ScheduleStatus};
use crate::error::ContractError;
use soroban_sdk::testutils::Ledger;
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env,
};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

const PAYMENT_AMOUNT: u128 = 100;
const INITIAL_BALANCE: u128 = 10000;

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(env, &sac.address()),
        token::StellarAssetClient::new(env, &sac.address()),
    )
}

fn create_payment_contract<'a>(env: &Env) -> AutomatedPaymentContractClient<'a> {
    let contract_address = env.register_contract(None, AutomatedPaymentContract);
    AutomatedPaymentContractClient::new(env, &contract_address)
}

struct PaymentTest<'a> {
    env: Env,
    admin: Address,
    payer: Address,
    recipient: Address,
    token: TokenClient<'a>,
    contract: AutomatedPaymentContractClient<'a>,
    token_admin: Address,
}

impl<'a> PaymentTest<'a> {
    fn setup() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        
        let admin = Address::generate(&env);
        let payer = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token_admin = Address::generate(&env);
        
        let (token, token_admin_client) = create_token_contract(&env, &token_admin);
        token_admin_client.mint(&payer, &(INITIAL_BALANCE as i128));
        
        let contract = create_payment_contract(&env);
        contract.initialize(&admin);
        
        PaymentTest {
            env,
            admin,
            payer,
            recipient,
            token,
            contract,
            token_admin,
        }
    }

    fn create_daily_schedule(&self, amount: u128, duration_days: u64) -> u64 {
        let start_time = self.env.ledger().timestamp();
        let end_time = Some(start_time + (duration_days * 24 * 60 * 60));
        
        self.contract.create_schedule(
            &self.payer,
            &self.recipient,
            &self.token.address,
            &amount,
            &PaymentFrequency::Daily,
            &start_time,
            &end_time,
        )
    }

    fn create_daily_schedule_immediate(&self, amount: u128, duration_days: u64) -> u64 {
        // Create schedule that can be executed immediately
        let start_time = self.env.ledger().timestamp();
        let end_time = Some(start_time + (duration_days * 24 * 60 * 60));
        
        let schedule_id = self.contract.create_schedule(
            &self.payer,
            &self.recipient,
            &self.token.address,
            &amount,
            &PaymentFrequency::Daily,
            &start_time,
            &end_time,
        );
        
        // The schedule should be immediately executable since start_time equals current time
        schedule_id
    }

    fn create_weekly_schedule(&self, amount: u128, duration_weeks: u64) -> u64 {
        let start_time = self.env.ledger().timestamp();
        let end_time = Some(start_time + (duration_weeks * 7 * 24 * 60 * 60));
        
        self.contract.create_schedule(
            &self.payer,
            &self.recipient,
            &self.token.address,
            &amount,
            &PaymentFrequency::Weekly,
            &start_time,
            &end_time,
        )
    }

    fn create_monthly_schedule(&self, amount: u128, duration_months: u64) -> u64 {
        let start_time = self.env.ledger().timestamp();
        let end_time = Some(start_time + (duration_months * 30 * 24 * 60 * 60));
        
        self.contract.create_schedule(
            &self.payer,
            &self.recipient,
            &self.token.address,
            &amount,
            &PaymentFrequency::Monthly,
            &start_time,
            &end_time,
        )
    }

    fn advance_time(&self, seconds: u64) {
        self.env.ledger().with_mut(|ledger_info| {
            ledger_info.timestamp += seconds;
        });
    }

    fn get_user_schedules(&self, user: &Address, offset: u32, limit: u32) -> soroban_sdk::Vec<u64> {
        self.contract.get_user_schedules(&user.clone(), &offset, &limit)
    }
}

//---
// Initialization Tests
//---

#[test]
fn test_initialize_success() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract = create_payment_contract(&env);
    contract.initialize(&admin);
    // The test passes if no panic occurs
}

#[test]
fn test_initialize_duplicate() {
    let test = PaymentTest::setup();
    // Try to initialize again - this should fail
    let result = test.contract.try_initialize(&test.admin);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::AlreadyInitialized));
}

//---
// Schedule Creation Tests
//---

#[test]
fn test_create_daily_schedule_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule(PAYMENT_AMOUNT, 7);
    
    let schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(schedule.payer, test.payer);
    assert_eq!(schedule.recipient, test.recipient);
    assert_eq!(schedule.amount, PAYMENT_AMOUNT);
    assert_eq!(schedule.frequency, PaymentFrequency::Daily);
    assert_eq!(schedule.status, ScheduleStatus::Active);
    assert_eq!(schedule.payment_count, 0);
    assert_eq!(schedule.failed_attempts, 0);
}

#[test]
fn test_create_weekly_schedule_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_weekly_schedule(PAYMENT_AMOUNT, 4);
    
    let schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(schedule.frequency, PaymentFrequency::Weekly);
    assert_eq!(schedule.status, ScheduleStatus::Active);
}

#[test]
fn test_create_monthly_schedule_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_monthly_schedule(PAYMENT_AMOUNT, 3);
    
    let schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(schedule.frequency, PaymentFrequency::Monthly);
    assert_eq!(schedule.status, ScheduleStatus::Active);
}

#[test]
fn test_create_schedule_zero_amount() {
    let test = PaymentTest::setup();
    let start_time = test.env.ledger().timestamp();
    let end_time = Some(start_time + (7 * 24 * 60 * 60));
    
    let result = test.contract.try_create_schedule(
        &test.payer,
        &test.recipient,
        &test.token.address,
        &0,
        &PaymentFrequency::Daily,
        &start_time,
        &end_time,
    );
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::InvalidAmount));
}

#[test]
fn test_create_schedule_same_payer_recipient() {
    let test = PaymentTest::setup();
    let start_time = test.env.ledger().timestamp();
    let end_time = Some(start_time + (7 * 24 * 60 * 60));
    
    let result = test.contract.try_create_schedule(
        &test.payer,
        &test.payer, // Same as payer
        &test.token.address,
        &PAYMENT_AMOUNT,
        &PaymentFrequency::Daily,
        &start_time,
        &end_time,
    );
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::InvalidInput));
}

#[test]
fn test_create_schedule_invalid_end_time() {
    let test = PaymentTest::setup();
    let start_time = test.env.ledger().timestamp();
    let end_time = Some(start_time.saturating_sub(3600)); // End time before start time, avoid overflow
    
    let result = test.contract.try_create_schedule(
        &test.payer,
        &test.recipient,
        &test.token.address,
        &PAYMENT_AMOUNT,
        &PaymentFrequency::Daily,
        &start_time,
        &end_time,
    );
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::InvalidEndTime));
}

#[test]
fn test_create_schedule_insufficient_funds() {
    let test = PaymentTest::setup();
    let poor_payer = Address::generate(&test.env);
    let start_time = test.env.ledger().timestamp();
    let end_time = Some(start_time + (7 * 24 * 60 * 60));
    
    let result = test.contract.try_create_schedule(
        &poor_payer,
        &test.recipient,
        &test.token.address,
        &PAYMENT_AMOUNT,
        &PaymentFrequency::Daily,
        &start_time,
        &end_time,
    );
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::InsufficientBalance));
}

#[test]
fn test_create_schedule_transfers_funds() {
    let test = PaymentTest::setup();
    let payer_balance_before = test.token.balance(&test.payer);
    let contract_balance_before = test.token.balance(&test.contract.address);
    
    let schedule_id = test.create_daily_schedule(PAYMENT_AMOUNT, 7);
    let schedule = test.contract.get_schedule(&schedule_id);
    
    // The actual transferred amount should match what the contract calculated
    let actual_transferred = payer_balance_before - test.token.balance(&test.payer);
    let actual_received = test.token.balance(&test.contract.address) - contract_balance_before;
    
    // Verify transfers match
    assert_eq!(actual_transferred, actual_received);
    assert_eq!(schedule.balance as i128, actual_transferred);
    
    // Should be at least 7 payments worth, possibly more based on contract logic
    assert!(actual_transferred >= (PAYMENT_AMOUNT * 7) as i128);
}

//---
// Payment Execution Tests
//---

#[test]
fn test_execute_payment_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    
    let recipient_balance_before = test.token.balance(&test.recipient);
    let contract_balance_before = test.token.balance(&test.contract.address);
    
    test.contract.execute_payment(&schedule_id);
    
    // Check payment was made
    assert_eq!(
        test.token.balance(&test.recipient),
        recipient_balance_before + PAYMENT_AMOUNT as i128
    );
    assert_eq!(
        test.token.balance(&test.contract.address),
        contract_balance_before - PAYMENT_AMOUNT as i128
    );
    
    // Check schedule was updated
    let updated_schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(updated_schedule.payment_count, 1);
    assert_eq!(updated_schedule.total_paid, PAYMENT_AMOUNT);
    assert_eq!(updated_schedule.balance, PAYMENT_AMOUNT * 6); // 6 payments remaining
    assert!(updated_schedule.last_payment_at.is_some());
}

#[test]
fn test_execute_payment_not_due() {
    let test = PaymentTest::setup();
    let start_time = test.env.ledger().timestamp() + 3600; // 1 hour in future
    let end_time = Some(start_time + (7 * 24 * 60 * 60));
    
    let schedule_id = test.contract.create_schedule(
        &test.payer,
        &test.recipient,
        &test.token.address,
        &PAYMENT_AMOUNT,
        &PaymentFrequency::Daily,
        &start_time,
        &end_time,
    );
    
    let result = test.contract.try_execute_payment(&schedule_id);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::PaymentNotDue));
}

#[test]
fn test_execute_payment_inactive_schedule() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule(PAYMENT_AMOUNT, 7);
    
    // Deactivate schedule
    test.contract.update_schedule_status(&schedule_id, &test.payer, &false);
    
    let result = test.contract.try_execute_payment(&schedule_id);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::ScheduleNotActive));
}

#[test]
fn test_execute_payment_nonexistent_schedule() {
    let test = PaymentTest::setup();
    let result = test.contract.try_execute_payment(&999);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::ScheduleNotFound));
}

#[test]
fn test_execute_multiple_payments() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    
    let recipient_balance_before = test.token.balance(&test.recipient);
    
    // Execute first payment
    test.contract.execute_payment(&schedule_id);
    
    // Advance time by 1 day
    test.advance_time(24 * 60 * 60);
    
    // Execute second payment
    test.contract.execute_payment(&schedule_id);
    
    // Check payments were made
    assert_eq!(
        test.token.balance(&test.recipient),
        recipient_balance_before + (PAYMENT_AMOUNT * 2) as i128
    );
    
    let schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(schedule.payment_count, 2);
    assert_eq!(schedule.total_paid, PAYMENT_AMOUNT * 2);
}

#[test]
fn test_schedule_completion() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 2); // Only 2 days
    
    // Execute first payment
    test.contract.execute_payment(&schedule_id);
    
    // Advance time to allow for the second payment
    test.advance_time(24 * 60 * 60);
    
    // Execute second (final) payment
    test.contract.execute_payment(&schedule_id);
    
    // Check schedule status
    let completed_schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(completed_schedule.status, ScheduleStatus::Completed);
    assert_eq!(completed_schedule.payment_count, 2);
    assert_eq!(completed_schedule.total_paid, PAYMENT_AMOUNT * 2);
    
    // Verify there is no remaining balance in the schedule
    assert_eq!(completed_schedule.balance, 0);
}


//---
// Schedule Status Update Tests
//---

#[test]
fn test_update_schedule_status_deactivate() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    
    test.contract.update_schedule_status(&schedule_id, &test.payer, &false);
    
    let updated_schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(updated_schedule.status, ScheduleStatus::Inactive);
}

#[test]
fn test_update_schedule_status_reactivate() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    
    test.contract.update_schedule_status(&schedule_id, &test.payer, &false);
    
    let updated_schedule_deactivated = test.contract.get_schedule(&schedule_id);
    assert_eq!(updated_schedule_deactivated.status, ScheduleStatus::Inactive);

    test.contract.update_schedule_status(&schedule_id, &test.payer, &true);
    
    let updated_schedule_reactivated = test.contract.get_schedule(&schedule_id);
    assert_eq!(updated_schedule_reactivated.status, ScheduleStatus::Active);
}

#[test]
fn test_update_schedule_status_not_payer() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    let unauthorized_user = Address::generate(&test.env);

    let result = test.contract.try_update_schedule_status(&schedule_id, &unauthorized_user, &false);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::PayerOnly));
}

#[test]
fn test_update_schedule_status_cancelled() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    test.contract.cancel_schedule(&schedule_id, &test.payer);
    
    let result = test.contract.try_update_schedule_status(&schedule_id, &test.payer, &true);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::OperationNotAllowed));
}

//---
// Schedule Cancellation Tests
//---

#[test]
fn test_cancel_schedule_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    
    let payer_balance_before = test.token.balance(&test.payer);
    let contract_balance_before = test.token.balance(&test.contract.address);
    
    test.contract.cancel_schedule(&schedule_id, &test.payer);
    
    let updated_schedule = test.contract.get_schedule(&schedule_id);
    assert_eq!(updated_schedule.status, ScheduleStatus::Cancelled);
    assert_eq!(updated_schedule.balance, 0);
    
    // Check that funds were refunded to the payer
    assert_eq!(test.token.balance(&test.payer), payer_balance_before + contract_balance_before);
}

#[test]
fn test_cancel_schedule_not_payer() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    let unauthorized_user = Address::generate(&test.env);
    
    let result = test.contract.try_cancel_schedule(&schedule_id, &unauthorized_user);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::PayerOnly));
}

#[test]
fn test_cancel_schedule_already_cancelled() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    test.contract.cancel_schedule(&schedule_id, &test.payer);
    
    let result = test.contract.try_cancel_schedule(&schedule_id, &test.payer);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::ScheduleAlreadyCancelled));
}

//---
// Schedule Top-Up Tests
//---

#[test]
fn test_top_up_schedule_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 2);
    
    let payer_balance_before_top_up = test.token.balance(&test.payer);
    let schedule_balance_before_top_up = test.contract.get_schedule(&schedule_id).balance;
    let top_up_amount = 500;
    
    test.contract.top_up_schedule(&schedule_id, &test.payer, &top_up_amount);
    
    let schedule_after_top_up = test.contract.get_schedule(&schedule_id);
    assert_eq!(schedule_after_top_up.balance, schedule_balance_before_top_up + top_up_amount);
    
    // Verify funds were transferred
    assert_eq!(test.token.balance(&test.payer), payer_balance_before_top_up - top_up_amount as i128);
}

#[test]
fn test_top_up_schedule_not_payer() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    let unauthorized_user = Address::generate(&test.env);
    
    let result = test.contract.try_top_up_schedule(&schedule_id, &unauthorized_user, &100);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::PayerOnly));
}

#[test]
fn test_top_up_schedule_zero_amount() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    
    let result = test.contract.try_top_up_schedule(&schedule_id, &test.payer, &0);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::InvalidAmount));
}

#[test]
fn test_top_up_schedule_on_cancelled_schedule() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule_immediate(PAYMENT_AMOUNT, 7);
    test.contract.cancel_schedule(&schedule_id, &test.payer);
    
    let result = test.contract.try_top_up_schedule(&schedule_id, &test.payer, &100);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::OperationNotAllowed));
}

//---
// Getters and Query Tests
//---

#[test]
fn test_get_schedule_success() {
    let test = PaymentTest::setup();
    let schedule_id = test.create_daily_schedule(PAYMENT_AMOUNT, 7);
    let schedule = test.contract.get_schedule(&schedule_id);
    
    assert_eq!(schedule.id, schedule_id);
    assert_eq!(schedule.payer, test.payer);
}

#[test]
fn test_get_schedule_not_found() {
    let test = PaymentTest::setup();
    let result = test.contract.try_get_schedule(&999);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), Ok(ContractError::ScheduleNotFound));
}

#[test]
fn test_get_user_schedules() {
    let test = PaymentTest::setup();
    let schedule_id1 = test.create_daily_schedule(100, 1);
    let schedule_id2 = test.create_daily_schedule(200, 2);
    let schedule_id3 = test.create_daily_schedule(300, 3);
    
    // Get all schedules
    let all_schedules = test.get_user_schedules(&test.payer, 0, 10);
    assert_eq!(all_schedules.len(), 3);
    assert_eq!(all_schedules.get(0).unwrap(), schedule_id1);
    assert_eq!(all_schedules.get(1).unwrap(), schedule_id2);
    assert_eq!(all_schedules.get(2).unwrap(), schedule_id3);
    
    // Test pagination (offset)
    let paginated_schedules = test.get_user_schedules(&test.payer, 1, 2);
    assert_eq!(paginated_schedules.len(), 2);
    assert_eq!(paginated_schedules.get(0).unwrap(), schedule_id2);
    assert_eq!(paginated_schedules.get(1).unwrap(), schedule_id3);
    
    // Test pagination (limit)
    let limited_schedules = test.get_user_schedules(&test.payer, 0, 1);
    assert_eq!(limited_schedules.len(), 1);
    assert_eq!(limited_schedules.get(0).unwrap(), schedule_id1);
    
    // Test for a user with no schedules
    let new_user = Address::generate(&test.env);
    let empty_schedules = test.get_user_schedules(&new_user, 0, 10);
    assert_eq!(empty_schedules.len(), 0);
}