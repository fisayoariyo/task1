import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './cache/cache.module';
import { HealthController } from './health.controller';
import { PlacesModule } from './places/places.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { SourceModule } from './source/source.module';

@Module({
  imports: [
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
