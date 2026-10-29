import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SESSION_TTL_MS } from './auth.constants';
import { AuthService } from './auth.service';
import { hashSessionToken } from './crypto';
import { hashPassword, verifyPassword } from './password';
import * as password from './password';
import { PrismaService } from '../prisma/prisma.service';

jest.setTimeout(60_000);

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type SessionRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

function uniqueEmailError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`email`)',
    {
      code: 'P2002',
      clientVersion: '6.19.3',
      meta: { modelName: 'User', target: ['email'] },
    },
  );
}

type TxClient = {
  user: {
    findUnique: (args: { where: { email?: string } }) => Promise<UserRow | null>;
    create: (args: {
      data: { fullName: string; email: string; passwordHash: string };
    }) => Promise<UserRow>;
  };
  session: {
    create: (args: {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    }) => Promise<SessionRow>;
    findUnique: (args: {
      where: { tokenHash: string };
      include?: { user?: boolean };
    }) => Promise<SessionRow | (SessionRow & { user: UserRow | null }) | null>;
    delete: (args: { where: { tokenHash?: string; id?: string } }) => Promise<SessionRow>;
    deleteMany: (args: { where?: { tokenHash?: string } }) => Promise<{ count: number }>;
  };
};

function createFakePrisma(): {
  prisma: PrismaService;
  users: UserRow[];
  sessions: SessionRow[];
} {
  const users: UserRow[] = [];
  const sessions: SessionRow[] = [];
  let inTx = false;

  const api: TxClient & {
    $transaction: <T>(fn: (tx: TxClient) => Promise<T>) => Promise<T>;
  } = {
    user: {
      findUnique: async (args: { where: { email?: string } }) => {
        const found = users.find((user) => user.email === args.where.email);
        return found ? { ...found } : null;
      },
      create: async (args: {
        data: { fullName: string; email: string; passwordHash: string };
      }) => {
        if (!inTx) {
          throw new Error('user.create outside transaction');
        }
        if (users.some((user) => user.email === args.data.email)) {
          throw uniqueEmailError();
        }
        const row: UserRow = {
          id: `user-${users.length + 1}`,
          fullName: args.data.fullName,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          createdAt: new Date(),
        };
        users.push(row);
        return { ...row };
      },
    },
    session: {
      create: async (args: {
        data: { userId: string; tokenHash: string; expiresAt: Date };
      }) => {
        if (!inTx) {
          throw new Error('session.create outside transaction');
        }
        const row: SessionRow = {
          id: `session-${sessions.length + 1}`,
          userId: args.data.userId,
          tokenHash: args.data.tokenHash,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
        };
        sessions.push(row);
        return { ...row };
      },
      findUnique: async (args: {
        where: { tokenHash: string };
        include?: { user?: boolean };
      }) => {
        const row = sessions.find((session) => session.tokenHash === args.where.tokenHash);
        if (!row) {
          return null;
        }
        const copy = { ...row };
        if (!args.include?.user) {
          return copy;
        }
        const user = users.find((item) => item.id === row.userId) ?? null;
        return { ...copy, user: user ? { ...user } : null };
      },
      delete: async (args: { where: { tokenHash?: string; id?: string } }) => {
        const index = sessions.findIndex((session) => {
          if (args.where.tokenHash != null) {
            return session.tokenHash === args.where.tokenHash;
          }
          return session.id === args.where.id;
        });
        if (index < 0) {
          throw new Prisma.PrismaClientKnownRequestError(
            'Record to delete does not exist.',
            { code: 'P2025', clientVersion: '6.19.3' },
          );
        }
        const [removed] = sessions.splice(index, 1);
        return { ...removed };
      },
      deleteMany: async (args: { where?: { tokenHash?: string } }) => {
        const tokenHash = args.where?.tokenHash;
        let count = 0;
        for (let i = sessions.length - 1; i >= 0; i -= 1) {
          if (tokenHash == null || sessions[i].tokenHash === tokenHash) {
            sessions.splice(i, 1);
            count += 1;
          }
        }
        return { count };
      },
    },
    $transaction: async <T>(fn: (tx: TxClient) => Promise<T>): Promise<T> => {
      if (typeof fn !== 'function') {
        throw new Error('expected interactive transaction');
      }
      inTx = true;
      try {
        return await fn(api);
      } finally {
        inTx = false;
      }
    },
  };

  return { prisma: api as unknown as PrismaService, users, sessions };
}

describe('AuthService', () => {
  const plainPassword = 'password12';
  let passwordHash: string;
  let users: UserRow[];
  let sessions: SessionRow[];
  let service: AuthService;

  beforeAll(async () => {
    passwordHash = await hashPassword(plainPassword);
  });

  beforeEach(() => {
    const fake = createFakePrisma();
    users = fake.users;
    sessions = fake.sessions;
    service = new AuthService(fake.prisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a normalized public user and a hashed session', async () => {
    const before = Date.now();
    const result = await service.register({
      fullName: '  Ada Lovelace  ',
      email: '  Ada@Example.COM ',
      password: plainPassword,
    });
    const after = Date.now();

    expect(result.user).toEqual({
      id: users[0].id,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(users[0]).toMatchObject({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(users[0].passwordHash).not.toBe(plainPassword);
    expect(await verifyPassword(users[0].passwordHash, plainPassword)).toBe(true);

    expect(Buffer.from(result.cookieValue, 'base64url')).toHaveLength(32);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      userId: users[0].id,
      tokenHash: hashSessionToken(result.cookieValue),
      expiresAt: result.expiresAt,
    });
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_TTL_MS);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + SESSION_TTL_MS);
  });

  it('rejects a duplicate email with ConflictException', async () => {
    users.push({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(
      service.register({
        fullName: 'Ada Lovelace',
        email: 'Ada@Example.com',
        password: plainPassword,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users).toHaveLength(1);
    expect(sessions).toHaveLength(0);
  });

  it.each(['', '   '])(
    'rejects an empty full name (%j) with BadRequestException',
    async (fullName) => {
      await expect(
        service.register({
          fullName,
          email: 'ada@example.com',
          password: plainPassword,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(users).toHaveLength(0);
      expect(sessions).toHaveLength(0);
    },
  );

  it.each(['not-an-email', 'ada@localhost', 'ada@', 'ada@example'])(
    'rejects a malformed email (%j) with BadRequestException',
    async (email) => {
      await expect(
        service.register({
          fullName: 'Ada Lovelace',
          email,
          password: plainPassword,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(users).toHaveLength(0);
    },
  );

  it('rejects a password shorter than 8 characters', async () => {
    await expect(
      service.register({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: '1234567',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users).toHaveLength(0);
    expect(sessions).toHaveLength(0);
  });

  it('rejects a password longer than 72 characters', async () => {
    await expect(
      service.register({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'a'.repeat(73),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users).toHaveLength(0);
    expect(sessions).toHaveLength(0);
  });

  it('accepts passwords at the 8 and 72 character bounds', async () => {
    const shortOk = await service.register({
      fullName: 'Ada Lovelace',
      email: 'short@example.com',
      password: 'a'.repeat(8),
    });
    const longOk = await service.register({
      fullName: 'Grace Hopper',
      email: 'long@example.com',
      password: 'b'.repeat(72),
    });

    expect(shortOk.user.email).toBe('short@example.com');
    expect(longOk.user.email).toBe('long@example.com');
    expect(await verifyPassword(users[0].passwordHash, 'a'.repeat(8))).toBe(true);
    expect(await verifyPassword(users[1].passwordHash, 'b'.repeat(72))).toBe(true);
  });

  it('logs in with a matching password and returns only the public user', async () => {
    users.push({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    const before = Date.now();
    const result = await service.login({
      email: 'ada@example.com',
      password: plainPassword,
    });
    const after = Date.now();

    expect(result.user).toEqual({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      userId: 'user-ada',
      tokenHash: hashSessionToken(result.cookieValue),
      expiresAt: result.expiresAt,
    });
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_TTL_MS);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + SESSION_TTL_MS);
    expect(users).toHaveLength(1);
  });

  it('logs in when the email differs only by case', async () => {
    users.push({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    const result = await service.login({
      email: '  ADA@EXAMPLE.COM ',
      password: plainPassword,
    });

    expect(result.user).toEqual({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(sessions).toHaveLength(1);
  });

  it('rejects an unknown email with UnauthorizedException after a dummy verify', async () => {
    const order: string[] = [];
    const originalVerify = password.verifyPasswordOrDummy;
    jest.spyOn(password, 'verifyPasswordOrDummy').mockImplementation(async (hash, plain) => {
      const ok = await originalVerify(hash, plain);
      order.push(hash === null ? 'dummy-verify' : 'hash-verify');
      return ok;
    });

    let thrown: unknown;
    try {
      await service.login({
        email: 'missing@example.com',
        password: plainPassword,
      });
      order.push('returned');
    } catch (error) {
      order.push('threw');
      thrown = error;
    }

    expect(order).toEqual(['dummy-verify', 'threw']);
    expect(thrown).toBeInstanceOf(UnauthorizedException);
    expect(sessions).toHaveLength(0);
    expect(users).toHaveLength(0);
  });

  it('rejects a wrong password with the same unauthorized response as an unknown email', async () => {
    users.push({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    const seenHashes: Array<string | null> = [];
    const originalVerify = password.verifyPasswordOrDummy;
    jest.spyOn(password, 'verifyPasswordOrDummy').mockImplementation(async (hash, plain) => {
      seenHashes.push(hash);
      return originalVerify(hash, plain);
    });

    const unknown = await service
      .login({ email: 'missing@example.com', password: plainPassword })
      .catch((error: unknown) => error);
    const wrong = await service
      .login({ email: 'ada@example.com', password: 'not-the-password' })
      .catch((error: unknown) => error);

    expect(unknown).toBeInstanceOf(UnauthorizedException);
    expect(wrong).toBeInstanceOf(UnauthorizedException);
    expect((wrong as UnauthorizedException).getResponse()).toEqual(
      (unknown as UnauthorizedException).getResponse(),
    );
    expect(seenHashes).toEqual([null, passwordHash]);
    expect(sessions).toHaveLength(0);
  });

  it('rejects a short password on login with BadRequestException', async () => {
    users.push({
      id: 'user-ada',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(
      service.login({ email: 'ada@example.com', password: '1234567' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(sessions).toHaveLength(0);
  });

  it('rejects a malformed email on login with BadRequestException', async () => {
    await expect(
      service.login({ email: 'not-an-email', password: plainPassword }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(sessions).toHaveLength(0);
  });

  it('returns the public user for a valid session cookie', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });

    await expect(service.me(registered.cookieValue)).resolves.toEqual({
      id: users[0].id,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(sessions).toHaveLength(1);
  });

  it('rejects a missing cookie with UnauthorizedException', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });

    await expect(service.me(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(registered.cookieValue));
  });

  it('rejects an unknown cookie with UnauthorizedException and keeps other sessions', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });

    await expect(service.me('not-a-session')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(registered.cookieValue));
  });

  it('rejects an expired session and deletes that row', async () => {
    const expired = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });
    const kept = await service.register({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: plainPassword,
    });
    sessions[0].expiresAt = new Date(Date.now() - 1_000);

    await expect(service.me(expired.cookieValue)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.map((session) => session.tokenHash)).toEqual([
      hashSessionToken(kept.cookieValue),
    ]);
  });

  it('rejects me when the session user is gone and keeps the unexpired row', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });
    users.splice(0, users.length);

    await expect(service.me(registered.cookieValue)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(registered.cookieValue));
  });

  it('logout deletes only the session for that cookie', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });
    const kept = await service.register({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: plainPassword,
    });

    await expect(service.logout(registered.cookieValue)).resolves.toBeUndefined();
    expect(sessions.map((session) => session.tokenHash)).toEqual([
      hashSessionToken(kept.cookieValue),
    ]);
  });

  it('logout succeeds when the cookie is missing or unknown', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });

    await expect(service.logout(undefined)).resolves.toBeUndefined();
    await expect(service.logout('not-a-session')).resolves.toBeUndefined();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(registered.cookieValue));
  });

  it('rejects me after logout', async () => {
    const registered = await service.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: plainPassword,
    });

    await service.logout(registered.cookieValue);

    await expect(service.me(registered.cookieValue)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions).toHaveLength(0);
  });
});
