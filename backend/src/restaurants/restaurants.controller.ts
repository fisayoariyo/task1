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
    @Query('offset') offset?: string,
  ) {
    return this.restaurantsService.listRestaurants(lat, lng, offset);
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
