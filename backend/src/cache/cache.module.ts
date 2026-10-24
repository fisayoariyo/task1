import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { createKeyv } from '@keyv/redis';
import Keyv from 'keyv';
import { CachedService } from './cached.service';

function cacheStores(): Keyv[] {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return [createKeyv(redisUrl)];
  }
  return [new Keyv()];
}

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: cacheStores(),
      }),
    }),
  ],
  providers: [CachedService],
  exports: [CachedService],
})
export class CacheModule {}
