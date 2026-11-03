import { UnauthorizedException } from '@nestjs/common';
import { hashPassword } from '../auth/password';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  it('rejects bad login credentials', async () => {
    const prisma = {
      admin: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      adminSession: { create: jest.fn() },
    };
    const service = new AdminAuthService(prisma as never);
    await expect(
      service.login({ username: 'admin', password: 'admin12345' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in and creates a session', async () => {
    const passwordHash = await hashPassword('admin12345');
    const prisma = {
      admin: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'a1',
          username: 'admin',
          passwordHash,
        }),
      },
      adminSession: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new AdminAuthService(prisma as never);
    const result = await service.login({
      username: 'admin',
      password: 'admin12345',
    });
    expect(result.admin).toEqual({ id: 'a1', username: 'admin' });
    expect(result.cookieValue).toBeTruthy();
    expect(prisma.adminSession.create).toHaveBeenCalled();
  });
});
