import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getCorsOrigins } from './cors-origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Same allowlist AuthCsrfGuard uses for Origin checks.
  const origins = getCorsOrigins();
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

bootstrap();
