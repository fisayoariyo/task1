import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthCsrfGuard } from '../auth/auth.csrf.guard';
import { AdminAuthGuard } from '../admin/admin-auth.guard';
import { CreateOrderInput, OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('orders')
  @HttpCode(201)
  @UseGuards(AuthCsrfGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  create(@Body() body: CreateOrderInput) {
    return this.orders.create(body);
  }

  @Get('admin/orders')
  @UseGuards(AdminAuthGuard)
  list() {
    return this.orders.list();
  }

  @Get('admin/orders/:id')
  @UseGuards(AdminAuthGuard)
  getOne(@Param('id') id: string) {
    return this.orders.getOne(id);
  }

  @Delete('admin/orders/:id')
  @HttpCode(204)
  @UseGuards(AdminAuthGuard, AuthCsrfGuard)
  async removeOne(@Param('id') id: string): Promise<void> {
    await this.orders.removeOne(id);
  }

  @Post('admin/orders/bulk-delete')
  @HttpCode(200)
  @UseGuards(AdminAuthGuard, AuthCsrfGuard)
  bulkDelete(@Body() body: { ids?: string[] }) {
    return this.orders.removeMany(body?.ids ?? []);
  }
}
