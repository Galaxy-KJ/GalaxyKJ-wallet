// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Add TextEncoder/TextDecoder for crypto tests
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Use Node.js webcrypto for real crypto operations in tests
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  configurable: true,
})

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  configurable: true,
  writable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
})

// Suppress console.log, console.warn, etc. in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}

// Mock environment variables for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'