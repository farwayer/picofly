// noinspection BadExpressionStatementJS

import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {createStore, onWrite, lock, unlock, onRead} from '../src/store.js'
import {obj} from '../src/proxify.js'


const timerStore = () => {
  const o = {timer: {ticks: 0}}
  const s = createStore(o, obj)
  return [o, s]
}

test('create', () => {
  const [o, s] = timerStore()

  const sObj = JSON.parse(JSON.stringify(s))
  assert.equal(sObj, o)
})

test('set', () => {
  const [o, s] = timerStore()

  s.timer.ticks = 1
  assert.is(o.timer.ticks, 1)
  assert.is(s.timer.ticks, 1)
})

test('define', () => {
  const [o, s] = timerStore()

  Object.defineProperty(s.timer, 'interval', {value: 1000})
  assert.is(o.timer.interval, 1000)
  assert.is(s.timer.interval, 1000)
})

test('delete', () => {
  const [o, s] = timerStore()

  delete s.timer.ticks
  assert.not('ticks' in s.timer)
  assert.not('ticks' in o.timer)
})

test('onWrite set root', () => new Promise(resolve => {
  const [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o)
    assert.is(key, 'show')
    resolve()
  })

  s.show = true
  assert.unreachable()
}))

test('onWrite set nested', () => new Promise(resolve => {
  const [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o.timer)
    assert.is(key, 'ticks')
    resolve()
  })

  s.timer.ticks = 1
  assert.unreachable()
}))

test('onWrite set same', () => {
  const [_, s] = timerStore()

  onWrite(s, () => {
    assert.unreachable()
  })

  s.timer.ticks = 0
})

test('onWrite define nested', () => new Promise(resolve => {
  const [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o.timer)
    assert.is(key, 'interval')
    resolve()
  })

  Object.defineProperty(s.timer, 'interval', {value: 1000})
  assert.unreachable()
}))

test('onWrite delete nested', () => new Promise(resolve => {
  const [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o.timer)
    assert.is(key, 'ticks')
    resolve()
  })

  delete s.timer.ticks
  assert.unreachable()
}))

test('lock', () => {
  const [_, s] = timerStore()

  lock(s)

  assert.throws(() => {
    s.timer.ticks = 1
  }, /"store locked!" is not a function/)

  assert.throws(() => {
    Object.defineProperty(s.timer, 'interval', {value: 1000})
  }, /"store locked!" is not a function/)

  assert.throws(() => {
    delete s.timer.ticks
  }, /"store locked!" is not a function/)
})

test('unlock', () => {
  const [o, s] = timerStore()

  lock(s)
  unlock(s)

  s.timer.ticks = 1

  assert.is(o.timer.ticks, 1)
  assert.is(s.timer.ticks, 1)
})

test('onRead root', () => new Promise(resolve => {
  const [o, s] = timerStore()

  onRead(s, (obj, key) => {
    assert.is(obj, o)
    assert.is(key, 'timer')
    resolve()
  })

  s.timer
  assert.unreachable()
}))

test('onRead nested', () => new Promise(resolve => {
  const [o, s] = timerStore()

  let called = 0

  onRead(s, (obj, key) => {
    if (!called++) {
      assert.is(obj, o)
      assert.is(key, 'timer')
    } else {
      assert.is(obj, o.timer)
      assert.is(key, 'ticks')
      resolve()
    }
  })

  s.timer.ticks
  assert.unreachable()
}))

test.skip('ref', () => {
  const [o, s] = timerStore()
  const refObj = {show: true}

  s.options = ref(s, refObj)
  assert.is(s.options, refObj)
  assert.is(s.options.show, true)

  onWrite(s, () => {
    assert.unreachable()
  })

  s.options.show = false
})


test.run()
