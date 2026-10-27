import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PlacesService } from './places.service';

@UseGuards(ThrottlerGuard)
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

  @Get('reverse')
  reverse(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    return this.placesService.reverse(lat ?? '', lng ?? '');
  }
}
