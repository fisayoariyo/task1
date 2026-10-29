import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PASSWORD_MAX, PASSWORD_MIN, SESSION_TTL_MS } from './auth.constants';
import { AuthResult, PublicUser } from './auth.types';
import { generateSessionToken, hashSessionToken } from './crypto';
import * as password from './password';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!EMAIL_SHAPE.test(normalized)) {
    throw new BadRequestException('Email is invalid');
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

function toPublic(user: {
  id: string;
  fullName: string;
  email: string;
}): PublicUser {
  return { id: user.id, fullName: user.fullName, email: user.email };
}

function isUniqueEmailError(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  const target = error.meta?.target;
  if (target == null) {
    return true;
  }
  if (Array.isArray(target)) {
    return target.some((item) => String(item).includes('email'));
  }
  return typeof target === 'string' && target.includes('email');
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const fullName = input.fullName.trim();
    if (!fullName) {
      throw new BadRequestException('Full name is required');
    }
    const email = assertEmail(input.email);
    assertPassword(input.password);

    const passwordHash = await password.hashPassword(input.password);
    const session = this.beginSession();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { fullName, email, passwordHash },
        });
        await tx.session.create({
          data: { ...session.data, userId: created.id },
        });
        return created;
      });
      return {
        user: toPublic(user),
        cookieValue: session.cookieValue,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      if (isUniqueEmailError(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const email = assertEmail(input.email);
    assertPassword(input.password);

    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordOk = await password.verifyPasswordOrDummy(
      user?.passwordHash ?? null,
      input.password,
    );
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = this.beginSession();
    await this.prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: { ...session.data, userId: user.id },
      });
    });

    return {
      user: toPublic(user),
      cookieValue: session.cookieValue,
      expiresAt: session.expiresAt,
    };
  }

  async me(cookieValue: string | undefined): Promise<PublicUser> {
    if (!cookieValue) {
      throw new UnauthorizedException();
    }

    const tokenHash = hashSessionToken(cookieValue);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session) {
      throw new UnauthorizedException();
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session.deleteMany({ where: { tokenHash } });
      throw new UnauthorizedException();
    }
    if (!session.user) {
      throw new UnauthorizedException();
    }

    return toPublic(session.user);
  }

  async logout(cookieValue: string | undefined): Promise<void> {
    if (!cookieValue) {
      return;
    }

    await this.prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(cookieValue) },
    });
  }

  private beginSession(): {
    cookieValue: string;
    expiresAt: Date;
    data: { tokenHash: string; expiresAt: Date };
  } {
    const { cookieValue, tokenHash } = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    return {
      cookieValue,
      expiresAt,
      data: { tokenHash, expiresAt },
    };
  }
}
