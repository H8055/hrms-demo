import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET / returns API metadata', async () => {
  const response = await request(app).get('/');
  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'HRMS API is running');
});

test('GET /api/health returns ok status', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('GET /api/docs responds with swagger UI html', async () => {
  const response = await request(app).get('/api/docs');
  assert.equal(response.status, 301);
});
