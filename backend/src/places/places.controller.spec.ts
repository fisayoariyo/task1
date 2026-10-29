import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CachedService } from '../cache/cached.service';
import { RestaurantSource } from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

describe('PlacesController', () => {
  let controller: PlacesController;
  let source: jest.Mocked<Pick<RestaurantSource, 'autocomplete' | 'geocode'>>;
  let cachedWrap: jest.Mock;

  beforeEach(async () => {
    source = {
      autocomplete: jest.fn(),
      geocode: jest.fn(),
    };
    cachedWrap = jest.fn(
      async (_key: string, _soft: number, _hard: number, fn: () => Promise<unknown>) =>
        fn(),
    );

    const module = await Test.createTestingModule({
      controllers: [PlacesController],
      providers: [
        PlacesService,
        { provide: SOURCE, useValue: source },
        {
          provide: CachedService,
          useValue: { wrap: cachedWrap },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PlacesController);
  });

  describe('GET /places/autocomplete', () => {
    it('returns suggestions from source via cache wrap', async () => {
      const suggestions = [{ placeId: 'p1', description: 'Mumbai' }];
      source.autocomplete.mockResolvedValue(suggestions);

      const result = await controller.autocomplete('mumbai');

      expect(result).toEqual(suggestions);
      expect(source.autocomplete).toHaveBeenCalledWith('mumbai');
      expect(cachedWrap).toHaveBeenCalledWith(
        'ac:v3:mumbai',
        86_400_000,
        86_400_000,
        expect.any(Function),
      );
    });

    it('rejects input shorter than 3 characters with 400', async () => {
      await expect(controller.autocomplete('ab')).rejects.toThrow(
        BadRequestException,
      );
      expect(source.autocomplete).not.toHaveBeenCalled();
      expect(cachedWrap).not.toHaveBeenCalled();
    });
  });

  describe('GET /places/geocode', () => {
    it('returns lat/lng from source via cache wrap', async () => {
      const coords = { lat: 19.07, lng: 72.87 };
      source.geocode.mockResolvedValue(coords);

      const result = await controller.geocode('mock-place-1');

      expect(result).toEqual(coords);
      expect(source.geocode).toHaveBeenCalledWith('mock-place-1');
      expect(cachedWrap).toHaveBeenCalledWith(
        'geo:mock-place-1',
        2_592_000_000,
        2_592_000_000,
        expect.any(Function),
      );
    });
  });
});
