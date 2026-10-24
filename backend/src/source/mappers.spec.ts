import {
  buildCloudinaryUrl,
  mapGeocodeResponse,
  mapMenuResponse,
  mapPlaceAutocomplete,
  mapRestaurantCard,
  mapRestaurantListResponse,
  paiseToRupees,
} from './mappers';

const CLOUDINARY_BASE =
  'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600,c_fit';

describe('mappers', () => {
  describe('paiseToRupees', () => {
    it('converts 15000 paise to 150 rupees', () => {
      expect(paiseToRupees(15000)).toBe(150);
    });
  });

  describe('buildCloudinaryUrl', () => {
    it('builds w_600 Cloudinary URL from image id', () => {
      expect(buildCloudinaryUrl('rmf8gsxyxtgejfj73dxe')).toBe(
        `${CLOUDINARY_BASE}/rmf8gsxyxtgejfj73dxe`,
      );
    });
  });

  describe('mapRestaurantCard (Ramsar Bakery shape)', () => {
    const ramsarInfo = {
      id: '97272',
      name: 'Ramsar Bakery',
      cloudinaryImageId: 'rmf8gsxyxtgejfj73dxe',
      cuisines: ['Desserts', 'Fast Food', 'Bakery'],
      avgRating: '4.0',
      deliveryTime: 27,
      costForTwo: 15000,
      sla: { deliveryTime: 27 },
      aggregatedDiscountInfoV2: {
        shortDescriptionList: [{ meta: 'Use WELCOME50' }],
      },
    };

    it('maps restaurant fields and paise costForTwo', () => {
      expect(mapRestaurantCard(ramsarInfo)).toEqual({
        id: '97272',
        name: 'Ramsar Bakery',
        cuisines: 'Desserts, Fast Food, Bakery',
        rating: 4.0,
        etaMins: 27,
        costForTwo: 150,
        imageUrl: `${CLOUDINARY_BASE}/rmf8gsxyxtgejfj73dxe`,
        offer: 'Use WELCOME50',
      });
    });
  });

  describe('mapRestaurantListResponse', () => {
    it('extracts restaurants from list/v5 card wrapper', () => {
      const payload = {
        data: {
          cards: [
            {
              card: {
                card: {
                  '@type':
                    'type.googleapis.com/swiggy.presentation.food.v2.Restaurant',
                  info: {
                    id: '97272',
                    name: 'Ramsar Bakery',
                    cloudinaryImageId: 'rmf8gsxyxtgejfj73dxe',
                    cuisines: ['Desserts', 'Fast Food', 'Bakery'],
                    avgRating: '4.0',
                    costForTwo: 15000,
                    sla: { deliveryTime: 27 },
                  },
                },
              },
            },
          ],
        },
      };
      const list = mapRestaurantListResponse(payload);
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Ramsar Bakery');
      expect(list[0].costForTwo).toBe(150);
    });
  });

  describe('mapPlaceAutocomplete', () => {
    it('maps place_id and description', () => {
      const payload = {
        data: [
          {
            place_id: 'ChIJwe1EZjDG5zsRaYxkjY_tpF0',
            description: 'Mumbai, Maharashtra, India',
          },
        ],
      };
      expect(mapPlaceAutocomplete(payload)).toEqual([
        {
          placeId: 'ChIJwe1EZjDG5zsRaYxkjY_tpF0',
          description: 'Mumbai, Maharashtra, India',
        },
      ]);
    });
  });

  describe('mapGeocodeResponse', () => {
    it('maps lat/lng from address-recommend geometry', () => {
      const payload = {
        data: [
          {
            geometry: {
              location: { lat: 19.076, lng: 72.8777 },
            },
          },
        ],
      };
      expect(mapGeocodeResponse(payload)).toEqual({ lat: 19.076, lng: 72.8777 });
    });
  });

  describe('mapMenuResponse (Amul Butter Pav Bhaji shape)', () => {
    const amulItem = {
      id: 2328305,
      name: 'Amul Butter Pav Bhaji ',
      category: 'Pav Bhaji',
      description:
        '| 2 pcs | Butter-laden pavs accompanied by a delicious and healthy gravy of mashed vegetables, topped with dollops of butter. | Served with Gravy |',
      cloudinaryImageId: 'fdm8llrlsgawqtjjfees',
      isVeg: 1,
      price: 15000,
      isBestSeller: true,
      ribbon: { text: 'Bestseller' },
    };

    it('maps dish price from paise to rupees', () => {
      const payload = {
        data: {
          cards: [
            {
              groupedCard: {
                cardGroupMap: {
                  REGULAR: {
                    cards: [
                      {
                        card: {
                          card: {
                            '@type':
                              'type.googleapis.com/swiggy.presentation.food.v2.ItemCategory',
                            title: 'Pav Bhaji',
                            itemCards: [
                              {
                                card: {
                                  info: amulItem,
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      };
      const menu = mapMenuResponse(payload, '12824', 'Sample Rest');
      expect(menu.restaurantId).toBe('12824');
      expect(menu.restaurantName).toBe('Sample Rest');
      expect(menu.categories[0].name).toBe('Pav Bhaji');
      const item = menu.categories[0].items[0];
      expect(item.name).toBe('Amul Butter Pav Bhaji ');
      expect(item.price).toBe(150);
      expect(item.isVeg).toBe(true);
      expect(item.imageUrl).toBe(`${CLOUDINARY_BASE}/fdm8llrlsgawqtjjfees`);
      expect(item.isBestseller).toBe(true);
    });
  });
});
