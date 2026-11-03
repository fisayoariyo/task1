import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('BFF smoke (e2e, DATA_SOURCE=mock)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATA_SOURCE = 'mock';
    delete process.env.REDIS_URL;
    // Provide a dummy DATABASE_URL so PrismaService can initialise.
    // onModuleInit now catches connection errors (warns instead of crashing),
    // so the BFF boots even without a live Postgres.
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://nomnom:nomnom@localhost:5432/nomnom?schema=public';
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /places/autocomplete returns mock suggestions', () => {
    return request(app.getHttpServer())
      .get('/places/autocomplete')
      .query({ input: 'Mumbai' })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toMatchObject({
          placeId: expect.any(String),
          description: expect.any(String),
        });
      });
  });

  it('GET /restaurants returns a paged restaurant list', () => {
    return request(app.getHttpServer())
      .get('/restaurants')
      .query({ lat: '19.076', lng: '72.8777' })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.restaurants)).toBe(true);
        expect(res.body.restaurants[0]).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          cuisines: expect.any(String),
        });
        expect(typeof res.body.hasMore).toBe('boolean');
      });
  });

  it('GET /restaurants/:id/menu returns mock menu', () => {
    return request(app.getHttpServer())
      .get('/restaurants/mock-rest-1/menu')
      .query({ lat: '19.076', lng: '72.8777' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          restaurantId: 'mock-rest-1',
          restaurantName: expect.any(String),
          categories: expect.any(Array),
        });
      });
  });

  it('GET /restaurants returns 400 when lat/lng missing', () => {
    return request(app.getHttpServer()).get('/restaurants').expect(400);
  });

  it('GET /restaurants returns 400 when lat/lng are not numbers', () => {
    return request(app.getHttpServer())
      .get('/restaurants')
      .query({ lat: 'abc', lng: '72.8777' })
      .expect(400);
  });

  it('GET /restaurants/:id/menu returns 400 when lat/lng missing', () => {
    return request(app.getHttpServer())
      .get('/restaurants/mock-rest-1/menu')
      .expect(400);
  });
});
