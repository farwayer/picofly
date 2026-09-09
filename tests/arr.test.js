import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite} from 'picofly'
import {KeysSym} from '../src/rules/utils.js'


suite('arr', () => {
  let arrStore = () => {
    let a = [1, 2, 3]
    let s = store(a, [obj])
    return [a, s]
  }

  // array methods are sequences of writes and deletes: the notification stream
  // is what a set trap would change, so it is pinned here
  let writes = (s, raw) => {
    let hits = []

    onWrite(s, (arr, prop) => {
      assert.equal(arr, raw)
      hits.push(prop)
    })

    return hits
  }

  test('iterable', () => {
    let s = store([1, 2], [obj])

    assert.deepEqual([...s], [1, 2])

    let sum = 0
    for (let n of s) sum += n
    assert.equal(sum, 3)
  })

  test('create', () => {
    let [a, s] = arrStore()

    let sArr = JSON.parse(JSON.stringify(s))
    assert.deepEqual(sArr, a)
  })

  test('set', () => {
    let [a, s] = arrStore()

    s[0] = 5
    assert.equal(a[0], 5)
    assert.equal(s[0], 5)
  })

  test('push', () => {
    let [a, s] = arrStore()

    s.push(5)
    assert.equal(a[3], 5)
    assert.equal(s[3], 5)
  })

  test('onWrite push', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.push(5)

    assert.deepEqual(hits, [KeysSym, '3', 'length'])
  })

  test('onWrite push to empty', () => {
    let a = []
    let s = store(a, [obj])
    let hits = writes(s, a)

    s.push(5)

    assert.deepEqual(hits, [KeysSym, '0', 'length'])
  })

  test('onWrite set new length', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[3] = 5

    assert.deepEqual(hits, [KeysSym, '3', 'length'])
  })

  test('onWrite set no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[0] = 5

    assert.deepEqual(hits, ['0'])
  })

  test('onWrite set existing int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[1] = 5

    assert.deepEqual(hits, ['1'])
    assert.equal(s.length, 3)
  })

  test('onWrite pop', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.pop()

    assert.deepEqual(hits, [KeysSym, '2', 'length'])
  })

  test('onWrite set str no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['xxx'] = 5

    assert.deepEqual(hits, [KeysSym, 'xxx'])
    assert.equal(s.length, 3)
  })

  test('onWrite set not int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[0.5] = 5

    assert.deepEqual(hits, [KeysSym, '0.5'])
    assert.equal(s.length, 3)
  })

  test('onWrite set zero prefix int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['05'] = 5

    assert.deepEqual(hits, [KeysSym, '05'])
    assert.equal(s.length, 3)
  })

  test('onWrite set neg int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[-5] = 5

    assert.deepEqual(hits, [KeysSym, '-5'])
    assert.equal(s.length, 3)
  })

  test('onWrite set str digit start no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['4xx'] = 5

    assert.deepEqual(hits, [KeysSym, '4xx'])
    assert.equal(s.length, 3)
  })

  test('onWrite set exp int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['1e3'] = 5

    assert.deepEqual(hits, [KeysSym, '1e3'])
    assert.equal(s.length, 3)
  })

  test('onWrite set sparse zero idx no length change', () => {
    let a = [, 2, 3]
    let s = store(a, [obj])
    let hits = writes(s, a)

    s[0] = 1

    assert.deepEqual(hits, [KeysSym, '0'])
    assert.equal(s.length, 3)
  })

  test('onWrite set large int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[4294967295] = 5

    assert.deepEqual(hits, [KeysSym, '4294967295'])
    assert.equal(s.length, 3)
  })

  test('onWrite splice', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.deepEqual(s.splice(1, 1), [2])
    assert.deepEqual(hits, ['1', KeysSym, '2', 'length'])
    assert.deepEqual(a, [1, 3])
  })

  test('onWrite shift', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.equal(s.shift(), 1)
    assert.deepEqual(hits, ['0', '1', KeysSym, '2', 'length'])
    assert.deepEqual(a, [2, 3])
  })

  test('onWrite unshift', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.equal(s.unshift(0), 4)
    assert.deepEqual(hits, [KeysSym, '3', 'length', '2', '1', '0'])
    assert.deepEqual(a, [0, 1, 2, 3])
  })

  test('onWrite sort', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.sort((x, y) => y - x)
    assert.deepEqual(hits, ['0', '2'])
    assert.deepEqual(a, [3, 2, 1])
  })

  test('onWrite reverse', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.reverse()
    assert.deepEqual(hits, ['0', '2'])
    assert.deepEqual(a, [3, 2, 1])
  })

  test('onWrite fill', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.fill(0)
    assert.deepEqual(hits, ['0', '1', '2'])
    assert.deepEqual(a, [0, 0, 0])
  })

  test('onWrite copyWithin', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.copyWithin(0, 1)
    assert.deepEqual(hits, ['0', '1'])
    assert.deepEqual(a, [2, 3, 3])
  })

  test('onWrite length truncate', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.length = 1
    assert.deepEqual(hits, [KeysSym, 'length', '2', '1'])
    assert.deepEqual(a, [1])
  })

  test('onWrite length truncate holes', () => {
    let a = [1, , 3]
    let s = store(a, [obj])
    let hits = writes(s, a)

    s.length = 0
    assert.deepEqual(hits, [KeysSym, 'length', '2', '0'])
    assert.deepEqual(a, [])
  })

  test('onWrite length same', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.length = 3
    assert.deepEqual(hits, [])
    assert.deepEqual(a, [1, 2, 3])
  })

  test('onWrite pop', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.equal(s.pop(), 3)
    assert.deepEqual(hits, [KeysSym, '2', 'length'])
    assert.deepEqual(a, [1, 2])
  })

  test('onWrite length truncate str', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.length = '1'
    assert.deepEqual(hits, [KeysSym, 'length', '2', '1'])
    assert.deepEqual(a, [1])
  })

  test('onWrite length truncate holes only', () => {
    let a = [1]
    a.length = 5
    let s = store(a, [obj])
    let hits = writes(s, a)

    s.length = 1
    assert.deepEqual(hits, ['length'])
    assert.deepEqual(a, [1])
  })

  // gap: an array whose prototype carries indexes hears about holes it never
  // had. `in` sees the prototype, and telling that apart costs a scan nobody
  // needs
  test('onWrite length truncate inherited idx', () => {
    let a = [1]
    a.length = 3
    Object.setPrototypeOf(a, [9, 9, 9])
    let s = store(a, [obj])
    let hits = writes(s, a)

    s.length = 0
    assert.deepEqual(hits, [KeysSym, 'length', '2', '1', '0'])
    assert.equal(s[1], 9)
  })

  test('onWrite length truncate keeps props', () => {
    let sym = Symbol('mine')
    let [a, s] = arrStore()
    a.x = 1
    a[sym] = 2
    let hits = writes(s, a)

    s.length = 0
    assert.deepEqual(hits, [KeysSym, 'length', '2', '1', '0'])
    assert.equal(a.x, 1)
    assert.equal(a[sym], 2)
  })

  test('onWrite length truncate two subs', () => {
    let [a, s] = arrStore()
    let one = writes(s, a)
    let two = writes(s, a)

    s.length = 1
    assert.deepEqual(one, [KeysSym, 'length', '2', '1'])
    assert.deepEqual(two, [KeysSym, 'length', '2', '1'])
  })

  test('onWrite length invalid notifies nothing', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.throws(() => s.length = -1, RangeError)
    assert.throws(() => s.length = 1.5, RangeError)
    assert.deepEqual(hits, [])
    assert.deepEqual(a, [1, 2, 3])
  })

  // gap: a non-configurable element stops the truncation halfway. The write
  // throws, length stops at the kept element, and no one hears about the index
  // that did go
  test('onWrite length truncate non-configurable idx', () => {
    let [a, s] = arrStore()
    Object.defineProperty(a, 1, {value: 2, configurable: false})
    let hits = writes(s, a)

    assert.throws(() => s.length = 0, TypeError)
    assert.deepEqual(hits, [])
    assert.equal(a.length, 2)
    assert.ok(!(2 in a))
  })

  test('onWrite length truncate outer proxy', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    new Proxy(s, {}).length = 1
    assert.deepEqual(hits, [KeysSym, 'length', '2', '1'])
    assert.deepEqual(a, [1])
  })

  test('onWrite length grow', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s.length = 5
    assert.deepEqual(hits, ['length'])
    assert.equal(a.length, 5)
    assert.ok(!(3 in a))
  })
  // gap: `Array.isArray` is true for a proxy over an array, so length can be
  // served by a foreign trap that answers by receiver. Reading it the way our
  // reader sees it costs two `Reflect.get` on every push, and pushes are worth
  // more than a proxied array
  test('length behind a foreign proxy notifies nothing', () => {
    let a = [1, 2, 3]
    let theirs = new Proxy(a, {
      get(target, prop, receiver) {
        return prop === 'length' && receiver === theirs
          ? 99
          : Reflect.get(target, prop, receiver)
      },
    })

    let s = store(theirs, [obj])
    let hits = writes(s, theirs)

    s[3] = 4

    assert.deepEqual(hits, [KeysSym, '3'])
    assert.equal(a.length, 4)
  })

  test('symbol key write', () => {
    let [a, s] = arrStore()
    let sym = Symbol('mine')
    let hits = writes(s, a)

    s[sym] = 1

    assert.deepEqual(hits, [KeysSym, sym])
    assert.equal(a[sym], 1)
    assert.equal(a.length, 3)
  })

  test('delete inherited index notifies nothing', () => {
    let proto = [1, 2, 3]
    let a = Object.create(proto)
    let s = store(a, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s[1]

    assert.deepEqual(hits, [])
    assert.equal(s[1], 2)
  })

  test('delete non-configurable index returns false', () => {
    let a = []
    Object.defineProperty(a, 0, {value: 1, configurable: false})

    let s = store(a, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.equal(Reflect.deleteProperty(s, '0'), false)
    assert.equal(a[0], 1)
    assert.deepEqual(hits, [])
  })

  test('delete length returns false', () => {
    let [a, s] = arrStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.equal(Reflect.deleteProperty(s, 'length'), false)
    assert.equal(a.length, 3)
    assert.deepEqual(hits, [])
  })

  test('delete index past the end notifies nothing', () => {
    let [, s] = arrStore()
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    delete s[5]

    assert.deepEqual(hits, [])
  })
})
