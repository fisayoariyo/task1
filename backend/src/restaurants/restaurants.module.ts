import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { SourceModule } from '../source/source.module';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [CacheModule, SourceModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
})
export class RestaurantsModule {}
