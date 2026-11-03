import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('rejects empty lines', async () => {
    const prisma = { order: { create: jest.fn() } };
    const service = new OrdersService(prisma as never);
    await expect(
      service.create({
        lines: [],
        grand: 10,
        placeLabel: 'X',
        contact: { name: 'Ada', phone: '999' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an order with items', async () => {
    const created = {
      id: 'o1',
      userId: null,
      contactName: 'Ada',
      contactPhone: '999',
      contactEmail: '',
      placeLabel: 'Mumbai',
      note: '',
      paymentMethod: 'upi',
      grand: 100,
      itemCount: 1,
      deliveryAddress: null,
      createdAt: new Date(),
      items: [
        {
          id: 'i1',
          dishId: 'd1',
          name: 'Biryani',
          unitPrice: 100,
          qty: 1,
          restaurantId: 'r1',
          restaurantName: 'R',
          customisation: null,
        },
      ],
      user: null,
    };
    const prisma = {
      order: { create: jest.fn().mockResolvedValue(created) },
    };
    const service = new OrdersService(prisma as never);
    const result = await service.create({
      lines: [{ id: 'd1', name: 'Biryani', price: 100, qty: 1 }],
      grand: 100,
      placeLabel: 'Mumbai',
      contact: { name: 'Ada', phone: '999' },
    });
    expect(result.id).toBe('o1');
    expect(result.mode).toBe('live');
    expect(result.items).toHaveLength(1);
    expect(prisma.order.create).toHaveBeenCalled();
  });
});
