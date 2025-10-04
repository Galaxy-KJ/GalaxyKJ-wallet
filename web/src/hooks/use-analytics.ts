/**
 * Analytics Hook for React Components
 * Provides analytics tracking functionality to React components
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  trackAnalyticsEvent, 
  trackAnalyticsError, 
  trackAnalyticsPerformance,
  trackAnalyticsTransaction,
  setAnalyticsUser,
  resetAnalyticsUser,
  getAnalyticsPrivacySettings,
  updateAnalyticsPrivacySettings,
  isAnalyticsEnabled
} from '@/lib/analytics';
import { 
  ANALYTICS_EVENTS,
  CustomEventProperties,
  EducationEngagementProperties,
  ErrorContext,
  FeatureUsageProperties,
  InvisibleWalletProperties,
  OfflineModeProperties,
  PageViewProperties,
  PerformanceMetrics,
  PrivacySettings,
  SettingsChangeProperties,
  TransactionAnalytics,
  TransactionCompletedProperties,
  TransactionInitiatedProperties,
  UserProperties,
  WalletCreationProperties,
  WalletRecoveryProperties
} from '@/types/analytics';

/**
 * Analytics hook for React components
 * @returns Analytics functions and state
 */
export function useAnalytics() {
  const router = useRouter();
  const lastPageRef = useRef<string>('');

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (lastPageRef.current !== url) {
        const properties: PageViewProperties = {
          page: url,
          fromPage: lastPageRef.current,
          timestamp: Date.now()
        };
        trackAnalyticsEvent(ANALYTICS_EVENTS.PAGE_VIEW, properties);
        lastPageRef.current = url;
      }
    };

    // Track initial page view
    if (typeof window !== 'undefined') {
      handleRouteChange(window.location.pathname);
    }

    // In App Router, we need to use a different approach for route change tracking
    // For now, we'll just track the initial page view
    // TODO: Implement proper route change tracking for App Router
  }, [router]);

  /**
   * Track a custom event
   */
  const trackEvent = useCallback((event: string, properties?: CustomEventProperties) => {
    trackAnalyticsEvent(event, properties);
  }, []);

  /**
   * Track an error
   */
  const trackError = useCallback((error: Error, context?: ErrorContext) => {
    trackAnalyticsError(error, context);
  }, []);

  /**
   * Track performance metrics
   */
  const trackPerformance = useCallback((metrics: Partial<PerformanceMetrics>) => {
    trackAnalyticsPerformance(metrics);
  }, []);

  /**
   * Track transaction analytics
   */
  const trackTransaction = useCallback((transaction: TransactionAnalytics) => {
    trackAnalyticsTransaction(transaction);
  }, []);

  /**
   * Set user identity
   */
  const setUser = useCallback((userId: string, properties?: UserProperties) => {
    setAnalyticsUser(userId, properties);
  }, []);

  /**
   * Reset user identity
   */
  const resetUser = useCallback(() => {
    resetAnalyticsUser();
  }, []);

  /**
   * Get privacy settings
   */
  const getPrivacySettings = useCallback(() => {
    return getAnalyticsPrivacySettings();
  }, []);

  /**
   * Update privacy settings
   */
  const updatePrivacySettings = useCallback((settings: Partial<PrivacySettings>) => {
    updateAnalyticsPrivacySettings(settings);
  }, []);

  /**
   * Check if analytics is enabled
   */
  const isEnabled = useCallback(() => {
    return isAnalyticsEnabled();
  }, []);

  /**
   * Track feature usage
   */
  const trackFeatureUsage = useCallback((feature: string, action: string, properties?: CustomEventProperties) => {
    const eventProperties: FeatureUsageProperties = {
      ...(properties || {}),
      feature,
      action
    };
    trackAnalyticsEvent(ANALYTICS_EVENTS.FEATURE_ACCESSED, eventProperties);
  }, []);

  /**
   * Track wallet creation
   */
  const trackWalletCreation = useCallback((walletType: string, method: string, success: boolean, errorMessage?: string) => {
    const properties: WalletCreationProperties = {
      walletType,
      method,
      success,
      errorMessage
    };
    trackAnalyticsEvent(ANALYTICS_EVENTS.WALLET_CREATED, properties);
  }, []);

  /**
   * Track wallet recovery
   */
  const trackWalletRecovery = useCallback((walletType: string, method: string, success: boolean, errorMessage?: string) => {
    const properties: WalletRecoveryProperties = {
      walletType,
      method,
      success,
      errorMessage
    };
    trackAnalyticsEvent(ANALYTICS_EVENTS.WALLET_RECOVERED, properties);
  }, []);

  /**
   * Track transaction initiation
   */
  const trackTransactionInitiated = useCallback((transactionType: string, amount?: string, currency?: string) => {
    const properties: TransactionInitiatedProperties = {
      transactionType,
      amount,
      currency
    };
    trackAnalyticsEvent(ANALYTICS_EVENTS.TRANSACTION_INITIATED, properties);
  }, []);

  /**
   * Track transaction completion
   */
  const trackTransactionCompleted = useCallback((transactionType: string, success: boolean, errorMessage?: string) => {
    const event = success ? ANALYTICS_EVENTS.TRANSACTION_COMPLETED : ANALYTICS_EVENTS.TRANSACTION_FAILED;
    const properties: TransactionCompletedProperties = {
      transactionType,
      success,
      errorMessage
    };
    trackAnalyticsEvent(event, properties);
  }, []);

  /**
   * Track offline mode usage
   */
  const trackOfflineMode = useCallback((enabled: boolean) => {
    const event = enabled ? ANALYTICS_EVENTS.OFFLINE_MODE_ENABLED : ANALYTICS_EVENTS.OFFLINE_MODE_DISABLED;
    const properties: OfflineModeProperties = {
      enabled
    };
    trackAnalyticsEvent(event, properties);
  }, []);

  /**
   * Track invisible wallet usage
   */
  const trackInvisibleWallet = useCallback((action: 'created' | 'used', success: boolean, errorMessage?: string) => {
    const event = action === 'created' ? ANALYTICS_EVENTS.INVISIBLE_WALLET_CREATED : ANALYTICS_EVENTS.INVISIBLE_WALLET_USED;
    const properties: InvisibleWalletProperties = {
      action,
      success,
      errorMessage
    };
    trackAnalyticsEvent(event, properties);
  }, []);

  /**
   * Track education content engagement
   */
  const trackEducationEngagement = useCallback((contentType: 'video' | 'article', contentId: string, action: string) => {
    const event = contentType === 'video' ? ANALYTICS_EVENTS.EDUCATION_VIDEO_WATCHED : ANALYTICS_EVENTS.EDUCATION_ARTICLE_VIEWED;
    const properties: EducationEngagementProperties = {
      contentType,
      contentId,
      action
    };
    trackAnalyticsEvent(event, properties);
  }, []);

  /**
   * Track settings changes
   */
  const trackSettingsChange = useCallback((settingCategory: string, settingName: string, newValue: unknown) => {
    const event = settingCategory === 'privacy' ? ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED : ANALYTICS_EVENTS.SETTINGS_CHANGED;
    const properties: SettingsChangeProperties = {
      settingCategory,
      settingName,
      newValue
    };
    trackAnalyticsEvent(event, properties);
  }, []);

  return {
    // Core tracking functions
    trackEvent,
    trackError,
    trackPerformance,
    trackTransaction,
    
    // User management
    setUser,
    resetUser,
    
    // Privacy management
    getPrivacySettings,
    updatePrivacySettings,
    isEnabled,
    
    // Specific tracking functions
    trackFeatureUsage,
    trackWalletCreation,
    trackWalletRecovery,
    trackTransactionInitiated,
    trackTransactionCompleted,
    trackOfflineMode,
    trackInvisibleWallet,
    trackEducationEngagement,
    trackSettingsChange
  };
}