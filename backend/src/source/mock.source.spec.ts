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
    const list = await src.listRestaurants(19.076, 72.877, 0);
    expect(list[0].id).toBeDefined();
    expect(list[0].costForTwo).toBeGreaterThan(0);
    expect(list[0].imageUrl).toMatch(/^https?:\/\//);
  });

  it('getMenu returns categories with prices in rupees', async () => {
    const list = await src.listRestaurants(19.076, 72.877, 0);
    const listId = list[0].id;
    const menu = await src.getMenu(listId, 19.076, 72.877);
    expect(menu.categories[0].items[0].price).toBeLessThan(10000); // not paise
  });
});
