import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite} from 'picofly'


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

    assert.deepEqual(hits, ['3', 'length'])
  })

  test('onWrite push to empty', () => {
    let a = []
    let s = store(a, [obj])
    let hits = writes(s, a)

    s.push(5)

    assert.deepEqual(hits, ['0', 'length'])
  })

  test('onWrite set new length', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[3] = 5

    assert.deepEqual(hits, ['3', 'length'])
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

    assert.deepEqual(hits, ['2', 'length'])
  })

  test('onWrite set str no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['xxx'] = 5

    assert.deepEqual(hits, ['xxx'])
    assert.equal(s.length, 3)
  })

  test('onWrite set not int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[0.5] = 5

    assert.deepEqual(hits, ['0.5'])
    assert.equal(s.length, 3)
  })

  test('onWrite set zero prefix int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['05'] = 5

    assert.deepEqual(hits, ['05'])
    assert.equal(s.length, 3)
  })

  test('onWrite set neg int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[-5] = 5

    assert.deepEqual(hits, ['-5'])
    assert.equal(s.length, 3)
  })

  test('onWrite set str digit start no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['4xx'] = 5

    assert.deepEqual(hits, ['4xx'])
    assert.equal(s.length, 3)
  })

  test('onWrite set exp int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s['1e3'] = 5

    assert.deepEqual(hits, ['1e3'])
    assert.equal(s.length, 3)
  })

  test('onWrite set sparse zero idx no length change', () => {
    let a = [, 2, 3]
    let s = store(a, [obj])
    let hits = writes(s, a)

    s[0] = 1

    assert.deepEqual(hits, ['0'])
    assert.equal(s.length, 3)
  })

  test('onWrite set large int no length change', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    s[4294967295] = 5

    assert.deepEqual(hits, ['4294967295'])
    assert.equal(s.length, 3)
  })

  test('onWrite splice', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.deepEqual(s.splice(1, 1), [2])
    assert.deepEqual(hits, ['1', '2', 'length'])
    assert.deepEqual(a, [1, 3])
  })

  test('onWrite shift', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.equal(s.shift(), 1)
    assert.deepEqual(hits, ['0', '1', '2', 'length'])
    assert.deepEqual(a, [2, 3])
  })

  test('onWrite unshift', () => {
    let [a, s] = arrStore()
    let hits = writes(s, a)

    assert.equal(s.unshift(0), 4)
    assert.deepEqual(hits, ['3', 'length', '2', '1', '0'])
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
    assert.deepEqual(hits, ['length'])
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
  test('symbol key write', () => {
    let [a, s] = arrStore()
    let sym = Symbol('mine')
    let hits = writes(s, a)

    s[sym] = 1

    assert.deepEqual(hits, [sym])
    assert.equal(a[sym], 1)
    assert.equal(a.length, 3)
  })
})
