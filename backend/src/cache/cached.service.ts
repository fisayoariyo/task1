import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

export interface CachedEntry<T> {
  value: T;
  softExpiresAt: number;
  hardExpiresAt: number;
}

@Injectable()
export class CachedService {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private cacheDisabled(): boolean {
    const v = (process.env.CACHE_DISABLED ?? '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }

  async wrap<T>(
    key: string,
    softTtlMs: number,
    hardTtlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (this.cacheDisabled()) {
      return fn();
    }

    const now = Date.now();
    const entry = await this.cache.get<CachedEntry<T>>(key);

    if (entry && now < entry.softExpiresAt) {
      return entry.value;
    }

    if (entry && now < entry.hardExpiresAt) {
      try {
        return await this.coalesce(key, () =>
          this.fetchAndStore(key, softTtlMs, hardTtlMs, fn),
        );
      } catch {
        return entry.value;
      }
    }

    return this.coalesce(key, () =>
      this.fetchAndStore(key, softTtlMs, hardTtlMs, fn),
    );
  }

  private coalesce<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const promise = factory().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  private async fetchAndStore<T>(
    key: string,
    softTtlMs: number,
    hardTtlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const value = await fn();
    const now = Date.now();
    const entry: CachedEntry<T> = {
      value,
      softExpiresAt: now + softTtlMs,
      hardExpiresAt: now + hardTtlMs,
    };
    await this.cache.set(key, entry, hardTtlMs);
    return value;
  }
}
