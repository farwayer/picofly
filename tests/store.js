// noinspection BadExpressionStatementJS

import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {store, onWrite, lock, unlock} from '../src/store.js'


test('store', () => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  const sObj = JSON.parse(JSON.stringify(s))
  assert.equal(sObj, o)
})

test('set', () => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  s.timer.ticks = 1
  assert.is(o.timer.ticks, 1)
  assert.is(s.timer.ticks, 1)
})

test('define', () => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  Object.defineProperty(s.timer, 'interval', {value: 1000})
  assert.is(o.timer.interval, 1000)
  assert.is(s.timer.interval, 1000)
})

test('delete', () => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  delete s.timer.ticks
  assert.not('ticks' in s.timer)
  assert.not('ticks' in o.timer)
})

test('onWrite set root', () => new Promise(resolve => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  onWrite(s, (obj, prop) => {
    assert.is(obj, o)
    assert.is(prop, 'show')
    resolve()
  })

  s.show = true
  assert.unreachable()
}))

test('onWrite set nested', () => new Promise(resolve => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  onWrite(s, (obj, prop) => {
    assert.is(obj, o.timer)
    assert.is(prop, 'ticks')
    resolve()
  })

  s.timer.ticks = 1
  assert.unreachable()
}))

test('onWrite define nested', () => new Promise(resolve => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  onWrite(s, (obj, prop) => {
    assert.is(obj, o.timer)
    assert.is(prop, 'interval')
    resolve()
  })

  Object.defineProperty(s.timer, 'interval', {value: 1000})
  assert.unreachable()
}))

test('onWrite delete nested', () => new Promise(resolve => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  onWrite(s, (obj, prop) => {
    assert.is(obj, o.timer)
    assert.is(prop, 'ticks')
    resolve()
  })

  delete s.timer.ticks
  assert.unreachable()
}))

test('lock', () => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  lock(s)

  assert.throws(() => {
    s.timer.ticks = 1
  }, /"store locked!" is not a function/)
})

test('unlock', () => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  lock(s, () => {
    assert.unreachable()
  })
  unlock(s)

  s.timer.ticks = 1

  assert.is(o.timer.ticks, 1)
  assert.is(s.timer.ticks, 1)
})

test('onRead root', () => new Promise(resolve => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  lock(s, (obj, prop) => {
    assert.is(obj, o)
    assert.is(prop, 'timer')
    resolve()
  })

  s.timer
  assert.unreachable()
}))

test('onRead nested', () => new Promise(resolve => {
  const o = {timer: {ticks: 0}}
  const s = store(o)

  let called = 0

  lock(s, (obj, prop) => {
    if (!called++) {
      assert.is(obj, o)
      assert.is(prop, 'timer')
    } else {
      assert.is(obj, o.timer)
      assert.is(prop, 'ticks')
      resolve()
    }
  })

  s.timer.ticks
  assert.unreachable()
}))

test.skip('ref', () => {
  const o = {timer: {ticks: 0}}
  const refObj = {show: true}
  const w = store(o)

  w.options = ref(w, refObj)
  assert.is(w.options, refObj)
  assert.is(w.options.show, true)

  onWrite(w, () => {
    assert.unreachable()
  })

  w.options.show = false
})


test.run()
