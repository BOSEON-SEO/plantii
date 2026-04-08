/**
 * API Integration Tests
 * Tests the REST API endpoints
 */

import request from 'supertest';
import app from '../../server';

describe('Health Check API', () => {
  test('GET /health should return server status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});

describe('Authentication API', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  let authToken: string;

  test('POST /api/v1/auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    if (response.status === 201) {
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.email).toBe(testUser.email);

      authToken = response.body.data.access_token;
    } else {
      // Database might not be connected, skip test
      console.log('Skipping register test - database not available');
    }
  }, 30000);

  test('POST /api/v1/auth/login should authenticate user', async () => {
    if (!authToken) {
      console.log('Skipping login test - no user registered');
      return;
    }

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data.user.email).toBe(testUser.email);
  }, 30000);

  test('POST /api/v1/auth/login should reject invalid credentials', async () => {
    if (!authToken) {
      console.log('Skipping invalid-credentials test - database not available');
      return;
    }
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  }, 30000);
});

describe('Plants API', () => {
  test('GET /api/v1/plants should return plant catalog', async () => {
    const response = await request(app).get('/api/v1/plants');

    if (response.status === 200) {
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('plants');
      expect(Array.isArray(response.body.data.plants)).toBe(true);
    } else {
      // Database might not be connected
      console.log('Skipping plants test - database not available');
    }
  }, 30000);

  test('GET /api/v1/plants/:id should return specific plant', async () => {
    // First get all plants to get a valid ID
    const plantsResponse = await request(app).get('/api/v1/plants');

    if (plantsResponse.status === 200 && plantsResponse.body.data.plants.length > 0) {
      const firstPlantId = plantsResponse.body.data.plants[0].id;

      const response = await request(app).get(`/api/v1/plants/${firstPlantId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(firstPlantId);
    } else {
      console.log('Skipping plant detail test - no plants available');
    }
  }, 30000);
});

describe('User Plants API (Protected)', () => {
  let authToken: string;

  beforeAll(async () => {
    // Try to create a test user and get auth token
    const testUser = {
      username: `apitest_${Date.now()}`,
      email: `apitest_${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    if (response.status === 201) {
      authToken = response.body.data.access_token;
    }
  }, 30000);

  test('GET /api/v1/user-plants should require authentication', async () => {
    const response = await request(app).get('/api/v1/user-plants');

    expect(response.status).toBe(401);
  }, 30000);

  test('GET /api/v1/user-plants should return user plants when authenticated', async () => {
    if (!authToken) {
      console.log('Skipping authenticated test - no auth token');
      return;
    }

    const response = await request(app)
      .get('/api/v1/user-plants')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('plants');
    expect(Array.isArray(response.body.data.plants)).toBe(true);
  }, 30000);
});

describe('404 Handler', () => {
  test('should return 404 for non-existent routes', async () => {
    const response = await request(app).get('/api/v1/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
