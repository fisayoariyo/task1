import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { COOKIE_NAME } from './auth.constants';
import { AuthCsrfGuard } from './auth.csrf.guard';
import { AuthService } from './auth.service';
import { buildSessionCookie, clearSessionCookie } from './cookie';
import { LoginThrottleGuard } from './login-throttle.guard';

type RegisterBody = {
  fullName: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @UseGuards(AuthCsrfGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() body: RegisterBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    res.setHeader(
      'Set-Cookie',
      buildSessionCookie(result.cookieValue, result.expiresAt, {
        nodeEnv: process.env.NODE_ENV,
      }),
    );
    return result.user;
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(AuthCsrfGuard, ThrottlerGuard, LoginThrottleGuard)
  async login(
    @Body() body: LoginBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    res.setHeader(
      'Set-Cookie',
      buildSessionCookie(result.cookieValue, result.expiresAt, {
        nodeEnv: process.env.NODE_ENV,
      }),
    );
    return result.user;
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthCsrfGuard)
  async logout(
    @Headers('cookie') cookie: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(readSessionId(cookie));
    res.setHeader(
      'Set-Cookie',
      clearSessionCookie({ nodeEnv: process.env.NODE_ENV }),
    );
  }

  @Get('me')
  me(@Headers('cookie') cookie: string | undefined) {
    return this.authService.me(readSessionId(cookie));
  }
}

function readSessionId(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const prefix = `${COOKIE_NAME}=`;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) {
      continue;
    }
    const value = trimmed.slice(prefix.length);
    return value.length > 0 ? value : undefined;
  }
  return undefined;
}
