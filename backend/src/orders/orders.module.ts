import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminModule } from '../admin/admin.module';
import { AuthCsrfGuard } from '../auth/auth.csrf.guard';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AdminModule],
  controllers: [OrdersController],
  providers: [OrdersService, AuthCsrfGuard, ThrottlerGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
