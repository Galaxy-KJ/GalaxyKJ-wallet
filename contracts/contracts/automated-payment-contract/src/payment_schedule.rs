use soroban_sdk::{contracttype, symbol_short, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentFrequency {
    Daily,
    Weekly,
    Monthly,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ScheduleStatus {
    Active,
    Inactive,
    Cancelled,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentSchedule {
    pub id: u64,
    pub payer: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: u128,
    pub frequency: PaymentFrequency,
    pub status: ScheduleStatus,
    pub balance: u128,
    pub total_paid: u128,
    pub payment_count: u32,
    pub failed_attempts: u32,
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub next_payment_time: u64,
    pub created_at: u64,
    pub last_payment_at: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Schedule(u64),
    UserSchedules(Address),
    ScheduleCounter,
}

const SCHEDULE_COUNTER: Symbol = symbol_short!("SCH_CNT");

pub fn get_next_schedule_id(env: &Env) -> u64 {
    let current = env.storage().instance().get(&SCHEDULE_COUNTER).unwrap_or(0u64);
    let next = current + 1;
    env.storage().instance().set(&SCHEDULE_COUNTER, &next);
    next
}

pub fn get_schedule(env: &Env, schedule_id: u64) -> Option<PaymentSchedule> {
    let key = StorageKey::Schedule(schedule_id);
    env.storage().persistent().get(&key)
}

pub fn set_schedule(env: &Env, schedule: &PaymentSchedule) {
    let key = StorageKey::Schedule(schedule.id);
    env.storage().persistent().set(&key, schedule);
}

pub fn get_user_schedules(env: &Env, user: &Address) -> Vec<u64> {
    let key = StorageKey::UserSchedules(user.clone());
    env.storage().persistent().get(&key).unwrap_or(Vec::new(env))
}

pub fn add_user_schedule(env: &Env, user: &Address, schedule_id: u64) {
    let key = StorageKey::UserSchedules(user.clone());
    let mut schedules = get_user_schedules(env, user);
    schedules.push_back(schedule_id);
    env.storage().persistent().set(&key, &schedules);
}

pub fn calculate_next_payment_time(frequency: &PaymentFrequency, current_time: u64) -> u64 {
    match frequency {
        PaymentFrequency::Daily => current_time + 86400,      // 24 hours
        PaymentFrequency::Weekly => current_time + 604800,    // 7 days
        PaymentFrequency::Monthly => current_time + 2592000,  // 30 days
    }
}