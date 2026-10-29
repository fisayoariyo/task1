import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authReducer, initialAuthState } from './authState.js'

const user = { id: 'user-1', fullName: 'Ada Lovelace', email: 'ada@example.com' }

test('a 401 session check clears the user and marks the session anonymous', () => {
  const state = authReducer(
    { user, status: 'authenticated', error: null },
    { type: 'session-anonymous' },
  )

  assert.deepEqual(state, { user: null, status: 'anonymous', error: null })
})

test('a session check failure remains visible without discarding an existing user', () => {
  const error = new Error('API unavailable')
  const state = authReducer(
    { user, status: 'authenticated', error: null },
    { type: 'session-error', error },
  )

  assert.deepEqual(state, { user, status: 'error', error })
})

test('a successful authentication stores the user and clears prior errors', () => {
  const error = new Error('Previous session check failed')
  const state = authReducer(
    { user: null, status: 'error', error },
    { type: 'user-authenticated', user },
  )

  assert.deepEqual(state, { user, status: 'authenticated', error: null })
})

test('a successful logout clears the user and returns to anonymous state', () => {
  const state = authReducer(
    { user, status: 'authenticated', error: null },
    { type: 'logout-success' },
  )

  assert.deepEqual(state, { user: null, status: 'anonymous', error: null })
})

test('session restore starts in loading state', () => {
  assert.deepEqual(initialAuthState, { user: null, status: 'loading', error: null })
})
