import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('exposes $connect', () => {
    const s = Object.create(PrismaService.prototype);
    expect(typeof PrismaService.prototype.$connect).toBe('function');
  });
});
