import { Global, Module } from '@nestjs/common';
import { MockSource } from './mock.source';
import { RestaurantSource } from './restaurant-source';
import { SOURCE } from './source.tokens';

function createSource(): RestaurantSource {
  const dataSource = (process.env.DATA_SOURCE ?? 'mock').toLowerCase();
  if (dataSource === 'swiggy') {
    throw new Error(
      'SwiggySource is not implemented yet; set DATA_SOURCE=mock',
    );
  }
  return new MockSource();
}

@Global()
@Module({
  providers: [
    {
      provide: SOURCE,
      useFactory: () => createSource(),
    },
  ],
  exports: [SOURCE],
})
export class SourceModule {}
