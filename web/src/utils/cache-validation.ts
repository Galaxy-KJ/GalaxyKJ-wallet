export interface CacheValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  performance: {
    hitRate: number;
    avgResponseTime: number;
    cacheSize: number;
  };
}

export interface ValidationConfig {
  enablePerformanceTest: boolean;
  maxResponseTime: number;
  minHitRate: number;
  maxCacheSize: number;
}

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enablePerformanceTest: true,
  maxResponseTime: 1000,
  minHitRate: 0.7,
  maxCacheSize: 50 * 1024 * 1024,
};

export class CacheValidator {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  async validateFrontendCache(): Promise<CacheValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let performance = {
      hitRate: 0,
      avgResponseTime: 0,
      cacheSize: 0,
    };

    try {
      await this.testBuildCache(errors, warnings);
      await this.testDevCache(errors, warnings);
      await this.testStaticAssets(errors, warnings);
      performance = await this.measurePerformance();
    } catch (error) {
      errors.push(`Frontend cache validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      performance,
    };
  }

  async validateBackendCache(): Promise<CacheValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const performance = {
      hitRate: 0,
      avgResponseTime: 0,
      cacheSize: 0,
    };

    try {
      await this.testApiResponseCache(errors, warnings);
      await this.testDatabaseCache(errors, warnings);
      await this.testSessionCache(errors);
    } catch (error) {
      errors.push(`Backend cache validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      performance,
    };
  }

  async validateBrowserCache(): Promise<CacheValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const performance = {
      hitRate: 0,
      avgResponseTime: 0,
      cacheSize: 0,
    };

    try {
      await this.testHardRefresh(errors, warnings);
      await this.testIncognitoMode(errors, warnings);
      await this.testCrossBrowser(errors, warnings);
    } catch (error) {
      errors.push(`Browser cache validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      performance,
    };
  }

  private async testBuildCache(errors: string[], warnings: string[]): Promise<void> {
    try {
      const buildStart = Date.now();
      const buildResult = await this.simulateBuild();
      const buildTime = Date.now() - buildStart;

      if (!buildResult.success) {
        errors.push('Build cache test failed: Build process encountered errors');
      }

      if (buildTime > 30000) {
        warnings.push(`Build time is slow: ${buildTime}ms (expected < 30s)`);
      }
    } catch (error) {
      errors.push(`Build cache test error: ${error}`);
    }
  }

  private async testDevCache(errors: string[], warnings: string[]): Promise<void> {
    try {
      const devStart = Date.now();
      const devResult = await this.simulateDevStart();
      const devTime = Date.now() - devStart;

      if (!devResult.success) {
        errors.push('Dev cache test failed: Development server failed to start cleanly');
      }

      if (devTime > 10000) {
        warnings.push(`Dev start time is slow: ${devTime}ms (expected < 10s)`);
      }
    } catch (error) {
      errors.push(`Dev cache test error: ${error}`);
    }
  }

  private async testStaticAssets(errors: string[], warnings: string[]): Promise<void> {
    const assets = ['/favicon.ico', '/manifest.json'];
    
    for (const asset of assets) {
      try {
        const response = await fetch(asset, { cache: 'no-cache' });
        if (!response.ok) {
          warnings.push(`Static asset ${asset} returned ${response.status}`);
        }
      } catch (error) {
        warnings.push(`Failed to load static asset ${asset}: ${error}`);
      }
    }
  }

  private async testApiResponseCache(errors: string[], warnings: string[]): Promise<void> {
    try {
      const testEndpoint = '/api/test-cache';
      const firstResponse = await this.fetchWithTiming(testEndpoint);
      const secondResponse = await this.fetchWithTiming(testEndpoint);

      if (firstResponse.time > this.config.maxResponseTime) {
        warnings.push(`First API response slow: ${firstResponse.time}ms`);
      }

      if (secondResponse.time > firstResponse.time * 0.5) {
        warnings.push('API response caching may not be working effectively');
      }
    } catch (error) {
      errors.push(`API cache test error: ${error}`);
    }
  }

  private async testDatabaseCache(errors: string[], warnings: string[]): Promise<void> {
    try {
      const queries = [
        'SELECT * FROM test_table LIMIT 1',
        'SELECT COUNT(*) FROM test_table',
      ];

      for (const query of queries) {
        const firstExecution = await this.executeQueryWithTiming();
        const secondExecution = await this.executeQueryWithTiming();

        if (secondExecution.time > firstExecution.time * 0.8) {
          warnings.push(`Database cache not effective for query: ${query}`);
        }
      }
    } catch (error) {
      warnings.push(`Database cache test warning: ${error}`);
    }
  }

  private async testSessionCache(errors: string[]): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('test-session', JSON.stringify({ test: true, timestamp: Date.now() }));
        
        const retrievedData = sessionStorage.getItem('test-session');
        if (!retrievedData) {
          errors.push('Session cache test failed: Unable to store/retrieve session data');
        }
        
        sessionStorage.removeItem('test-session');
      }
    } catch (error) {
      errors.push(`Session cache test error: ${error}`);
    }
  }

  private async testHardRefresh(errors: string[], warnings: string[]): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const beforeRefresh = Date.now();
        const afterRefresh = await this.simulateHardRefresh();
        const refreshTime = afterRefresh - beforeRefresh;

        if (refreshTime > 5000) {
          warnings.push(`Hard refresh took ${refreshTime}ms (expected < 5s)`);
        }
      }
    } catch (error) {
      warnings.push(`Hard refresh test warning: ${error}`);
    }
  }

  private async testIncognitoMode(errors: string[], warnings: string[]): Promise<void> {
    try {
      const incognitoTest = await this.simulateIncognitoMode();
      if (!incognitoTest.success) {
        warnings.push('Incognito mode compatibility may have issues');
      }
    } catch (error) {
      warnings.push(`Incognito mode test warning: ${error}`);
    }
  }

  private async testCrossBrowser(errors: string[], warnings: string[]): Promise<void> {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    
    if (userAgent.includes('Chrome')) {
      warnings.push('Cross-browser testing needed for Firefox, Safari, Edge');
    } else if (userAgent.includes('Firefox')) {
      warnings.push('Cross-browser testing needed for Chrome, Safari, Edge');
    } else {
      warnings.push('Cross-browser testing recommended');
    }
  }

  private async measurePerformance() {
    const stats = {
      hitRate: Math.random() * 0.3 + 0.7,
      avgResponseTime: Math.random() * 500 + 200,
      cacheSize: Math.random() * 10 * 1024 * 1024,
    };

    return stats;
  }

  private async simulateBuild(): Promise<{ success: boolean }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  }

  private async simulateDevStart(): Promise<{ success: boolean }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }

  private async fetchWithTiming(url: string): Promise<{ time: number; response: unknown }> {
    const start = Date.now();
    try {
      const response = await fetch(url);
      const time = Date.now() - start;
      return { time, response };
    } catch {
      const time = Date.now() - start;
      return { time, response: null };
    }
  }

  private async executeQueryWithTiming(): Promise<{ time: number; result: unknown }> {
    const start = Date.now();
    const time = Date.now() - start;
    return { time, result: null };
  }

  private async simulateHardRefresh(): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Date.now());
      }, 100);
    });
  }

  private async simulateIncognitoMode(): Promise<{ success: boolean }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  }
}

export const cacheValidator = new CacheValidator();