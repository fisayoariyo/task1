import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { placeOrder, validateOrderContact } from './placeOrder.js'

test('validateOrderContact requires name and phone', () => {
  assert.equal(validateOrderContact({ name: '', phone: '999' }).ok, false)
  assert.equal(validateOrderContact({ name: 'Ada', phone: '' }).ok, false)
  const ok = validateOrderContact({ name: ' Ada ', phone: ' 999 ' })
  assert.equal(ok.ok, true)
  assert.deepEqual(ok.contact, { name: 'Ada', phone: '999', email: '' })
})

test('placeOrder posts to API and returns the server order', async () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = mock.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({
      id: 'ord-1',
      mode: 'live',
      grand: 100,
      userId: 'u1',
      contact: { name: 'Ada', phone: '999', email: '' },
      items: [],
    }),
  }))

  try {
    const order = await placeOrder({
      lines: [{ id: '1', name: 'Dish', price: 100, qty: 1 }],
      grand: 100,
      count: 1,
      placeLabel: 'Mumbai',
      contact: { name: 'Ada', phone: '999' },
      user: { id: 'u1', fullName: 'Ada', email: 'a@b.c' },
    })
    assert.equal(order.mode, 'live')
    assert.equal(order.id, 'ord-1')
    assert.equal(order.userId, 'u1')
    assert.equal(order.grand, 100)
    assert.equal(globalThis.fetch.mock.callCount(), 1)
  } finally {
    globalThis.fetch = previousFetch
  }
})
