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

  it('listFoodCategories returns time-slotted tiles', async () => {
    const dto = await src.listFoodCategories(19.076, 72.877);
    expect(dto.items.length).toBeGreaterThan(0);
    expect(dto.items[0].name).toBeTruthy();
    expect(dto.items[0].imageUrl).toMatch(/^https?:\/\//);
    expect(dto.hour).toBeGreaterThanOrEqual(0);
    expect(dto.hour).toBeLessThan(24);
  });
});
