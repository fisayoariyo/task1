import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthCsrfGuard } from './auth.csrf.guard';
import { AuthService } from './auth.service';
import { LoginThrottleGuard } from './login-throttle.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthCsrfGuard, LoginThrottleGuard, ThrottlerGuard],
})
export class AuthModule {}
