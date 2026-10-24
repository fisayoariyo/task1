import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './cache/cache.module';
import { HealthController } from './health.controller';
import { PlacesModule } from './places/places.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { SourceModule } from './source/source.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    SourceModule,
    CacheModule,
    PlacesModule,
    RestaurantsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
