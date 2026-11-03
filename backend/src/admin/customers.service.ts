import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }

  async removeOne(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Customer not found');
    }
  }

  async removeMany(ids: string[]) {
    const unique = [...new Set(ids.map(String).filter(Boolean))];
    if (!unique.length) {
      throw new BadRequestException('No customer ids provided');
    }
    const result = await this.prisma.user.deleteMany({
      where: { id: { in: unique } },
    });
    return { deleted: result.count };
  }
}
