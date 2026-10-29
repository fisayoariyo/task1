import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';

describe('AuthModule', () => {
  it('compiles with the session controller', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
        PrismaModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(AuthController)).toBeInstanceOf(AuthController);
    await moduleRef.close();
  });
});
