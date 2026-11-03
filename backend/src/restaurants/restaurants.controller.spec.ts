import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CachedService } from '../cache/cached.service';
import {
  MenuDto,
  RestaurantListPage,
  RestaurantSource,
  RestaurantSuggestResult,
} from '../source/restaurant-source';
import { SOURCE } from '../source/source.tokens';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;
  let source: jest.Mocked<
    Pick<
      RestaurantSource,
      | 'listRestaurants'
      | 'getMenu'
      | 'listFoodCategories'
      | 'searchRestaurants'
      | 'suggestRestaurants'
    >
  >;
  let cachedWrap: jest.Mock;

  beforeEach(async () => {
    source = {
      listRestaurants: jest.fn(),
      getMenu: jest.fn(),
      listFoodCategories: jest.fn(),
      searchRestaurants: jest.fn(),
      suggestRestaurants: jest.fn(),
    };
    cachedWrap = jest.fn(
      async (
        _key: string,
        _soft: number,
        _hard: number,
        fn: () => Promise<unknown>,
      ) => fn(),
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
      const page: RestaurantListPage = {
        restaurants: [
          {
            id: 'r1',
            name: 'Test',
            cuisines: 'Indian',
            rating: 4.2,
            etaMins: 30,
            costForTwo: 400,
            imageUrl: 'https://example.com/a.jpg',
          },
        ],
        nextOffset: 'CURSOR1',
        widgetOffset: { k: '9' },
        hasMore: true,
      };
      source.listRestaurants.mockResolvedValue(page);

      const result = await controller.list('19.0764', '72.8777');

      expect(result).toEqual(page);
      expect(source.listRestaurants).toHaveBeenCalledWith(
        19.076,
        72.878,
        undefined,
      );
      expect(cachedWrap).toHaveBeenCalledWith(
        'rest:19.076:72.878:0',
        300_000,
        900_000,
        expect.any(Function),
      );
    });

    it('passes nextOffset cursor through to the source', async () => {
      const page: RestaurantListPage = {
        restaurants: [],
        nextOffset: null,
        widgetOffset: null,
        hasMore: false,
      };
      source.listRestaurants.mockResolvedValue(page);

      await controller.list(
        '19.076',
        '72.877',
        'CURSOR1',
        JSON.stringify({ k: '9' }),
      );

      expect(source.listRestaurants).toHaveBeenCalledWith(19.076, 72.877, {
        nextOffset: 'CURSOR1',
        widgetOffset: { k: '9' },
      });
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
  });

  describe('GET /restaurants/search', () => {
    it('searches with rounded lat/lng and query', async () => {
      const payload = {
        query: 'rolls',
        restaurants: [
          {
            id: '42885',
            name: 'Rolls Mania',
            cuisines: 'Rolls',
            rating: 4.3,
            etaMins: 25,
            costForTwo: 300,
            imageUrl: 'https://example.com/r.jpg',
          },
        ],
      };
      source.searchRestaurants.mockResolvedValue(payload);
      const result = await controller.search('19.0764', '72.8777', 'rolls');
      expect(result).toEqual(payload);
      expect(source.searchRestaurants).toHaveBeenCalledWith(
        19.076,
        72.878,
        'rolls',
      );
    });

    it('rejects short queries', async () => {
      await expect(
        controller.search('19.076', '72.877', 'pi'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /restaurants/suggest', () => {
    it('suggests with rounded lat/lng and query', async () => {
      const payload: RestaurantSuggestResult = {
        query: 'piz',
        items: [
          { kind: 'dish', text: 'Pizza' },
          { kind: 'restaurant', text: 'Pizza Hut', restaurantId: '1' },
        ],
      };
      source.suggestRestaurants.mockResolvedValue(payload);
      const result = await controller.suggest('19.0764', '72.8777', 'piz');
      expect(result).toEqual(payload);
      expect(source.suggestRestaurants).toHaveBeenCalledWith(
        19.076,
        72.878,
        'piz',
      );
    });
  });

  describe('GET /restaurants/:id/menu', () => {
    it('throws when lat/lng are missing or invalid', async () => {
      await expect(
        controller.menu('1', undefined as unknown as string, '72.877'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns menu from source', async () => {
      const menu: MenuDto = {
        restaurantId: '1',
        restaurantName: 'Test',
        categories: [],
      };
      source.getMenu.mockResolvedValue(menu);
      const result = await controller.menu('1', '19.076', '72.877');
      expect(result).toEqual(menu);
    });
  });
});
