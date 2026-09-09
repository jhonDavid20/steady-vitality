import request from 'supertest';
import app from '../app';

describe('service health', () => {
  it('keeps the public liveness response free of infrastructure details', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'healthy' });
    expect(response.body).not.toHaveProperty('database');
    expect(response.body).not.toHaveProperty('environment');
  });
});
