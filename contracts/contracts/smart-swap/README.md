# Smart Swap Contract for Conditional Trading

A comprehensive Soroban smart contract that enables automatic token swaps based on configurable price conditions. This contract integrates with price oracles and DEX protocols to provide reliable, automated trading capabilities on the Stellar network.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)

## 🎯 Overview

The Smart Swap Contract allows users to create conditional trading orders that execute automatically when specific price conditions are met. Unlike traditional limit orders, this system supports complex conditions such as percentage changes, target prices, and threshold-based triggers.

### Key Benefits

- **Automated Trading**: Set conditions once and let the contract execute trades automatically
- **Multiple Condition Types**: Support for various trading strategies
- **Slippage Protection**: Built-in mechanisms to prevent excessive slippage
- **Oracle Integration**: Real-time price data from reliable oracle networks
- **DEX Integration**: Seamless integration with Stellar's decentralized exchanges

## ✨ Features

### Core Functionality

- **Conditional Swaps**: Create swap conditions based on price movements
- **Multiple Condition Types**:
  - Percentage increase/decrease triggers
  - Target price execution
  - Price above/below thresholds
- **Slippage Protection**: Configurable maximum slippage tolerance
- **Expiration Management**: Time-based condition expiration
- **Execution Limits**: Control over single or recurring executions

### Advanced Features

- **Oracle Integration**: Real-time price feeds with fallback mechanisms
- **DEX Integration**: Multi-hop routing for optimal swap execution
- **User Management**: Individual condition limits and tracking
- **Global Statistics**: Contract-wide metrics and analytics
- **Admin Controls**: Pause/unpause and configuration management
- **Batch Operations**: Efficient processing of multiple conditions

### Security Features

- **Input Validation**: Comprehensive parameter validation
- **Rate Limiting**: Protection against spam and abuse
- **Emergency Pause**: Circuit breaker for critical situations
- **Access Control**: Role-based permissions system
- **Audit Trail**: Complete execution history tracking

## 🏗️ Architecture

### Contract Structure

```
contracts/contracts/smart-swap/
├── src/
│   ├── lib.rs              # Main contract implementation
│   ├── swap_condition.rs   # Swap condition data structures
│   ├── price_oracle.rs     # Oracle integration logic
│   ├── dex_integration.rs  # DEX interaction logic
│   └── test.rs            # Comprehensive test suite
├── Cargo.toml             # Project dependencies
├── Makefile              # Build and deployment automation
└── README.md             # This documentation
```

### Data Structures

#### SwapCondition
Core structure representing a user's conditional swap order:
- **Condition ID**: Unique identifier
- **Owner**: User address
- **Assets**: Source and destination tokens
- **Condition Type**: Price trigger logic
- **Amount**: Swap amount and slippage protection
- **Timing**: Creation, expiration, and execution tracking

#### Condition Types
- `PercentageIncrease(u32)`: Execute when price increases by X%
- `PercentageDecrease(u32)`: Execute when price decreases by X%
- `TargetPrice(u64)`: Execute when price reaches specific value
- `PriceAbove(u64)`: Execute when price goes above threshold
- `PriceBelow(u64)`: Execute when price goes below threshold

### Integration Points

#### Price Oracle Integration
- Real-time price data retrieval
- Fallback price mechanisms
- Data quality validation
- Multi-source aggregation support

#### DEX Integration
- Swap quote calculation
- Liquidity validation
- Multi-hop routing
- Slippage protection
- Transaction execution

## 🚀 Installation & Setup

### Prerequisites

- Rust toolchain (latest stable)
- Soroban CLI
- Stellar network access (testnet/futurenet)

### Build the Contract

```bash
# Clone the repository
git clone <repository-url>
cd galaxy-smart-wallet/contracts/contracts/smart-swap

# Install dependencies
make setup-dev

# Build the contract
make build
```

### Run Tests

```bash
# Run all tests
make test

# Run tests with verbose output
make test-verbose

# Run tests with coverage
make test-coverage
```

## 📖 Usage

### Basic Usage Example

```rust
// 1. Initialize the contract
SmartSwap::initialize(
    env,
    admin_address,
    oracle_contract_address,
    dex_contract_address
).unwrap();

// 2. Create a swap condition
let request = CreateSwapRequest {
    source_asset: Symbol::new(&env, "XLM"),
    destination_asset: Symbol::new(&env, "USDC"),
    condition_type: SwapConditionType::PercentageIncrease(10), // 10% increase
    amount_to_swap: 100_0000000, // 100 XLM
    max_slippage: 500,           // 5% slippage tolerance
    expires_at: env.ledger().timestamp() + 86400, // 24 hours
    max_executions: 1,
};

let condition_id = SmartSwap::create_swap_condition(
    env,
    user_address,
    request
).unwrap();

// 3. Check and execute condition (typically done by automation)
let execution_result = SmartSwap::check_and_execute_condition(
    env,
    condition_id
).unwrap();
```

### Command Line Interface

The contract includes a comprehensive Makefile for interaction:

```bash
# Deploy contract
make deploy-testnet

# Initialize contract
make init-contract CONTRACT_ID=<id> ORACLE_ID=<oracle_id> DEX_ID=<dex_id>

# Create swap condition
make create-swap-condition CONTRACT_ID=<id> SOURCE_ASSET=XLM DEST_ASSET=USDC AMOUNT=100_0000000

# Check condition execution
make check-condition CONTRACT_ID=<id> CONDITION_ID=1

# Get condition details
make get-condition CONTRACT_ID=<id> CONDITION_ID=1

# Cancel condition
make cancel-condition CONTRACT_ID=<id> CONDITION_ID=1
```

## 📚 API Reference

### Core Functions

#### `initialize(admin, oracle_address, dex_address)`
Initialize the contract with admin and integration addresses.

#### `create_swap_condition(caller, request) -> u64`
Create a new conditional swap order. Returns condition ID.

#### `check_and_execute_condition(condition_id) -> Option<SwapExecution>`
Check if condition should execute and perform swap if conditions are met.

#### `cancel_condition(caller, condition_id)`
Cancel an active condition (owner only).

### Query Functions

#### `get_condition(condition_id) -> Option<SwapCondition>`
Retrieve condition details by ID.

#### `get_user_conditions(user) -> Vec<u64>`
Get all condition IDs for a specific user.

#### `get_condition_executions(condition_id) -> Vec<SwapExecution>`
Get execution history for a condition.

#### `get_swap_quote(token_in, token_out, amount_in) -> SwapQuote`
Get current swap quote from DEX.

### Admin Functions

#### `set_pause_status(paused)`
Pause/unpause contract operations.

#### `add_supported_asset(asset_symbol)`
Add asset to supported trading pairs.

#### `update_oracle_config(new_config)`
Update oracle integration settings.

#### `cleanup_expired_conditions(limit) -> u32`
Remove expired conditions to optimize storage.

## 🧪 Testing

The contract includes comprehensive test coverage:

### Test Categories

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Cross-module functionality
3. **Edge Case Tests**: Boundary conditions and error states
4. **Security Tests**: Access control and validation
5. **Performance Tests**: Gas optimization and scalability

### Running Tests

```bash
# All tests
make test

# Specific test pattern
cargo test test_swap_condition

# Integration tests
make test-integration

# Performance tests
make stress-test CONTRACT_ID=<id>
```

### Test Coverage

The test suite covers:
- ✅ Contract initialization and configuration
- ✅ Swap condition creation and validation
- ✅ All condition type execution logic
- ✅ Oracle integration and fallbacks
- ✅ DEX integration and slippage protection
- ✅ User permission and access control
- ✅ Admin functions and emergency controls
- ✅ Edge cases and error handling

## 🚀 Deployment

### Testnet Deployment

```bash
# Build and deploy
make deploy-testnet

# Initialize with oracle and DEX addresses
make init-contract CONTRACT_ID=<deployed_id> ORACLE_ID=<oracle_id> DEX_ID=<dex_id>
```

### Production Deployment

```bash
# Optimized build
make optimize

# Deploy to mainnet
make deploy-mainnet

# Validate deployment
make validate-wasm
```

### Environment Configuration

Required environment variables:
- `CONTRACT_ID`: Deployed contract identifier
- `ORACLE_ID`: Price oracle contract address
- `DEX_ID`: DEX contract address
- `ADMIN_SECRET`: Admin account secret key

## 🔒 Security

### Security Measures

1. **Input Validation**: All parameters validated before processing
2. **Access Control**: Role-based permissions for sensitive operations
3. **Rate Limiting**: Protection against spam and abuse
4. **Slippage Protection**: Configurable limits prevent MEV attacks
5. **Emergency Pause**: Circuit breaker for critical situations
6. **Audit Trail**: Complete execution history for transparency

### Security Best Practices

- Always validate condition parameters
- Set reasonable slippage limits
- Monitor for unusual activity patterns
- Use time limits for all conditions
- Regularly update oracle and DEX configurations

### Known Limitations

- Oracle price feed dependencies
- DEX liquidity requirements
- Gas cost variations
- Network congestion effects

## 📊 Monitoring & Analytics

### Global Statistics

The contract tracks comprehensive metrics:
- Total conditions created
- Conditions executed successfully
- Total volume swapped
- Active conditions count
- Fees collected

### User Analytics

Per-user tracking includes:
- Condition success rates
- Average execution times
- Slippage statistics
- Volume metrics

## 🛠️ Development

### Adding New Condition Types

1. Extend `SwapConditionType` enum in `swap_condition.rs`
2. Implement execution logic in `should_execute()`
3. Add validation in `validate_condition_type()`
4. Include comprehensive tests

### Integration Guidelines

The contract is designed for integration with:
- Frontend trading interfaces
- Automated execution services
- Portfolio management tools
- Analytics dashboards

### API Integration

Example JavaScript integration:
```javascript
const contract = new SorobanContract(contractId);

// Create condition
const result = await contract.call(
  'create_swap_condition',
  caller,
  request
);

// Monitor execution
const execution = await contract.call(
  'check_and_execute_condition',
  conditionId
);
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Run quality checks: `make check-all`
5. Submit pull request

### Code Standards

- Follow Rust best practices
- Maintain test coverage above 90%
- Include comprehensive documentation
- Validate all user inputs
- Handle all error conditions

### Testing Requirements

All contributions must include:
- Unit tests for new functionality
- Integration tests for cross-module features
- Edge case testing
- Performance impact assessment

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

For support and questions:
- GitHub Issues: [Create an issue](https://github.com/galaxy-smart-wallet/issues)
- Documentation: See inline code documentation
- Community: Join our developer community

---

**Galaxy Smart Wallet - Smart Swap Contract**  
*Automated conditional trading on Stellar*

Built with ❤️ for the Stellar ecosystem