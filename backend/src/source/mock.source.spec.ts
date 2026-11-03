import { MockSource } from './mock.source';

describe('MockSource', () => {
  const src = new MockSource();

  it('autocomplete returns suggestions for mumbai', async () => {
    const r = await src.autocomplete('mumbai');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]).toEqual(
      expect.objectContaining({
        placeId: expect.any(String),
        description: expect.any(String),
      }),
    );
  });

  it('geocode returns lat lng', async () => {
    const g = await src.geocode('mock-place-1');
    expect(g.lat).toBeCloseTo(19.07, 0);
    expect(g.lng).toBeCloseTo(72.87, 0);
  });

  it('listRestaurants returns cards with imageUrl', async () => {
    const page = await src.listRestaurants(19.076, 72.877);
    expect(page.restaurants[0].id).toBeDefined();
    expect(page.restaurants[0].costForTwo).toBeGreaterThan(0);
    expect(page.restaurants[0].imageUrl).toMatch(/^https?:\/\//);
    expect(page.hasMore).toBeDefined();
  });

  it('getMenu returns categories with prices in rupees', async () => {
    const page = await src.listRestaurants(19.076, 72.877);
    const listId = page.restaurants[0].id;
    const menu = await src.getMenu(listId, 19.076, 72.877);
    expect(menu.categories[0].items[0].price).toBeLessThan(10000); // not paise
  });

  it('suggestRestaurants returns mixed dish and restaurant items', async () => {
    const result = await src.suggestRestaurants(19.076, 72.877, 'pizza');
    expect(result).toEqual({
      query: 'pizza',
      items: [
        { kind: 'dish', text: 'Pizza' },
        {
          kind: 'restaurant',
          text: 'Pizza By The Bay',
          restaurantId: 'mock-rest-4',
          imageUrl:
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        },
        {
          kind: 'restaurant',
          text: "Domino's Pizza",
          restaurantId: 'mock-rest-10',
          imageUrl:
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        },
      ],
    });
  });

  it('searchRestaurants restaurant tab stays a restaurant list', async () => {
    const result = await src.searchRestaurants(
      19.076,
      72.877,
      'pizza',
      'restaurant',
    );
    expect(result.tab).toBe('restaurant');
    expect(result.query).toBe('pizza');
    expect(result).not.toHaveProperty('groups');
    if (result.tab === 'restaurant') {
      expect(result.restaurants.map((r) => r.id)).toEqual([
        'mock-rest-4',
        'mock-rest-10',
      ]);
    }
  });

  it('searchRestaurants dish tab groups dishes under matching restaurants', async () => {
    const result = await src.searchRestaurants(
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
          restaurantId: 'mock-rest-9',
          restaurantName: 'Behrouz Biryani',
          rating: 4.4,
          etaMins: 36,
          dishes: [
            {
              id: 'mock-rest-9-biryani',
              name: 'Biryani',
              price: 199,
              imageUrl:
                'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
              veg: false,
            },
            {
              id: 'mock-rest-9-biryani-veg',
              name: 'Veg Biryani',
              price: 179,
              imageUrl:
                'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
              veg: true,
            },
          ],
        },
      ],
    });
  });

  it('listFoodCategories returns time-slotted tiles', async () => {
    const dto = await src.listFoodCategories(19.076, 72.877);
    expect(dto.items.length).toBeGreaterThan(0);
    expect(dto.items[0].name).toBeTruthy();
    expect(dto.items[0].imageUrl).toMatch(/^https?:\/\//);
    expect(dto.hour).toBeGreaterThanOrEqual(0);
    expect(dto.hour).toBeLessThan(24);
  });
});
