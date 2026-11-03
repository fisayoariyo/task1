import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthCsrfGuard } from '../auth/auth.csrf.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginThrottleGuard } from './admin-login-throttle.guard';
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  readAdminSessionId,
} from './admin.cookie';

type LoginBody = {
  username: string;
  password: string;
};

type CredentialsBody = {
  username?: string;
  password?: string;
  currentPassword: string;
};

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthCsrfGuard, ThrottlerGuard, AdminLoginThrottleGuard)
  async login(
    @Body() body: LoginBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminAuth.login(body);
    res.setHeader(
      'Set-Cookie',
      buildAdminSessionCookie(result.cookieValue, result.expiresAt, {
        nodeEnv: process.env.NODE_ENV,
      }),
    );
    return result.admin;
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthCsrfGuard)
  async logout(
    @Headers('cookie') cookie: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.adminAuth.logout(readAdminSessionId(cookie));
    res.setHeader(
      'Set-Cookie',
      clearAdminSessionCookie({ nodeEnv: process.env.NODE_ENV }),
    );
  }

  @Get('me')
  me(@Headers('cookie') cookie: string | undefined) {
    return this.adminAuth.me(readAdminSessionId(cookie));
  }

  @Patch('credentials')
  @UseGuards(AuthCsrfGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  updateCredentials(
    @Headers('cookie') cookie: string | undefined,
    @Body() body: CredentialsBody,
  ) {
    return this.adminAuth.updateCredentials(readAdminSessionId(cookie), body);
  }
}
