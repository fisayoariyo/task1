import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { HealthController } from './health.controller';
import { PlacesModule } from './places/places.module';
import { SourceModule } from './source/source.module';

@Module({
  imports: [SourceModule, CacheModule, PlacesModule],
  controllers: [HealthController],
})
export class AppModule {}
