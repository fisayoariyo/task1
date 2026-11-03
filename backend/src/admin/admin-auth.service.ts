import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { PASSWORD_MAX, PASSWORD_MIN } from '../auth/auth.constants';
import { generateSessionToken, hashSessionToken } from '../auth/crypto';
import * as password from '../auth/password';
import {
  ADMIN_SESSION_TTL_MS,
  ADMIN_USERNAME_MAX,
  ADMIN_USERNAME_MIN,
} from './admin.constants';
import { AdminAuthResult, PublicAdmin } from './admin.types';

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function assertUsername(username: string): string {
  const normalized = normalizeUsername(username);
  if (
    normalized.length < ADMIN_USERNAME_MIN ||
    normalized.length > ADMIN_USERNAME_MAX
  ) {
    throw new BadRequestException(
      `Username must be ${ADMIN_USERNAME_MIN}–${ADMIN_USERNAME_MAX} characters`,
    );
  }
  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    throw new BadRequestException(
      'Username may only use letters, numbers, dots, underscores, and hyphens',
    );
  }
  return normalized;
}

function assertPassword(plain: string): void {
  if (plain.length < PASSWORD_MIN || plain.length > PASSWORD_MAX) {
    throw new BadRequestException(
      `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters`,
    );
  }
}

function toPublic(admin: { id: string; username: string }): PublicAdmin {
  return { id: admin.id, username: admin.username };
}

function isUniqueUsernameError(error: unknown): boolean {
  if (
    !(error instanceof PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  const target = error.meta?.target;
  if (target == null) return true;
  if (Array.isArray(target)) {
    return target.some((item) => String(item).includes('username'));
  }
  return typeof target === 'string' && target.includes('username');
}

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(input: {
    username: string;
    password: string;
  }): Promise<AdminAuthResult> {
    const username = assertUsername(input.username);
    assertPassword(input.password);

    const admin = await this.prisma.admin.findUnique({ where: { username } });
    const passwordOk = await password.verifyPasswordOrDummy(
      admin?.passwordHash ?? null,
      input.password,
    );
    if (!admin || !passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = this.beginSession();
    await this.prisma.adminSession.create({
      data: { ...session.data, adminId: admin.id },
    });

    return {
      admin: toPublic(admin),
      cookieValue: session.cookieValue,
      expiresAt: session.expiresAt,
    };
  }

  async me(cookieValue: string | undefined): Promise<PublicAdmin> {
    const session = await this.requireSession(cookieValue);
    return toPublic(session.admin);
  }

  async logout(cookieValue: string | undefined): Promise<void> {
    if (!cookieValue) return;
    await this.prisma.adminSession.deleteMany({
      where: { tokenHash: hashSessionToken(cookieValue) },
    });
  }

  async updateCredentials(
    cookieValue: string | undefined,
    input: { username?: string; password?: string; currentPassword: string },
  ): Promise<PublicAdmin> {
    const session = await this.requireSession(cookieValue);
    assertPassword(input.currentPassword);

    const currentOk = await password.verifyPassword(
      session.admin.passwordHash,
      input.currentPassword,
    );
    if (!currentOk) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const data: { username?: string; passwordHash?: string } = {};
    if (input.username != null && input.username.trim() !== '') {
      data.username = assertUsername(input.username);
    }
    if (input.password != null && input.password !== '') {
      assertPassword(input.password);
      data.passwordHash = await password.hashPassword(input.password);
    }
    if (!data.username && !data.passwordHash) {
      throw new BadRequestException('Provide a new username or password');
    }

    try {
      const updated = await this.prisma.admin.update({
        where: { id: session.admin.id },
        data,
      });
      return toPublic(updated);
    } catch (error) {
      if (isUniqueUsernameError(error)) {
        throw new ConflictException('Username already taken');
      }
      throw error;
    }
  }

  async requireSession(cookieValue: string | undefined): Promise<{
    id: string;
    admin: { id: string; username: string; passwordHash: string };
  }> {
    if (!cookieValue) {
      throw new UnauthorizedException();
    }

    const tokenHash = hashSessionToken(cookieValue);
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { admin: true },
    });
    if (!session?.admin) {
      throw new UnauthorizedException();
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.adminSession.deleteMany({ where: { tokenHash } });
      throw new UnauthorizedException();
    }
    return session;
  }

  private beginSession(): {
    cookieValue: string;
    expiresAt: Date;
    data: { tokenHash: string; expiresAt: Date };
  } {
    const { cookieValue, tokenHash } = generateSessionToken();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
    return {
      cookieValue,
      expiresAt,
      data: { tokenHash, expiresAt },
    };
  }
}
