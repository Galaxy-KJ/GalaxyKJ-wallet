# Galaxy Smart Wallet - Smart Swap Contract Makefile

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Galaxy Smart Wallet - Smart Swap Contract"
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Build targets
.PHONY: build
build: ## Build the smart swap contract
	@echo "Building smart swap contract..."
	cargo build --target wasm32-unknown-unknown --release

.PHONY: build-dev
build-dev: ## Build the contract in development mode
	@echo "Building smart swap contract (development mode)..."
	cargo build

.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	cargo clean

# Test targets
.PHONY: test
test: ## Run all unit tests
	@echo "Running unit tests..."
	cargo test

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "Running unit tests (verbose)..."
	cargo test -- --nocapture

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "Running integration tests..."
	cargo test --test integration

.PHONY: test-coverage
test-coverage: ## Run tests with coverage (requires cargo-tarpaulin)
	@echo "Running tests with coverage..."
	cargo tarpaulin --out Html --output-dir coverage

# Linting and formatting
.PHONY: lint
lint: ## Run clippy linter
	@echo "Running clippy linter..."
	cargo clippy -- -D warnings

.PHONY: format
format: ## Format code with rustfmt
	@echo "Formatting code..."
	cargo fmt

.PHONY: format-check
format-check: ## Check code formatting
	@echo "Checking code formatting..."
	cargo fmt -- --check

# Contract deployment and interaction (requires Soroban CLI)
.PHONY: deploy-testnet
deploy-testnet: build ## Deploy contract to Stellar testnet
	@echo "Deploying to Stellar testnet..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/smart_swap.wasm \
		--source-account admin \
		--network testnet

.PHONY: deploy-futurenet
deploy-futurenet: build ## Deploy contract to Stellar futurenet
	@echo "Deploying to Stellar futurenet..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/smart_swap.wasm \
		--source-account admin \
		--network futurenet

.PHONY: deploy-local
deploy-local: build ## Deploy contract to local Stellar network
	@echo "Deploying to local network..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/smart_swap.wasm \
		--source-account admin \
		--network local

# Contract interaction examples
.PHONY: init-contract
init-contract: ## Initialize the deployed contract (requires CONTRACT_ID, ORACLE_ID, DEX_ID)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ORACLE_ID)" ] || [ -z "$(DEX_ID)" ]; then \
		echo "Error: CONTRACT_ID, ORACLE_ID, and DEX_ID environment variables are required"; \
		echo "Usage: make init-contract CONTRACT_ID=<contract_id> ORACLE_ID=<oracle_contract_id> DEX_ID=<dex_contract_id>"; \
		exit 1; \
	fi
	@echo "Initializing contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		initialize \
		--admin $(shell soroban config identity address admin) \
		--oracle_address $(ORACLE_ID) \
		--dex_address $(DEX_ID)

.PHONY: create-swap-condition
create-swap-condition: ## Create a swap condition (requires CONTRACT_ID and parameters)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(SOURCE_ASSET)" ] || [ -z "$(DEST_ASSET)" ] || [ -z "$(AMOUNT)" ]; then \
		echo "Error: CONTRACT_ID, SOURCE_ASSET, DEST_ASSET, and AMOUNT environment variables are required"; \
		echo "Usage: make create-swap-condition CONTRACT_ID=<contract_id> SOURCE_ASSET=<asset> DEST_ASSET=<asset> AMOUNT=<amount>"; \
		exit 1; \
	fi
	@echo "Creating swap condition on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account user \
		--network testnet \
		-- \
		create_swap_condition \
		--caller $(shell soroban config identity address user) \
		--request '{"source_asset":"$(SOURCE_ASSET)","destination_asset":"$(DEST_ASSET)","condition_type":{"PercentageIncrease":10},"amount_to_swap":"$(AMOUNT)","max_slippage":500,"expires_at":'$(shell echo $$(($(shell date +%s) + 86400)))',"max_executions":1}'

.PHONY: check-condition
check-condition: ## Check and execute a condition (requires CONTRACT_ID and CONDITION_ID)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(CONDITION_ID)" ]; then \
		echo "Error: CONTRACT_ID and CONDITION_ID environment variables are required"; \
		echo "Usage: make check-condition CONTRACT_ID=<contract_id> CONDITION_ID=<condition_id>"; \
		exit 1; \
	fi
	@echo "Checking condition $(CONDITION_ID) on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account executor \
		--network testnet \
		-- \
		check_and_execute_condition \
		--condition_id $(CONDITION_ID)

.PHONY: get-condition
get-condition: ## Get condition details (requires CONTRACT_ID and CONDITION_ID)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(CONDITION_ID)" ]; then \
		echo "Error: CONTRACT_ID and CONDITION_ID environment variables are required"; \
		echo "Usage: make get-condition CONTRACT_ID=<contract_id> CONDITION_ID=<condition_id>"; \
		exit 1; \
	fi
	@echo "Getting condition $(CONDITION_ID) from contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account reader \
		--network testnet \
		-- \
		get_condition \
		--condition_id $(CONDITION_ID)

.PHONY: get-user-conditions
get-user-conditions: ## Get user conditions (requires CONTRACT_ID and USER_ADDRESS)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(USER_ADDRESS)" ]; then \
		echo "Error: CONTRACT_ID and USER_ADDRESS environment variables are required"; \
		echo "Usage: make get-user-conditions CONTRACT_ID=<contract_id> USER_ADDRESS=<user_address>"; \
		exit 1; \
	fi
	@echo "Getting conditions for user $(USER_ADDRESS) from contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account reader \
		--network testnet \
		-- \
		get_user_conditions \
		--user $(USER_ADDRESS)

.PHONY: cancel-condition
cancel-condition: ## Cancel a condition (requires CONTRACT_ID and CONDITION_ID)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(CONDITION_ID)" ]; then \
		echo "Error: CONTRACT_ID and CONDITION_ID environment variables are required"; \
		echo "Usage: make cancel-condition CONTRACT_ID=<contract_id> CONDITION_ID=<condition_id>"; \
		exit 1; \
	fi
	@echo "Cancelling condition $(CONDITION_ID) on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account user \
		--network testnet \
		-- \
		cancel_condition \
		--caller $(shell soroban config identity address user) \
		--condition_id $(CONDITION_ID)

.PHONY: get-swap-quote
get-swap-quote: ## Get swap quote (requires CONTRACT_ID, TOKEN_IN, TOKEN_OUT, AMOUNT)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(TOKEN_IN)" ] || [ -z "$(TOKEN_OUT)" ] || [ -z "$(AMOUNT)" ]; then \
		echo "Error: CONTRACT_ID, TOKEN_IN, TOKEN_OUT, and AMOUNT environment variables are required"; \
		echo "Usage: make get-swap-quote CONTRACT_ID=<contract_id> TOKEN_IN=<token> TOKEN_OUT=<token> AMOUNT=<amount>"; \
		exit 1; \
	fi
	@echo "Getting swap quote for $(TOKEN_IN) -> $(TOKEN_OUT) ($(AMOUNT)) from contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account reader \
		--network testnet \
		-- \
		get_swap_quote \
		--token_in $(TOKEN_IN) \
		--token_out $(TOKEN_OUT) \
		--amount_in $(AMOUNT)

.PHONY: get-stats
get-stats: ## Get global contract statistics (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make get-stats CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Getting global statistics from contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account reader \
		--network testnet \
		-- \
		get_global_stats

# Admin functions
.PHONY: pause-contract
pause-contract: ## Pause the contract (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make pause-contract CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Pausing contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		set_pause_status \
		--caller $(shell soroban config identity address admin) \
		--paused true

.PHONY: unpause-contract
unpause-contract: ## Unpause the contract (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make unpause-contract CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Unpausing contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		set_pause_status \
		--caller $(shell soroban config identity address admin) \
		--paused false

.PHONY: add-supported-asset
add-supported-asset: ## Add supported asset (requires CONTRACT_ID and ASSET)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ASSET)" ]; then \
		echo "Error: CONTRACT_ID and ASSET environment variables are required"; \
		echo "Usage: make add-supported-asset CONTRACT_ID=<contract_id> ASSET=<asset_symbol>"; \
		exit 1; \
	fi
	@echo "Adding supported asset $(ASSET) to contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		add_supported_asset \
		--caller $(shell soroban config identity address admin) \
		--asset_symbol $(ASSET)

.PHONY: cleanup-expired
cleanup-expired: ## Cleanup expired conditions (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make cleanup-expired CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Cleaning up expired conditions in contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account maintainer \
		--network testnet \
		-- \
		cleanup_expired_conditions \
		--limit 50

# Development targets
.PHONY: watch
watch: ## Watch for changes and rebuild
	@echo "Watching for changes..."
	cargo watch -x build

.PHONY: watch-test
watch-test: ## Watch for changes and run tests
	@echo "Watching for changes and running tests..."
	cargo watch -x test

# Quality assurance
.PHONY: check-all
check-all: format-check lint test ## Run all quality checks
	@echo "All quality checks completed successfully!"

.PHONY: fix-all
fix-all: format lint ## Fix formatting and linting issues
	@echo "Fixed all auto-fixable issues!"

# Documentation
.PHONY: docs
docs: ## Generate and open documentation
	@echo "Generating documentation..."
	cargo doc --open

.PHONY: docs-deps
docs-deps: ## Generate documentation including dependencies
	@echo "Generating documentation with dependencies..."
	cargo doc --document-private-items --open

# Contract optimization
.PHONY: optimize
optimize: ## Build optimized wasm for production
	@echo "Building optimized wasm..."
	cargo build --target wasm32-unknown-unknown --release
	@echo "Optimizing wasm size..."
	wasm-opt -Oz --output target/wasm32-unknown-unknown/release/smart_swap_optimized.wasm \
		target/wasm32-unknown-unknown/release/smart_swap.wasm

# Setup targets
.PHONY: setup-dev
setup-dev: ## Set up development environment
	@echo "Setting up development environment..."
	rustup target add wasm32-unknown-unknown
	cargo install cargo-watch
	cargo install soroban-cli
	@echo "Development environment setup complete!"

.PHONY: setup-tools
setup-tools: ## Install additional development tools
	@echo "Installing additional development tools..."
	cargo install cargo-tarpaulin
	cargo install wasm-opt
	@echo "Additional tools installed!"

# Validation targets
.PHONY: validate-wasm
validate-wasm: build ## Validate the generated WASM
	@echo "Validating WASM..."
	soroban contract install \
		--wasm target/wasm32-unknown-unknown/release/smart_swap.wasm \
		--network testnet

.PHONY: inspect-wasm
inspect-wasm: build ## Inspect WASM file information
	@echo "Inspecting WASM file..."
	wasm-objdump -h target/wasm32-unknown-unknown/release/smart_swap.wasm
	@echo "WASM file size:"
	ls -lh target/wasm32-unknown-unknown/release/smart_swap.wasm

# Full workflow targets
.PHONY: ci
ci: check-all build ## Run continuous integration workflow
	@echo "CI workflow completed successfully!"

.PHONY: release
release: clean optimize validate-wasm ## Prepare for release
	@echo "Release preparation completed!"

# Monitoring and maintenance
.PHONY: monitor-conditions
monitor-conditions: ## Monitor and execute pending conditions (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make monitor-conditions CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Monitoring conditions in contract $(CONTRACT_ID)..."
	@for i in $$(seq 1 10); do \
		echo "Checking condition $$i..."; \
		soroban contract invoke \
			--id $(CONTRACT_ID) \
			--source-account executor \
			--network testnet \
			-- \
			check_and_execute_condition \
			--condition_id $$i 2>/dev/null || true; \
		sleep 1; \
	done

# Example workflows
.PHONY: demo-workflow
demo-workflow: ## Run a complete demo workflow (requires CONTRACT_ID, ORACLE_ID, DEX_ID)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ORACLE_ID)" ] || [ -z "$(DEX_ID)" ]; then \
		echo "Error: CONTRACT_ID, ORACLE_ID, and DEX_ID environment variables are required"; \
		echo "Usage: make demo-workflow CONTRACT_ID=<contract_id> ORACLE_ID=<oracle_id> DEX_ID=<dex_id>"; \
		exit 1; \
	fi
	@echo "Running Smart Swap demo workflow..."
	@echo "1. Initializing contract..."
	@make init-contract CONTRACT_ID=$(CONTRACT_ID) ORACLE_ID=$(ORACLE_ID) DEX_ID=$(DEX_ID)
	@echo "2. Adding supported assets..."
	@make add-supported-asset CONTRACT_ID=$(CONTRACT_ID) ASSET=XLM
	@make add-supported-asset CONTRACT_ID=$(CONTRACT_ID) ASSET=USDC
	@make add-supported-asset CONTRACT_ID=$(CONTRACT_ID) ASSET=BTC
	@echo "3. Creating test swap condition..."
	@make create-swap-condition CONTRACT_ID=$(CONTRACT_ID) SOURCE_ASSET=XLM DEST_ASSET=USDC AMOUNT=100_0000000
	@echo "4. Checking condition..."
	@make check-condition CONTRACT_ID=$(CONTRACT_ID) CONDITION_ID=1
	@echo "5. Getting statistics..."
	@make get-stats CONTRACT_ID=$(CONTRACT_ID)
	@echo "Demo workflow completed!"

# Configuration management
.PHONY: show-config
show-config: ## Show current Soroban configuration
	@echo "Soroban networks:"
	@soroban config network ls
	@echo "Soroban identities:"
	@soroban config identity ls

# Batch operations
.PHONY: batch-check-conditions
batch-check-conditions: ## Check multiple conditions (requires CONTRACT_ID and CONDITION_IDS)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(CONDITION_IDS)" ]; then \
		echo "Error: CONTRACT_ID and CONDITION_IDS environment variables are required"; \
		echo "Usage: make batch-check-conditions CONTRACT_ID=<contract_id> CONDITION_IDS='1,2,3,4,5'"; \
		exit 1; \
	fi
	@echo "Batch checking conditions: $(CONDITION_IDS)"
	@IFS=','; for condition_id in $(CONDITION_IDS); do \
		echo "Checking condition $$condition_id..."; \
		make check-condition CONTRACT_ID=$(CONTRACT_ID) CONDITION_ID=$$condition_id; \
	done

# Performance testing
.PHONY: stress-test
stress-test: ## Run stress tests (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make stress-test CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Running stress tests on contract $(CONTRACT_ID)..."
	@echo "Creating multiple conditions rapidly..."
	@for i in $$(seq 1 20); do \
		echo "Creating condition $$i..."; \
		make create-swap-condition CONTRACT_ID=$(CONTRACT_ID) SOURCE_ASSET=XLM DEST_ASSET=USDC AMOUNT=$$(($$i * 10))_0000000 & \
	done
	@wait
	@echo "Stress test completed!"