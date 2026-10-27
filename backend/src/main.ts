import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173';
  const origins = corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
  // Vite may be opened as localhost or 127.0.0.1 — allow both by default.
  if (!process.env.CORS_ORIGIN) {
    origins.push('http://127.0.0.1:5173');
  }
  app.enableCors({ origin: origins.length === 1 ? origins[0] : origins });
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

bootstrap();
