import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getCachedMenuItem,
  menuItemFromDishHit,
  setMenuItems,
  upsertMenuItems,
} from './menuCache.js'

function memoryStorage() {
  const data = new Map()
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      data.set(String(key), String(value))
    },
    removeItem(key) {
      data.delete(String(key))
    },
    clear() {
      data.clear()
    },
  }
}

beforeEach(() => {
  globalThis.sessionStorage = memoryStorage()
})

describe('menuItemFromDishHit', () => {
  it('maps a dish search hit into the cart cache shape', () => {
    assert.deepEqual(
      menuItemFromDishHit({
        id: 12,
        name: 'Chicken Biryani',
        price: 199.6,
        imageUrl: ' https://img.example/biryani.jpg ',
        veg: false,
      }),
      {
        id: '12',
        name: 'Chicken Biryani',
        price: 200,
        img: 'https://img.example/biryani.jpg',
        veg: false,
      },
    )
  })

  it('omits veg when the hit does not say, and rejects a missing id', () => {
    const item = menuItemFromDishHit({ id: 'a', name: 'Soup', price: 80 })
    assert.equal(item.veg, undefined)
    assert.equal(Object.hasOwn(item, 'veg'), false)
    assert.equal(menuItemFromDishHit({ name: 'No id' }), null)
  })
})

describe('upsertMenuItems', () => {
  it('merges dish hits and leaves other cached dishes in place', () => {
    setMenuItems([{ id: 'a', name: 'A', price: 10, img: '', veg: true }])
    upsertMenuItems([
      menuItemFromDishHit({
        id: 'b',
        name: 'Biryani',
        price: 199,
        imageUrl: 'http://img',
        veg: true,
      }),
    ])
    assert.equal(getCachedMenuItem('a').name, 'A')
    assert.deepEqual(getCachedMenuItem('b'), {
      id: 'b',
      name: 'Biryani',
      price: 199,
      img: 'http://img',
      veg: true,
    })
  })

  it('refreshes a cached dish without dropping customise groups', () => {
    setMenuItems([
      {
        id: 'a',
        name: 'A',
        price: 10,
        img: 'old',
        veg: true,
        variants: [{ id: 'size' }],
      },
    ])
    upsertMenuItems([
      menuItemFromDishHit({
        id: 'a',
        name: 'A2',
        price: 12,
        imageUrl: 'new',
        veg: false,
      }),
    ])
    const item = getCachedMenuItem('a')
    assert.equal(item.name, 'A2')
    assert.equal(item.price, 12)
    assert.equal(item.img, 'new')
    assert.equal(item.veg, false)
    assert.deepEqual(item.variants, [{ id: 'size' }])
  })

  it('skips hits that cannot be stored', () => {
    upsertMenuItems([null, { name: 'nope' }, menuItemFromDishHit({ name: 'also nope' })])
    assert.equal(getCachedMenuItem('undefined'), null)
    assert.equal(sessionStorage.getItem('tataeats-menu-items'), '{}')
  })
})
