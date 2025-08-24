use soroban_sdk::{contracttype, Address, Env};
use crate::payment_schedule::PaymentFrequency;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScheduleCreatedEvent {
    pub schedule_id: u64,
    pub payer: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: u128,
    pub frequency: PaymentFrequency,
    pub start_time: u64,
    pub end_time: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentExecutedEvent {
    pub schedule_id: u64,
    pub recipient: Address,
    pub amount: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentFailedEvent {
    pub schedule_id: u64,
    pub amount: u128,
    pub failed_attempts: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScheduleCancelledEvent {
    pub schedule_id: u64,
    pub payer: Address,
    pub refunded_amount: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScheduleToppedUpEvent {
    pub schedule_id: u64,
    pub payer: Address,
    pub amount: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScheduleStatusChangedEvent {
    pub schedule_id: u64,
    pub payer: Address,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScheduleRefundedEvent {
    pub schedule_id: u64,
    pub payer: Address,
    pub amount: u128,
}

pub fn emit_schedule_created(
    env: &Env,
    schedule_id: u64,
    payer: Address,
    recipient: Address,
    token: Address,
    amount: u128,
    frequency: PaymentFrequency,
    start_time: u64,
    end_time: Option<u64>,
) {
    let event = ScheduleCreatedEvent {
        schedule_id,
        payer,
        recipient,
        token,
        amount,
        frequency,
        start_time,
        end_time,
    };
    env.events().publish(("schedule_created",), event);
}

pub fn emit_payment_executed(env: &Env, schedule_id: u64, recipient: Address, amount: u128) {
    let event = PaymentExecutedEvent {
        schedule_id,
        recipient,
        amount,
    };
    env.events().publish(("payment_executed",), event);
}

pub fn emit_payment_failed(env: &Env, schedule_id: u64, amount: u128, failed_attempts: u32) {
    let event = PaymentFailedEvent {
        schedule_id,
        amount,
        failed_attempts,
    };
    env.events().publish(("payment_failed",), event);
}

pub fn emit_schedule_cancelled(env: &Env, schedule_id: u64, payer: Address, refunded_amount: u128) {
    let event = ScheduleCancelledEvent {
        schedule_id,
        payer,
        refunded_amount,
    };
    env.events().publish(("schedule_cancelled",), event);
}

pub fn emit_schedule_topped_up(env: &Env, schedule_id: u64, payer: Address, amount: u128) {
    let event = ScheduleToppedUpEvent {
        schedule_id,
        payer,
        amount,
    };
    env.events().publish(("schedule_topped_up",), event);
}

pub fn emit_schedule_activated(env: &Env, schedule_id: u64, payer: Address) {
    let event = ScheduleStatusChangedEvent {
        schedule_id,
        payer,
        active: true,
    };
    env.events().publish(("schedule_activated",), event);
}

pub fn emit_schedule_deactivated(env: &Env, schedule_id: u64, payer: Address) {
    let event = ScheduleStatusChangedEvent {
        schedule_id,
        payer,
        active: false,
    };
    env.events().publish(("schedule_deactivated",), event);
}

pub fn emit_schedule_refunded(env: &Env, schedule_id: u64, payer: Address, amount: u128) {
    let event = ScheduleRefundedEvent {
        schedule_id,
        payer,
        amount,
    };
    env.events().publish(("schedule_refunded",), event);
}