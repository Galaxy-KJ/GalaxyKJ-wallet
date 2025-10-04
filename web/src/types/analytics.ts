/**
 * Analytics and Monitoring Type Definitions
 * TypeScript interfaces for analytics events, error reports, and monitoring data
 */

// Specific Event Property Interfaces
export interface PageViewProperties {
  page: string;
  fromPage: string;
  timestamp: number;
}

export interface CustomEventProperties {
  [key: string]: unknown;
}

export interface ErrorContext {
  [key: string]: unknown;
}

export interface UserProperties {
  [key: string]: unknown;
}

export interface FeatureUsageProperties {
  feature: string;
  action: string;
  [key: string]: unknown;
}

export interface WalletCreationProperties {
  walletType: string;
  method: string;
  success: boolean;
  errorMessage?: string;
}

export interface WalletRecoveryProperties {
  walletType: string;
  method: string;
  success: boolean;
  errorMessage?: string;
}

export interface TransactionInitiatedProperties {
  transactionType: string;
  amount?: string;
  currency?: string;
}

export interface TransactionCompletedProperties {
  transactionType: string;
  success: boolean;
  errorMessage?: string;
}

export interface OfflineModeProperties {
  enabled: boolean;
}

export interface InvisibleWalletProperties {
  action: 'created' | 'used';
  success: boolean;
  errorMessage?: string;
}

export interface EducationEngagementProperties {
  contentType: 'video' | 'article';
  contentId: string;
  action: string;
}

export interface SettingsChangeProperties {
  settingCategory: string;
  settingName: string;
  newValue: unknown;
}

// Union type for all event properties
export type AnalyticsEventProperties =
  | PageViewProperties
  | CustomEventProperties
  | FeatureUsageProperties
  | WalletCreationProperties
  | WalletRecoveryProperties
  | TransactionInitiatedProperties
  | TransactionCompletedProperties
  | OfflineModeProperties
  | InvisibleWalletProperties
  | EducationEngagementProperties
  | SettingsChangeProperties;

// Analytics Event Types
export interface AnalyticsEvent {
  event: string;
  properties: AnalyticsEventProperties;
  userId?: string;
  timestamp: number;
  sessionId?: string;
}

// Error Report Interface
export interface ErrorReport {
  error: Error;
  context: {
    userId?: string;
    sessionId: string;
    userAgent: string;
    url: string;
    timestamp: number;
    componentStack?: string;
  } & ErrorContext;
  breadcrumbs: Array<{
    message: string;
    level: 'info' | 'warning' | 'error';
    timestamp: number;
    category?: string;
  }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Performance Metrics Interface
export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  url: string;
  timestamp: number;
}

// Transaction Analytics Interface
export interface TransactionAnalytics {
  transactionId: string;
  type: 'send' | 'receive' | 'swap' | 'payment';
  status: 'pending' | 'success' | 'failed';
  amount?: string;
  currency?: string;
  fee?: string;
  timestamp: number;
  errorMessage?: string;
  networkLatency?: number;
}

// User Behavior Events
export interface UserBehaviorEvent {
  event: 'page_view' | 'feature_used' | 'wallet_created' | 'wallet_recovered' | 'transaction_initiated' | 'transaction_completed' | 'offline_mode_enabled' | 'invisible_wallet_used';
  page?: string;
  feature?: string;
  properties: AnalyticsEventProperties;
  timestamp: number;
  sessionId: string;
}

// Privacy Settings Interface
export interface PrivacySettings {
  analyticsEnabled: boolean;
  errorReportingEnabled: boolean;
  performanceMonitoringEnabled: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
}

// Analytics Configuration
export interface AnalyticsConfig {
  posthogKey: string;
  posthogHost: string;
  sentryDsn: string;
  environment: 'development' | 'staging' | 'production';
  privacyMode: 'strict' | 'standard' | 'minimal';
}

// Session Information
export interface SessionInfo {
  sessionId: string;
  userId?: string;
  startTime: number;
  userAgent: string;
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
  };
}

// Breadcrumb Interface for Error Tracking
export interface Breadcrumb {
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: number;
  category: 'navigation' | 'http' | 'user' | 'ui' | 'stellar' | 'offline';
  data?: CustomEventProperties;
}

// Analytics Provider Context
export interface AnalyticsContextType {
  trackEvent: (event: string, properties?: CustomEventProperties) => void;
  trackError: (error: Error, context?: ErrorContext) => void;
  trackPerformance: (metrics: Partial<PerformanceMetrics>) => void;
  trackTransaction: (transaction: TransactionAnalytics) => void;
  setUser: (userId: string, properties?: UserProperties) => void;
  resetUser: () => void;
  isEnabled: boolean;
  privacySettings: PrivacySettings;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
}

// Event Categories for Organization
export enum EventCategory {
  NAVIGATION = 'navigation',
  FEATURE_USAGE = 'feature_usage',
  TRANSACTION = 'transaction',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  OFFLINE = 'offline',
  INVISIBLE_WALLET = 'invisible_wallet'
}

// Error Categories
export enum ErrorCategory {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  STELLAR = 'stellar',
  AUTHENTICATION = 'authentication',
  OFFLINE = 'offline',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// Performance Thresholds
export interface PerformanceThresholds {
  pageLoadTime: number; // milliseconds
  firstContentfulPaint: number; // milliseconds
  largestContentfulPaint: number; // milliseconds
  timeToInteractive: number; // milliseconds
  cumulativeLayoutShift: number; // score
}

// Analytics Event Names (Constants)
export const ANALYTICS_EVENTS = {
  // Navigation Events
  PAGE_VIEW: 'page_view',
  FEATURE_ACCESSED: 'feature_accessed',
  
  // Wallet Events
  WALLET_CREATED: 'wallet_created',
  WALLET_RECOVERED: 'wallet_recovered',
  WALLET_IMPORTED: 'wallet_imported',
  
  // Transaction Events
  TRANSACTION_INITIATED: 'transaction_initiated',
  TRANSACTION_COMPLETED: 'transaction_completed',
  TRANSACTION_FAILED: 'transaction_failed',
  TRANSACTION_CANCELLED: 'transaction_cancelled',
  
  // Feature Usage Events
  OFFLINE_MODE_ENABLED: 'offline_mode_enabled',
  OFFLINE_MODE_DISABLED: 'offline_mode_disabled',
  INVISIBLE_WALLET_CREATED: 'invisible_wallet_created',
  INVISIBLE_WALLET_USED: 'invisible_wallet_used',
  
  // Education Events
  EDUCATION_ARTICLE_VIEWED: 'education_article_viewed',
  EDUCATION_VIDEO_WATCHED: 'education_video_watched',
  
  // Settings Events
  SETTINGS_CHANGED: 'settings_changed',
  PRIVACY_SETTINGS_UPDATED: 'privacy_settings_updated',
  
  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  CRASH_REPORTED: 'crash_reported',
  
  // Performance Events
  PERFORMANCE_METRIC_RECORDED: 'performance_metric_recorded',
  SLOW_PAGE_LOAD: 'slow_page_load'
} as const;

// Error Event Names
export const ERROR_EVENTS = {
  JAVASCRIPT_ERROR: 'javascript_error',
  NETWORK_ERROR: 'network_error',
  STELLAR_ERROR: 'stellar_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  VALIDATION_ERROR: 'validation_error',
  OFFLINE_ERROR: 'offline_error',
  UNKNOWN_ERROR: 'unknown_error'
} as const;

// Performance Event Names
export const PERFORMANCE_EVENTS = {
  PAGE_LOAD_TIME: 'page_load_time',
  FIRST_CONTENTFUL_PAINT: 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT: 'largest_contentful_paint',
  TIME_TO_INTERACTIVE: 'time_to_interactive',
  CUMULATIVE_LAYOUT_SHIFT: 'cumulative_layout_shift',
  API_RESPONSE_TIME: 'api_response_time',
  TRANSACTION_CONFIRMATION_TIME: 'transaction_confirmation_time'
} as const;