import { Test } from '@nestjs/testing';
import { CachedService } from './cached.service';
import { CacheModule } from './cache.module';

describe('CachedService', () => {
  let service: CachedService;

  beforeEach(async () => {
    delete process.env.REDIS_URL;
    const module = await Test.createTestingModule({
      imports: [CacheModule],
    }).compile();
    service = module.get(CachedService);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.CACHE_DISABLED;
  });

  it('bypasses cache when CACHE_DISABLED=true', async () => {
    process.env.CACHE_DISABLED = 'true';
    const fn = jest.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
    const first = await service.wrap('bypass-key', 60_000, 120_000, fn);
    const second = await service.wrap('bypass-key', 60_000, 120_000, fn);
    expect(first).toBe('a');
    expect(second).toBe('b');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns cached value on hit without calling fn again', async () => {
    const fn = jest.fn().mockResolvedValue('fresh');
    const first = await service.wrap('hit-key', 60_000, 120_000, fn);
    const second = await service.wrap('hit-key', 60_000, 120_000, fn);

    expect(first).toBe('fresh');
    expect(second).toBe('fresh');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent callers into one fn invocation', async () => {
    const fn = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'shared';
    });

    const [a, b] = await Promise.all([
      service.wrap('coalesce-key', 60_000, 120_000, fn),
      service.wrap('coalesce-key', 60_000, 120_000, fn),
    ]);

    expect(a).toBe('shared');
    expect(b).toBe('shared');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('serves stale value when refresh fails after soft TTL but hard TTL is valid', async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn()
      .mockResolvedValueOnce('stale-good')
      .mockRejectedValueOnce(new Error('upstream down'));

    await service.wrap('stale-key', 1_000, 10_000, fn);
    jest.advanceTimersByTime(1_500);

    const result = await service.wrap('stale-key', 1_000, 10_000, fn);

    expect(result).toBe('stale-good');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rethrows when hard TTL expired and fn fails', async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn()
      .mockResolvedValueOnce('old')
      .mockRejectedValueOnce(new Error('must propagate'));

    await service.wrap('hard-key', 500, 1_000, fn);
    jest.advanceTimersByTime(1_100);

    await expect(service.wrap('hard-key', 500, 1_000, fn)).rejects.toThrow(
      'must propagate',
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
