import { HttpModule, HttpService } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockSource } from './mock.source';
import { RestaurantSource } from './restaurant-source';
import { SOURCE } from './source.tokens';
import { SwiggySource } from './swiggy.source';

const DEFAULT_SWIGGY_BASE_URL = 'https://www.swiggy.com/dapi';

function createSource(
  http: HttpService,
  config: ConfigService,
): RestaurantSource {
  const dataSource = (config.get<string>('DATA_SOURCE') ?? 'mock').toLowerCase();
  if (dataSource === 'swiggy') {
    const baseUrl =
      config.get<string>('SWIGGY_BASE_URL') ?? DEFAULT_SWIGGY_BASE_URL;
    return new SwiggySource(http, baseUrl);
  }
  return new MockSource();
}

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 4000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://www.swiggy.com/',
        Origin: 'https://www.swiggy.com',
      },
    }),
  ],
  providers: [
    {
      provide: SOURCE,
      useFactory: (http: HttpService, config: ConfigService) =>
        createSource(http, config),
      inject: [HttpService, ConfigService],
    },
  ],
  exports: [SOURCE],
})
export class SourceModule {}
