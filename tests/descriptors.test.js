import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite} from 'picofly'
import {KeysSym} from '../src/rules/utils.js'


// property shapes a write has to respect: writability, frozen targets,
// inherited data props and array holes. all of it is engine behaviour the set
// trap has to keep
suite('descriptors', () => {
  test('non-writable prop keeps its value', () => {
    let o = {}
    Object.defineProperty(o, 'ro', {value: 1, enumerable: true})
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.throws(() => {
      s.ro = 2
    }, TypeError)
    assert.equal(o.ro, 1)
    assert.deepEqual(hits, [])
  })

  test('frozen object rejects the write', () => {
    let o = Object.freeze({n: 1})
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.throws(() => {
      s.n = 2
    }, TypeError)
    assert.equal(o.n, 1)
    assert.deepEqual(hits, [])
  })

  test('inherited prop becomes own on write', () => {
    let proto = {n: 1}
    let o = Object.create(proto)
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.n = 2

    assert.deepEqual(hits, ['n'])
    assert.ok(Object.hasOwn(o, 'n'))
    assert.equal(proto.n, 1)
    assert.equal(s.n, 2)
  })

  test('prototype is kept', () => {
    class State {
      n = 1
    }

    let o = new State()
    let s = store(o, [obj])

    assert.equal(Object.getPrototypeOf(s), State.prototype)
    assert.ok(s instanceof State)
  })

  test('sparse write keeps the holes', () => {
    let a = [1, 2, 3]
    let s = store(a, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s[5] = 9

    assert.deepEqual(hits, [KeysSym, '5', 'length'])
    assert.equal(a.length, 6)
    assert.ok(!(4 in a))
    assert.ok(!(4 in s))
  })

  test('shadowing with the same value notifies nothing', () => {
    let proto = {n: 1}
    let o = Object.create(proto)
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.n = 1

    assert.deepEqual(hits, [])
    assert.ok(Object.hasOwn(o, 'n'))
    assert.equal(proto.n, 1)
  })

  test('inherited non-writable prop rejects the write', () => {
    let proto = {}
    Object.defineProperty(proto, 'n', {value: 1})
    let o = Object.create(proto)
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.throws(() => {
      s.n = 2
    }, TypeError)
    assert.deepEqual(hits, [])
    assert.ok(!Object.hasOwn(o, 'n'))
    assert.equal(s.n, 1)
  })

  test('write to a getter-only prop throws', () => {
    let o = {
      get ro() {
        return 1
      },
    }
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.throws(() => {
      s.ro = 2
    }, TypeError)
    assert.equal(o.ro, 1)
    assert.deepEqual(hits, [])
  })

  test('write to a sealed existing prop works', () => {
    let o = Object.seal({a: 1})
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.a = 2

    assert.deepEqual(hits, ['a'])
    assert.equal(o.a, 2)
  })

  // gap: there is no defineProperty trap, so the write goes straight to the
  // target. The data changes and nobody hears about it, which also covers
  // Object.assign of a getter and anything else defining rather than setting
  test('defineProperty notifies nothing', () => {
    let o = {a: 1}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    Object.defineProperty(s, 'b', {
      value: 2,
      writable: true,
      enumerable: true,
      configurable: true,
    })
    Object.defineProperty(s, 'a', {value: 9})

    assert.deepEqual(hits, [])
    assert.equal(o.a, 9)
    assert.equal(o.b, 2)
  })

  test('adding to a non-extensible object notifies nothing', () => {
    for (let make of [Object.freeze, Object.seal, Object.preventExtensions]) {
      let o = make({a: 1})
      let s = store(o, [obj])
      let hits = []

      onWrite(s, (_, prop) => hits.push(prop))

      assert.throws(() => {
        s.b = 2
      }, TypeError)
      assert.deepEqual(hits, [])
      assert.ok(!('b' in o))
    }
  })
})
