use soroban_sdk::{Address, Env};

const ADMIN_KEY: &str = "admin";

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&ADMIN_KEY)
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&ADMIN_KEY).unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&ADMIN_KEY, admin);
}

pub fn is_admin(env: &Env, address: &Address) -> bool {
    if !has_admin(env) {
        return false;
    }
    get_admin(env) == *address
}