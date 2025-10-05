import { CacheManager } from '@/utils/cache-manager';
import { CacheValidator } from '@/utils/cache-validation';

describe('Cache Manager', () => {
  let cache: CacheManager<string>;

  beforeEach(() => {
    cache = new CacheManager({
      ttl: 1000,
      maxSize: 10,
      enablePersistence: false,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should store and retrieve data', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for expired data', async () => {
    cache.set('key1', 'value1', 100);
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });

  it('should respect max size limit', () => {
    for (let i = 0; i < 15; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    expect(cache.getStats().size).toBeLessThanOrEqual(10);
  });

  it('should calculate hit rate correctly', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key1');
    cache.get('nonexistent');
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.67, 1);
  });

  it('should invalidate by pattern', () => {
    cache.set('user:1', 'userData1');
    cache.set('user:2', 'userData2');
    cache.set('post:1', 'postData1');
    
    const invalidated = cache.invalidatePattern(/^user:/);
    expect(invalidated).toBe(2);
    expect(cache.has('user:1')).toBe(false);
    expect(cache.has('post:1')).toBe(true);
  });

  it('should handle getOrSet correctly', async () => {
    const fetcher = jest.fn().mockResolvedValue('fetchedValue');
    
    const result1 = await cache.getOrSet('key1', fetcher);
    const result2 = await cache.getOrSet('key1', fetcher);
    
    expect(result1).toBe('fetchedValue');
    expect(result2).toBe('fetchedValue');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('Cache Validator', () => {
  let validator: CacheValidator;

  beforeEach(() => {
    validator = new CacheValidator();
  });

  it('should validate frontend cache', async () => {
    const result = await validator.validateFrontendCache();
    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('performance');
  });

  it('should validate backend cache', async () => {
    const result = await validator.validateBackendCache();
    expect(result.errors).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it('should validate browser cache', async () => {
    const result = await validator.validateBrowserCache();
    expect(typeof result.isValid).toBe('boolean');
  });
});

describe('Cache Performance', () => {
  it('should maintain performance under load', async () => {
    const cache = new CacheManager({ maxSize: 1000 });
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    
    for (let i = 0; i < 1000; i++) {
      cache.get(`key${i}`);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(totalTime).toBeLessThan(1000);
    
    const stats = cache.getStats();
    expect(stats.hitRate).toBeGreaterThan(0.95);
    
    cache.destroy();
  });

  it('should handle concurrent operations', async () => {
    const cache = new CacheManager();
    
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        cache.getOrSet(`concurrent${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return `value${i}`;
        })
      );
    }
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(100);
    
    results.forEach((result, index) => {
      expect(result).toBe(`value${index}`);
    });
    
    cache.destroy();
  });
});