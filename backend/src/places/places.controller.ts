import { Controller, Get, Query } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('autocomplete')
  autocomplete(@Query('input') input?: string) {
    return this.placesService.autocomplete(input ?? '');
  }

  @Get('geocode')
  geocode(@Query('placeId') placeId?: string) {
    return this.placesService.geocode(placeId ?? '');
  }
}
