import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthCsrfGuard } from '../auth/auth.csrf.guard';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginThrottleGuard } from './admin-login-throttle.guard';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [AdminAuthController, CustomersController],
  providers: [
    AdminAuthService,
    AdminAuthGuard,
    AdminLoginThrottleGuard,
    CustomersService,
    AuthCsrfGuard,
    ThrottlerGuard,
  ],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminModule {}
