import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { SourceModule } from '../source/source.module';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

@Module({
  imports: [CacheModule, SourceModule],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
