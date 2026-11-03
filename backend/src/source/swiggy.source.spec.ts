import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { SwiggySource } from './swiggy.source';

const BASE = 'https://www.swiggy.com/dapi';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.swiggy.com/',
  Origin: 'https://www.swiggy.com',
};

function axiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as never };
}

describe('SwiggySource', () => {
  let http: jest.Mocked<Pick<HttpService, 'get' | 'post'>>;
  let source: SwiggySource;

  beforeEach(() => {
    http = { get: jest.fn(), post: jest.fn() };
    source = new SwiggySource(http as unknown as HttpService, BASE);
  });

  it('autocomplete POSTs place-autocomplete with input and types[]', async () => {
    http.post.mockReturnValue(
      of(
        axiosResponse({
          data: [
            {
              place_id: 'pid-1',
              description: 'Mumbai, Maharashtra, India',
            },
          ],
        }),
      ),
    );
    const result = await source.autocomplete('mumbai');
    expect(http.post).toHaveBeenCalledWith(
      `${BASE}/misc/place-autocomplete`,
      { input: 'mumbai', types: [] },
      {
        timeout: 8000,
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/json',
        },
      },
    );
    expect(result).toEqual([
      { placeId: 'pid-1', description: 'Mumbai, Maharashtra, India' },
    ]);
  });

  it('geocode POSTs address-recommend with place_id', async () => {
    http.post.mockReturnValue(
      of(
        axiosResponse({
          data: [{ geometry: { location: { lat: 19.07, lng: 72.87 } } }],
        }),
      ),
    );
    const geo = await source.geocode('pid-1');
    expect(http.post).toHaveBeenCalledWith(
      `${BASE}/misc/address-recommend`,
      { place_id: 'pid-1' },
      {
        timeout: 8000,
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/json',
        },
      },
    );
    expect(geo).toEqual({ lat: 19.07, lng: 72.87 });
  });

  it('listRestaurants first page calls list/v5 homepage listing', async () => {
    http.get.mockReturnValue(
      of(
        axiosResponse({
          data: {
            pageOffset: {
              nextOffset: 'CURSOR1',
              widgetOffset: { collectionV5RestaurantListWidget_SimRestoRelevance_food_seo: '9' },
            },
            cards: [
              {
                card: {
                  card: {
                    info: {
                      id: '97272',
                      name: 'Ramsar Bakery',
                      cloudinaryImageId: 'img',
                      cuisines: ['Bakery'],
                      avgRating: '4.0',
                      costForTwo: 15000,
                      sla: { deliveryTime: 27 },
                    },
                  },
                },
              },
            ],
          },
        }),
      ),
    );
    const page = await source.listRestaurants(19.076, 72.877);
    expect(http.get).toHaveBeenCalledWith(`${BASE}/restaurants/list/v5`, {
      params: {
        lat: 19.076,
        lng: 72.877,
        'is-seo-homepage-enabled': 'true',
        page_type: 'DESKTOP_WEB_LISTING',
      },
      timeout: 8000,
      headers: BROWSER_HEADERS,
    });
    expect(page.restaurants[0].id).toBe('97272');
    expect(page.restaurants[0].costForTwo).toBe(150);
    expect(page.nextOffset).toBe('CURSOR1');
    expect(page.hasMore).toBe(true);
  });

  it('listRestaurants next page posts mapi list/update with cursor', async () => {
    http.post.mockReturnValue(
      of(
        axiosResponse({
          data: {
            pageOffset: { nextOffset: 'CURSOR2', widgetOffset: {} },
            cards: [
              {
                card: {
                  card: {
                    info: {
                      id: '100',
                      name: 'Next Rest',
                      cloudinaryImageId: 'img2',
                      cuisines: ['Indian'],
                      avgRating: '4.2',
                      costForTwo: 20000,
                      sla: { deliveryTime: 30 },
                    },
                  },
                },
              },
            ],
          },
        }),
      ),
    );
    const page = await source.listRestaurants(19.076, 72.877, {
      nextOffset: 'CURSOR1',
      widgetOffset: { k: '9' },
    });
    expect(http.post).toHaveBeenCalledWith(
      'https://www.swiggy.com/mapi/restaurants/list/update',
      {
        lat: 19.076,
        lng: 72.877,
        nextOffset: 'CURSOR1',
        widgetOffset: { k: '9' },
        filters: {},
        page_type: 'DESKTOP_WEB_LISTING',
      },
      expect.objectContaining({
        timeout: 8000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(page.restaurants[0].id).toBe('100');
    expect(page.nextOffset).toBe('CURSOR2');
  });

  it('getMenu calls mapi/menu/pl with restaurantId', async () => {
    http.get.mockReturnValue(
      of(
        axiosResponse({
          data: {
            cards: [],
          },
        }),
      ),
    );
    await source.getMenu('12824', 19.076, 72.877);
    expect(http.get).toHaveBeenCalledWith(
      'https://www.swiggy.com/mapi/menu/pl',
      {
        params: {
          'page-type': 'REGULAR_MENU',
          'complete-menu': 'true',
          lat: 19.076,
          lng: 72.877,
          restaurantId: '12824',
          catalog_qa: 'undefined',
          submitAction: 'ENTER',
        },
        timeout: 8000,
        headers: BROWSER_HEADERS,
      },
    );
  });

  it('maps a non-empty SUGGEST payload to typed items and skips ENTER', async () => {
    http.get.mockReturnValue(
      of(
        axiosResponse({
          data: {
            suggestions: [
              { text: 'Pizza', type: 'DISH' },
              {
                text: 'Pizza Hut',
                type: 'RESTAURANT',
                restaurantId: '21395',
              },
            ],
          },
        }),
      ),
    );
    const result = await source.suggestRestaurants(19.076, 72.877, 'piz');
    expect(result).toEqual({
      query: 'piz',
      items: [
        { kind: 'dish', text: 'Pizza' },
        { kind: 'restaurant', text: 'Pizza Hut', restaurantId: '21395' },
      ],
    });
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(
      `${BASE}/restaurants/search/v2_2`,
      expect.objectContaining({
        params: expect.objectContaining({
          str: 'piz',
          submitAction: 'SUGGEST',
        }),
      }),
    );
  });

  it('maps an empty SUGGEST fallback ENTER list to restaurant items', async () => {
    http.get
      .mockReturnValueOnce(of(axiosResponse({ data: { suggestions: [] } })))
      .mockReturnValueOnce(
        of(
          axiosResponse({
            data: {
              cards: [
                {
                  card: {
                    card: {
                      info: {
                        id: '99',
                        name: 'Domino’s Pizza',
                        cloudinaryImageId: 'dom',
                        cuisines: ['Pizza'],
                        avgRating: 4.1,
                        sla: { deliveryTime: 28 },
                      },
                    },
                  },
                },
              ],
            },
          }),
        ),
      );
    const result = await source.suggestRestaurants(19.076, 72.877, 'piz');
    expect(result).toEqual({
      query: 'piz',
      items: [
        {
          kind: 'restaurant',
          text: 'Domino’s Pizza',
          restaurantId: '99',
          imageUrl:
            'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660/dom',
        },
      ],
    });
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      `${BASE}/restaurants/search/v2_2`,
      expect.objectContaining({
        params: expect.objectContaining({
          str: 'piz',
          submitAction: 'ENTER',
          selectedPLTab: 'RESTAURANT',
        }),
      }),
    );
  });

  it('searchRestaurants restaurant tab stays on v2_2 RESTAURANT cards', async () => {
    http.get.mockReturnValue(
      of(
        axiosResponse({
          data: {
            cards: [
              {
                card: {
                  card: {
                    info: {
                      id: '42885',
                      name: 'Rolls Mania',
                      cuisines: ['Rolls'],
                      avgRating: 4.3,
                      sla: { deliveryTime: 25 },
                    },
                  },
                },
              },
            ],
          },
        }),
      ),
    );
    const result = await source.searchRestaurants(
      19.076,
      72.877,
      'rolls',
      'restaurant',
    );
    expect(result).toMatchObject({
      query: 'rolls',
      tab: 'restaurant',
    });
    if (result.tab === 'restaurant') {
      expect(result.restaurants[0].id).toBe('42885');
    }
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(
      `${BASE}/restaurants/search/v2_2`,
      expect.objectContaining({
        params: expect.objectContaining({
          str: 'rolls',
          submitAction: 'ENTER',
          selectedPLTab: 'RESTAURANT',
        }),
      }),
    );
  });

  it('searchRestaurants dish tab reads v2_2 DISH groups and skips v3 when present', async () => {
    http.get.mockReturnValue(
      of(
        axiosResponse({
          data: {
            cards: [
              {
                card: {
                  card: {
                    info: {
                      id: '101',
                      name: 'Chicken Biryani',
                      price: 24900,
                      isVeg: 0,
                    },
                    restaurant: {
                      info: {
                        id: '555',
                        name: 'Biryani Blues',
                        avgRating: '4.2',
                        sla: { deliveryTime: 31 },
                      },
                    },
                  },
                },
              },
            ],
          },
        }),
      ),
    );
    const result = await source.searchRestaurants(
      19.076,
      72.877,
      'biryani',
      'dish',
    );
    expect(result).toEqual({
      query: 'biryani',
      tab: 'dish',
      groups: [
        {
          restaurantId: '555',
          restaurantName: 'Biryani Blues',
          rating: 4.2,
          etaMins: 31,
          dishes: [
            {
              id: '101',
              name: 'Chicken Biryani',
              price: 249,
              veg: false,
            },
          ],
        },
      ],
    });
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(
      `${BASE}/restaurants/search/v2_2`,
      expect.objectContaining({
        params: expect.objectContaining({
          str: 'biryani',
          submitAction: 'ENTER',
          selectedPLTab: 'DISH',
        }),
      }),
    );
  });

  it('tries search v3 once when the DISH tab on v2_2 has no groups', async () => {
    http.get
      .mockReturnValueOnce(of(axiosResponse({ data: { cards: [] } })))
      .mockReturnValueOnce(
        of(
          axiosResponse({
            data: {
              cards: [
                {
                  card: {
                    card: {
                      info: {
                        id: '201',
                        name: 'Hyderabadi Biryani',
                        price: 32000,
                        isVeg: 0,
                      },
                      restaurant: {
                        info: {
                          id: '777',
                          name: 'Paradise',
                          avgRating: '4.0',
                          sla: { deliveryTime: 40 },
                        },
                      },
                    },
                  },
                },
              ],
            },
          }),
        ),
      );
    const result = await source.searchRestaurants(
      19.076,
      72.877,
      'biryani',
      'dish',
    );
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get).toHaveBeenNthCalledWith(
      1,
      `${BASE}/restaurants/search/v2_2`,
      expect.objectContaining({
        params: expect.objectContaining({
          str: 'biryani',
          submitAction: 'ENTER',
          selectedPLTab: 'DISH',
        }),
      }),
    );
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      `${BASE}/restaurants/search/v3`,
      expect.objectContaining({
        params: expect.objectContaining({
          str: 'biryani',
          submitAction: 'ENTER',
          selectedPLTab: 'DISH',
        }),
      }),
    );
    expect(result.tab).toBe('dish');
    expect(result.tab === 'dish' ? result.groups[0].restaurantId : '').toBe(
      '777',
    );
  });

  it('retries once on HTTP failure', async () => {
    http.post
      .mockReturnValueOnce(throwError(() => new Error('network')))
      .mockReturnValueOnce(
        of(
          axiosResponse({
            data: [
              { place_id: 'pid-2', description: 'Pune, Maharashtra, India' },
            ],
          }),
        ),
      );
    const result = await source.autocomplete('pune');
    expect(http.post).toHaveBeenCalledTimes(2);
    expect(result[0].placeId).toBe('pid-2');
  });
});
