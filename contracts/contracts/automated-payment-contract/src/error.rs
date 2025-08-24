use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    // Initialization errors
    AlreadyInitialized = 1,
    NotInitialized = 2,
    
    // Authorization errors
    Unauthorized = 3,
    AdminOnly = 4,
    PayerOnly = 5,
    RecipientOnly = 6,
    
    // Schedule errors
    ScheduleNotFound = 7,
    ScheduleNotActive = 8,
    ScheduleAlreadyCancelled = 9,
    PaymentNotDue = 10,
    
    // Payment errors
    InsufficientBalance = 11,
    PaymentFailed = 12,
    InvalidAmount = 13,
    
    // Validation errors
    InvalidInput = 14,
    InvalidStartTime = 15,
    InvalidEndTime = 16,
    
    // General errors
    DataNotFound = 17,
    OperationNotAllowed = 18,
}