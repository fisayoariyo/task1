import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

/** 5 login attempts per 15 minutes for each client IP and username. */
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

type LoginRequest = {
  ip?: string;
  socket?: { remoteAddress?: string };
  body?: { username?: unknown };
};

@Injectable()
export class AdminLoginThrottleGuard implements CanActivate {
  private readonly attempts = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<LoginRequest>();
    const key = `${clientIp(request)}:${normalizeUsername(request.body?.username)}`;
    const now = Date.now();
    const recent = (this.attempts.get(key) ?? []).filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    );

    if (recent.length >= LIMIT) {
      this.attempts.set(key, recent);
      throw new ThrottlerException();
    }

    recent.push(now);
    this.attempts.set(key, recent);
    return true;
  }
}

function clientIp(request: LoginRequest): string {
  return request.ip || request.socket?.remoteAddress || '';
}

function normalizeUsername(username: unknown): string {
  return typeof username === 'string' ? username.trim().toLowerCase() : '';
}
