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

  it('listRestaurants calls list/v5 with lat, lng, offset and listing params', async () => {
    http.get.mockReturnValue(
      of(
        axiosResponse({
          data: {
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
    const list = await source.listRestaurants(19.076, 72.877, 15);
    expect(http.get).toHaveBeenCalledWith(`${BASE}/restaurants/list/v5`, {
      params: {
        lat: 19.076,
        lng: 72.877,
        offset: 15,
        sortBy: 'RELEVANCE',
        pageType: 'SEE_ALL',
        page_type: 'DESKTOP_SEE_ALL_LISTING',
      },
      timeout: 8000,
      headers: BROWSER_HEADERS,
    });
    expect(list[0].id).toBe('97272');
    expect(list[0].costForTwo).toBe(150);
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
