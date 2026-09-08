import request from 'supertest';
import app from '../app';

describe('legacy relationship request flow', () => {
  const relationshipId = '00000000-0000-4000-8000-000000000001';

  it.each([
    ['creates a relationship request', 'post', '/api/relationships/request'],
    ['lists legacy pending relationships', 'get', '/api/relationships/pending'],
    ['accepts a legacy relationship', 'patch', `/api/relationships/${relationshipId}/accept`],
    ['declines a legacy relationship', 'patch', `/api/relationships/${relationshipId}/decline`],
  ])('does not expose an endpoint that %s', async (_operation, method, path) => {
    const response = await request(app)[method as 'get' | 'post' | 'patch'](path)
      .send({ coachId: relationshipId });

    expect(response).toHaveProperty('status', 404);
    expect(response.body).toMatchObject({ error: 'Not Found' });
  });
});
