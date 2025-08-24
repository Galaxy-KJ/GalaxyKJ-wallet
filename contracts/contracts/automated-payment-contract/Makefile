# Automated Payment Contract Makefile

.PHONY: build test clean help all

# Default target
all: build test

# Build the contract
build:
	@echo "Building Automated Payment Contract..."
	stellar contract build

# Run all tests
test:
	@echo "Running tests..."
	cargo test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cargo clean
	rm -rf target/
	rm -f *.wasm

# Help target
help:
	@echo "Available targets:"
	@echo "  build    - Build the contract"
	@echo "  test     - Run all tests"
	@echo "  clean    - Clean build artifacts"
	@echo "  all      - Build and test (default)"
	@echo "  help     - Show this help"