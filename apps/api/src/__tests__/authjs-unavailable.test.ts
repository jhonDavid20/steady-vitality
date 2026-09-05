import request from 'supertest';
import app from '../app';

describe('removed Auth.js bridge', () => {
  const userId = '00000000-0000-4000-8000-000000000001';

  it.each([
    ['reads users', 'get', `/api/authjs/user/${userId}`],
    ['creates users', 'post', '/api/authjs/user'],
    ['deletes sessions', 'delete', '/api/authjs/session/session-token'],
  ])('does not expose routes that %s', async (_operation, method, path) => {
    const response = await request(app)[method as 'get' | 'post' | 'delete'](path)
      .send({ email: 'unauthorized@example.com' });

    expect(response).toHaveProperty('status', 404);
    expect(response.body).toMatchObject({ error: 'Not Found' });
  });
});
