import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as api from './api.js'

const originalFetch = globalThis.fetch
const user = { id: 'user-1', fullName: 'Ada Lovelace', email: 'ada@example.com' }

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('getCurrentUser includes cookies and returns the current user', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://localhost:3001/auth/me')
    assert.equal(options.credentials, 'include')
    return jsonResponse(200, user)
  }

  assert.deepEqual(await api.getCurrentUser(), user)
})

test('login sends JSON credentials with cookies', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://localhost:3001/auth/login')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), {
      email: user.email,
      password: 'correct-horse-battery',
    })
    return jsonResponse(200, user)
  }

  assert.deepEqual(
    await api.login({ email: user.email, password: 'correct-horse-battery' }),
    user,
  )
})

test('register sends full name and credentials as JSON with cookies', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://localhost:3001/auth/register')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), {
      fullName: user.fullName,
      email: user.email,
      password: 'correct-horse-battery',
    })
    return jsonResponse(201, user)
  }

  assert.deepEqual(
    await api.register({
      fullName: user.fullName,
      email: user.email,
      password: 'correct-horse-battery',
    }),
    user,
  )
})

test('logout includes cookies and accepts a 204 response', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'http://localhost:3001/auth/logout')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.equal(options.headers['Content-Type'], 'application/json')
    return { ok: true, status: 204 }
  }

  assert.equal(await api.logout(), undefined)
})

test('auth errors preserve the HTTP status and server message', async () => {
  globalThis.fetch = async () => jsonResponse(401, { message: 'Invalid credentials' })

  await assert.rejects(
    api.login({ email: user.email, password: 'incorrect-password' }),
    (error) => {
      assert.equal(error.status, 401)
      assert.equal(error.message, 'Invalid credentials')
      return true
    },
  )
})

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}
