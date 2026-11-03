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
import { AuthCsrfGuard } from '../auth/auth.csrf.guard';
import { AdminAuthGuard } from './admin-auth.guard';
import { CustomersService } from './customers.service';

@Controller('admin/customers')
@UseGuards(AdminAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list() {
    return this.customers.list();
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthCsrfGuard)
  async removeOne(@Param('id') id: string): Promise<void> {
    await this.customers.removeOne(id);
  }

  @Post('bulk-delete')
  @HttpCode(200)
  @UseGuards(AuthCsrfGuard)
  bulkDelete(@Body() body: { ids?: string[] }) {
    return this.customers.removeMany(body?.ids ?? []);
  }
}
