import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CachedService } from '../cache/cached.service';
import { MenuDto, RestaurantCard, RestaurantSource } from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;
  let source: jest.Mocked<
    Pick<RestaurantSource, 'listRestaurants' | 'getMenu'>
  >;
  let cachedWrap: jest.Mock;

  beforeEach(async () => {
    source = {
      listRestaurants: jest.fn(),
      getMenu: jest.fn(),
    };
    cachedWrap = jest.fn(
      async (_key: string, _soft: number, _hard: number, fn: () => Promise<unknown>) =>
        fn(),
    );

    const module = await Test.createTestingModule({
      controllers: [RestaurantsController],
      providers: [
        RestaurantsService,
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

    controller = module.get(RestaurantsController);
  });

  describe('GET /restaurants', () => {
    it('lists restaurants with rounded lat/lng in cache key', async () => {
      const cards: RestaurantCard[] = [
        {
          id: 'r1',
          name: 'Test',
          cuisines: 'Indian',
          rating: 4.2,
          etaMins: 30,
          costForTwo: 400,
          imageUrl: 'https://example.com/a.jpg',
        },
      ];
      source.listRestaurants.mockResolvedValue(cards);

      const result = await controller.list('19.0764', '72.8777', '0');

      expect(result).toEqual(cards);
      expect(source.listRestaurants).toHaveBeenCalledWith(19.076, 72.878, 0);
      expect(cachedWrap).toHaveBeenCalledWith(
        'rest:19.076:72.878:0',
        300_000,
        900_000,
        expect.any(Function),
      );
    });

    it('throws when lat/lng are missing or invalid', async () => {
      await expect(
        controller.list(undefined as unknown as string, '72.877'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.list('19.076', undefined as unknown as string),
      ).rejects.toThrow(BadRequestException);
      await expect(controller.list('bad', '72.877')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('defaults offset to 0 when omitted', async () => {
      source.listRestaurants.mockResolvedValue([]);

      await controller.list('19.076', '72.877');

      expect(source.listRestaurants).toHaveBeenCalledWith(19.076, 72.877, 0);
      expect(cachedWrap).toHaveBeenCalledWith(
        'rest:19.076:72.877:0',
        300_000,
        900_000,
        expect.any(Function),
      );
    });
  });

  describe('GET /restaurants/:id/menu', () => {
    it('throws when lat/lng are missing or invalid', async () => {
      await expect(
        controller.menu('r1', undefined as unknown as string, '72.877'),
      ).rejects.toThrow(BadRequestException);
      await expect(controller.menu('r1', '19.076', 'xyz')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns menu with cache key menu:{id}', async () => {
      const menu: MenuDto = {
        restaurantId: 'r1',
        restaurantName: 'Test',
        categories: [{ name: 'Main', items: [] }],
      };
      source.getMenu.mockResolvedValue(menu);

      const result = await controller.menu('r1', '19.076', '72.877');

      expect(result).toEqual(menu);
      expect(source.getMenu).toHaveBeenCalledWith('r1', 19.076, 72.877);
      expect(cachedWrap).toHaveBeenCalledWith(
        'menu:r1',
        600_000,
        1_800_000,
        expect.any(Function),
      );
    });
  });
});
