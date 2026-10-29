import assert from 'node:assert/strict'
import { test } from 'node:test'
import { passwordValidationMessage } from './authValidation.js'

test('rejects passwords shorter than eight characters', () => {
  assert.equal(passwordValidationMessage('1234567'), 'Password must be 8–72 characters.')
})

test('accepts an eight-character password', () => {
  assert.equal(passwordValidationMessage('12345678'), null)
})

test('accepts a 72-character password', () => {
  assert.equal(passwordValidationMessage('a'.repeat(72)), null)
})

test('rejects passwords longer than 72 characters', () => {
  assert.equal(passwordValidationMessage('a'.repeat(73)), 'Password must be 8–72 characters.')
})
