import {
  buildCloudinaryUrl,
  mapGeocodeResponse,
  mapFoodCategoriesResponse,
  mapMenuResponse,
  mapPlaceAutocomplete,
  mapRestaurantCard,
  mapRestaurantListResponse,
  paiseToRupees,
} from './mappers';

const CLOUDINARY_BASE =
  'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660';

describe('mappers', () => {
  describe('paiseToRupees', () => {
    it('converts 15000 paise to 150 rupees', () => {
      expect(paiseToRupees(15000)).toBe(150);
    });
  });

  describe('buildCloudinaryUrl', () => {
    it('builds media-assets URL from image id', () => {
      expect(buildCloudinaryUrl('rmf8gsxyxtgejfj73dxe')).toBe(
        `${CLOUDINARY_BASE}/rmf8gsxyxtgejfj73dxe`,
      );
    });

    it('rewrites legacy cloudinary host to media-assets', () => {
      expect(
        buildCloudinaryUrl(
          'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_600,c_fit/abc',
        ),
      ).toContain('media-assets.swiggy.com');
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

  describe('mapFoodCategoriesResponse', () => {
    it('extracts imageGridCards tiles and title', () => {
      const payload = {
        data: {
          cards: [
            {
              card: {
                card: {
                  header: { title: "What's on your mind?" },
                  imageGridCards: {
                    info: [
                      {
                        id: '1',
                        imageId: 'rng/md/carousel/production/biryani',
                        action: {
                          text: 'Biryani',
                          link: 'https://www.swiggy.com/collections/x?query=Biryani',
                        },
                      },
                      {
                        id: '2',
                        imageId: 'rng/md/carousel/production/pizza',
                        accessibility: {
                          altText: 'restaurants curated for pizza',
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
      const dto = mapFoodCategoriesResponse(payload, 18);
      expect(dto.hour).toBe(18);
      expect(dto.title).toBe("What's on your mind?");
      expect(dto.items).toHaveLength(2);
      expect(dto.items[0].name).toBe('Biryani');
      expect(dto.items[0].query).toBe('Biryani');
      expect(dto.items[0].imageUrl).toContain('biryani');
      expect(dto.items[1].name).toBe('Pizza');
    });
  });

  describe('mapMenuResponse about hours', () => {
    it('maps availability opened + nextCloseMessage onto about', () => {
      const payload = {
        data: {
          cards: [
            {
              card: {
                card: {
                  '@type':
                    'type.googleapis.com/swiggy.presentation.food.v2.Restaurant',
                  info: {
                    name: 'Behrouz Biryani',
                    areaName: 'Navaratan Gardens',
                    locality: 'Navaratan Gardens',
                    city: 'Jaipur',
                    sla: {
                      deliveryTime: 37,
                      slaString: '35-40 mins',
                      lastMileTravelString: '2.1 km',
                    },
                    labels: [
                      {
                        title: 'Address',
                        message: 'Shop 4, Navaratan Gardens, Jaipur',
                      },
                    ],
                    availability: {
                      opened: true,
                      nextCloseMessage: 'Closes 12:00 am',
                    },
                    openingHours: [
                      { day: 'Monday', time: '11:00 am – 12:00 am' },
                      { day: 'Tuesday', time: '11:00 am – 12:00 am' },
                    ],
                  },
                },
              },
            },
          ],
        },
      };
      const menu = mapMenuResponse(payload, '1', 'Behrouz Biryani');
      expect(menu.about?.isOpen).toBe(true);
      expect(menu.about?.closesAt).toBe('12:00 am');
      expect(menu.about?.areaName).toBe('Navaratan Gardens');
      expect(menu.about?.etaMins).toBe(37);
      expect(menu.about?.address).toBe('Shop 4, Navaratan Gardens, Jaipur');
      expect(menu.about?.slaString).toBe('35-40 mins');
      expect(menu.about?.distance).toBe('2.1 km');
      expect(menu.about?.openingHours?.length).toBe(2);
      expect(menu.about?.openingHours?.[0].day).toBe('Monday');
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

    it('maps variants (radio) and addons (multi) onto MenuItem', () => {
      const customItem = {
        ...amulItem,
        id: 99,
        name: 'Chicken Krisper with Reg Fries',
        price: 24900,
        defaultPrice: 24900,
        isVeg: 0,
        variantsV2: {
          variantGroups: [
            {
              groupId: 'size',
              name: 'Choose Size',
              variations: [
                { id: 'reg', name: 'Regular', price: 0, default: 1, isVeg: 0 },
                { id: 'lg', name: 'Large', price: 5000, isVeg: 0 },
              ],
            },
          ],
          pricingModels: [
            {
              variations: ['reg'],
              price: 24900,
              addonCombinations: [
                { groupId: 'sides', addonId: 'fries' },
                { groupId: 'sides', addonId: 'pop' },
                { groupId: 'drink', addonId: 'pep' },
              ],
            },
            {
              variations: ['lg'],
              price: 29900,
              addonCombinations: [
                { groupId: 'sides', addonId: 'fries' },
                { groupId: 'drink', addonId: 'pep' },
                { groupId: 'drink', addonId: 'mir' },
              ],
            },
          ],
        },
        addons: [
          {
            groupId: 'sides',
            groupName: 'Choose your Sides (optional)',
            minAddons: 0,
            maxAddons: 5,
            choices: [
              { id: 'fries', name: 'French Fries - Medium', price: 11900, isVeg: 1 },
              { id: 'pop', name: 'Chicken Popcorn - Regular', price: 12900, isVeg: 0 },
            ],
          },
          {
            groupId: 'drink',
            groupName: 'Choose Your Beverage',
            minAddons: 1,
            maxAddons: 1,
            choices: [
              { id: 'pep', name: 'Pepsi', price: 5700, isVeg: 1 },
              { id: 'mir', name: 'Mirinda', price: 5700, isVeg: 1 },
            ],
          },
        ],
      };
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
                            title: 'Combos',
                            itemCards: [{ card: { info: customItem } }],
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
      const item = mapMenuResponse(payload, '1', 'KFC').categories[0].items[0];
      expect(item.customisable).toBe(true);
      expect(item.price).toBe(249);
      expect(item.variants).toHaveLength(1);
      expect(item.variants![0].max).toBe(1);
      expect(item.variants![0].choices[1].price).toBe(50);
      expect(item.pricingModels).toHaveLength(2);
      expect(item.pricingModels![1].price).toBe(299);
      expect(item.pricingModels![0].addonIds).toEqual(
        expect.arrayContaining(['fries', 'pop', 'pep']),
      );
      expect(item.addons).toHaveLength(2);
      expect(item.addons![0].max).toBe(5);
      expect(item.addons![1].max).toBe(1);
      expect(item.addons![0].choices[0].price).toBe(119);
    });
  });
});
