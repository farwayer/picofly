import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite, onRead, lock} from 'picofly'


// what a set trap would have to keep working: assignment to an accessor never
// reaches the traps, the engine calls the setter with the proxy as receiver,
// and the writes it makes land on the store
suite('accessors', () => {
  test('setter on the prototype notifies what it wrote', () => {
    class State {
      a = 0
      b = 0

      set both(v) {
        this.a = v
        this.b = v * 2
      }
    }

    let o = new State()
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.both = 5

    assert.deepEqual(hits, ['a', 'b'])
    assert.equal(o.a, 5)
    assert.equal(o.b, 10)
  })

  test('own setter notifies what it wrote', () => {
    let o = {
      a: 0,
      set double(v) {
        this.a = v * 2
      },
    }
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.double = 3

    assert.deepEqual(hits, ['a'])
    assert.equal(o.a, 6)
  })

  test('accessor with a getter notifies its own prop too', () => {
    let o = {
      _n: 1,
      get n() {
        return this._n
      },
      set n(v) {
        this._n = v
      },
    }
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.n = 2

    assert.deepEqual(hits, ['_n', 'n'])
    assert.equal(o._n, 2)
  })

  test('accessor through an outer proxy notifies its own prop too', () => {
    class State {
      _n = 1

      get n() {
        return this._n
      }

      set n(v) {
        this._n = v
      }
    }

    let o = new State()
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    new Proxy(s, {}).n = 2

    assert.deepEqual(hits, ['_n', 'n'])
    assert.equal(o._n, 2)
  })

  // gap: the getter runs while we read the prop for the comparison, and what it
  // writes on the way is never announced. The mutation is ours, but the value
  // outside did move
  test('a getter that writes is not announced', () => {
    let o = {
      reads: 0,
      _n: 1,

      get n() {
        this.reads++
        return this._n
      },

      set n(v) {
        this._n = v
      },
    }
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s.n = 2

    assert.deepEqual(hits, ['_n', 'n'])
    assert.equal(o.reads, 2)
  })

  test('setter writing a nested object notifies that object', () => {
    let o = {
      timer: {ticks: 0},
      set tick(v) {
        this.timer.ticks = v
      },
    }
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (target, prop) => hits.push([target, prop]))
    s.tick = 7

    assert.deepEqual(hits, [[o.timer, 'ticks']])
    assert.equal(o.timer.ticks, 7)
  })

  test('getter tracks the props it reads', () => {
    let o = {
      a: 1,
      b: 2,
      get sum() {
        return this.a + this.b
      },
    }
    let s = store(o, [obj])
    let reads = []

    onRead(s, (_, prop) => reads.push(prop))

    assert.equal(s.sum, 3)
    assert.deepEqual(reads, ['a', 'b', 'sum'])
  })

  test('getter returns the cached proxy', () => {
    let o = {
      data: {n: 1},
      get first() {
        return this.data
      },
    }
    let s = store(o, [obj])

    assert.equal(s.first, s.data)
    assert.notEqual(s.first, o.data)
    assert.equal(s.first.n, 1)
  })
  test('locked store throws from inside a setter', () => {
    let o = {
      a: 0,
      set both(v) {
        this.a = v
      },
    }
    let s = store(o, [obj])

    lock(s)

    assert.throws(() => {
      s.both = 5
    }, /"store locked!" is not a function/)
    assert.equal(o.a, 0)
  })
})
