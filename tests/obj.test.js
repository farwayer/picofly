import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {store, obj, onWrite, onRead, lock, unlock} from 'picofly'


suite('obj', () => {
  let timerStore = () => {
    let o = {timer: {ticks: 0}}
    let s = store(o, [obj])
    return [o, s]
  }

  test('symbol prop', () => {
    let sym = Symbol('mine')
    let o = {[sym]: {n: 1}}
    let s = store(o, [obj])

    assert.equal(s[sym].n, 1)
    assert.notEqual(s[sym], o[sym])
  })

  test('create', () => {
    let [o, s] = timerStore()

    let sObj = JSON.parse(JSON.stringify(s))
    assert.deepEqual(sObj, o)
  })

  test('set', () => {
    let [o, s] = timerStore()

    s.timer.ticks = 1
    assert.equal(o.timer.ticks, 1)
    assert.equal(s.timer.ticks, 1)
  })

  test('delete', () => {
    let [o, s] = timerStore()

    delete s.timer.ticks
    assert.ok(!('ticks' in s.timer))
    assert.ok(!('ticks' in o.timer))
  })

  test('onWrite set root', () => {
    let [o, s] = timerStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o)
      hits.push(key)
    })

    s.show = true

    assert.deepEqual(hits, ['show'])
  })

  test('onWrite set nested', () => {
    let [o, s] = timerStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      hits.push(key)
    })

    s.timer.ticks = 1

    assert.deepEqual(hits, ['ticks'])
  })

  test('onWrite set int key no length', () => {
    let o = {}
    let s = store(o, [obj])

    let set = false

    onWrite(s, (obj, key) => {
      assert.equal(obj, o)
      assert.equal(key, '1')
      set = true
    })

    s[1] = 5

    assert.ok(set)
  })

  test('onWrite set same', () => {
    let [_, s] = timerStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.timer.ticks = 0
  })

  test('onWrite set same obj', () => {
    let [_, s] = timerStore()

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.timer = s.timer
  })

  test('onWrite delete nested', () => {
    let [o, s] = timerStore()
    let hits = []

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      hits.push(key)
    })

    delete s.timer.ticks

    assert.deepEqual(hits, ['ticks'])
  })

  test('lock', () => {
    let [_, s] = timerStore()

    lock(s)

    assert.throws(() => {
      s.timer.ticks = 1
    }, /"store locked!" is not a function/)

    assert.throws(() => {
      delete s.timer.ticks
    }, /"store locked!" is not a function/)
  })

  test('unlock', () => {
    let [o, s] = timerStore()

    lock(s)
    unlock(s)

    s.timer.ticks = 1

    assert.equal(o.timer.ticks, 1)
    assert.equal(s.timer.ticks, 1)
  })

  test('onRead root', () => {
    let [o, s] = timerStore()
    let hits = []

    onRead(s, (obj, key) => {
      assert.equal(obj, o)
      hits.push(key)
    })

    s.timer

    assert.deepEqual(hits, ['timer'])
  })

  test('onRead nested', () => {
    let [o, s] = timerStore()
    let hits = []

    onRead(s, (obj, key) => hits.push([obj, key]))

    s.timer.ticks

    assert.deepEqual(hits.map(([, key]) => key), ['timer', 'ticks'])
    assert.equal(hits[0][0], o)
    assert.equal(hits[1][0], o.timer)
  })

  test('symbol key write', () => {
    let sym = Symbol('mine')
    let o = {}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    s[sym] = 1

    assert.deepEqual(hits, [sym])
    assert.equal(o[sym], 1)
  })

  test('Object.assign notifies every key', () => {
    let o = {a: 0}
    let s = store(o, [obj])
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))
    Object.assign(s, {a: 1, b: 2})

    assert.deepEqual(hits, ['a', 'b'])
    assert.deepEqual(o, {a: 1, b: 2})
  })

  test('Reflect.set with a foreign receiver leaves the store alone', () => {
    let o = {a: 0}
    let s = store(o, [obj])
    let other = {}
    let hits = []

    onWrite(s, (_, prop) => hits.push(prop))

    assert.ok(Reflect.set(s, 'a', 5, other))
    assert.deepEqual(hits, [])
    assert.equal(o.a, 0)
    assert.equal(other.a, 5)
  })
})
