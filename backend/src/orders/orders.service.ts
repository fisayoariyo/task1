import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type CreateOrderInput = {
  lines: Array<{
    id?: string;
    dishId?: string;
    name?: string;
    price?: number;
    unitPrice?: number;
    qty?: number;
    restaurantId?: string;
    restaurantName?: string;
    customisation?: unknown;
  }>;
  grand: number;
  count?: number;
  placeLabel: string;
  contact: { name: string; phone: string; email?: string };
  note?: string;
  paymentMethod?: string;
  userId?: string | null;
  deliveryAddress?: unknown;
};

function orderInclude() {
  return {
    items: true,
    user: {
      select: { id: true, fullName: true, email: true },
    },
  } as const;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderInput) {
    const name = String(input.contact?.name || '').trim();
    const phone = String(input.contact?.phone || '').trim();
    const email = String(input.contact?.email || '').trim();
    if (!name || !phone) {
      throw new BadRequestException('Contact name and phone are required');
    }
    if (!Array.isArray(input.lines) || input.lines.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }
    const grand = Number(input.grand);
    if (!Number.isFinite(grand) || grand < 0) {
      throw new BadRequestException('Invalid order total');
    }

    const itemsData = input.lines.map((line) => {
      const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
      const unitPrice = Number(line.unitPrice ?? line.price) || 0;
      const dishId = String(line.dishId || line.id || '').trim() || 'unknown';
      const itemName = String(line.name || 'Item').trim() || 'Item';
      return {
        dishId,
        name: itemName,
        unitPrice,
        qty,
        restaurantId: String(line.restaurantId || ''),
        restaurantName: String(line.restaurantName || ''),
        customisation:
          line.customisation == null
            ? Prisma.JsonNull
            : (line.customisation as Prisma.InputJsonValue),
      };
    });

    const itemCount =
      Number(input.count) ||
      itemsData.reduce((sum, item) => sum + item.qty, 0);

    const order = await this.prisma.order.create({
      data: {
        userId: input.userId || null,
        contactName: name,
        contactPhone: phone,
        contactEmail: email,
        placeLabel: String(input.placeLabel || '').trim(),
        note: String(input.note || '').trim(),
        paymentMethod: String(input.paymentMethod || 'upi'),
        grand,
        itemCount,
        deliveryAddress:
          input.deliveryAddress == null
            ? Prisma.JsonNull
            : (input.deliveryAddress as Prisma.InputJsonValue),
        items: { create: itemsData },
      },
      include: orderInclude(),
    });

    return this.toPublicOrder(order);
  }

  list() {
    return this.prisma.order
      .findMany({
        orderBy: { createdAt: 'desc' },
        include: orderInclude(),
      })
      .then((rows) => rows.map((row) => this.toPublicOrder(row)));
  }

  async getOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude(),
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.toPublicOrder(order);
  }

  async removeOne(id: string) {
    try {
      await this.prisma.order.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Order not found');
    }
  }

  async removeMany(ids: string[]) {
    const unique = [...new Set(ids.map(String).filter(Boolean))];
    if (!unique.length) {
      throw new BadRequestException('No order ids provided');
    }
    const result = await this.prisma.order.deleteMany({
      where: { id: { in: unique } },
    });
    return { deleted: result.count };
  }

  private toPublicOrder(order: {
    id: string;
    userId: string | null;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    placeLabel: string;
    note: string;
    paymentMethod: string;
    grand: number;
    itemCount: number;
    deliveryAddress: unknown;
    createdAt: Date;
    items: Array<{
      id: string;
      dishId: string;
      name: string;
      unitPrice: number;
      qty: number;
      restaurantId: string;
      restaurantName: string;
      customisation: unknown;
    }>;
    user: { id: string; fullName: string; email: string } | null;
  }) {
    return {
      id: order.id,
      mode: 'live' as const,
      userId: order.userId,
      grand: order.grand,
      count: order.itemCount,
      itemCount: order.itemCount,
      placeLabel: order.placeLabel,
      note: order.note,
      paymentMethod: order.paymentMethod,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      contact: {
        name: order.contactName,
        phone: order.contactPhone,
        email: order.contactEmail,
      },
      customer: order.user,
      items: order.items.map((item) => ({
        id: item.id,
        dishId: item.dishId,
        name: item.name,
        unitPrice: item.unitPrice,
        qty: item.qty,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        customisation: item.customisation,
      })),
    };
  }
}
