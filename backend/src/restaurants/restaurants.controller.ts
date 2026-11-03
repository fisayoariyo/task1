import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RestaurantsService } from './restaurants.service';

@UseGuards(ThrottlerGuard)
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  list(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('nextOffset') nextOffset?: string,
    @Query('widgetOffset') widgetOffset?: string,
  ) {
    return this.restaurantsService.listRestaurants(
      lat,
      lng,
      nextOffset,
      widgetOffset,
    );
  }

  /** Time-aware cuisine tiles for landing (Swiggy “mind” widgets / mock slots). */
  @Get('food-categories')
  foodCategories(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.restaurantsService.listFoodCategories(lat, lng);
  }

  /**
   * Keyword search for current deliver-to coordinates.
   * `tab=dish` groups dishes under restaurants; anything else is restaurant.
   */
  @Get('search')
  search(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('q') q: string,
    @Query('tab') tab?: string,
  ) {
    return this.restaurantsService.searchRestaurants(lat, lng, q, tab);
  }

  /** As-you-type suggest (Swiggy SUGGEST) for discovery search. */
  @Get('suggest')
  suggest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('q') q: string,
  ) {
    return this.restaurantsService.suggestRestaurants(lat, lng, q);
  }

  @Get(':id/menu')
  menu(
    @Param('id') id: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.restaurantsService.getMenu(id, lat, lng);
  }
}
