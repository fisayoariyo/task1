import { HttpModule, HttpService } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { MockSource } from './mock.source';
import { RestaurantSource } from './restaurant-source';
import { SOURCE } from './source.tokens';
import { SwiggySource } from './swiggy.source';

const DEFAULT_SWIGGY_BASE_URL = 'https://www.swiggy.com/dapi';

function createSource(http: HttpService): RestaurantSource {
  const dataSource = (process.env.DATA_SOURCE ?? 'mock').toLowerCase();
  if (dataSource === 'swiggy') {
    const baseUrl = process.env.SWIGGY_BASE_URL ?? DEFAULT_SWIGGY_BASE_URL;
    return new SwiggySource(http, baseUrl);
  }
  return new MockSource();
}

@Global()
@Module({
  imports: [HttpModule.register({ timeout: 4000 })],
  providers: [
    {
      provide: SOURCE,
      useFactory: (http: HttpService) => createSource(http),
      inject: [HttpService],
    },
  ],
  exports: [SOURCE],
})
export class SourceModule {}
