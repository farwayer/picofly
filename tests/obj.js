import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {create, obj, onWrite, onRead, lock, unlock} from 'picofly'


let timerStore = () => {
  let o = {timer: {ticks: 0}}
  let s = create(o, obj)
  return [o, s]
}

test('create', () => {
  let [o, s] = timerStore()

  let sObj = JSON.parse(JSON.stringify(s))
  assert.equal(sObj, o)
})

test('set', () => {
  let [o, s] = timerStore()

  s.timer.ticks = 1
  assert.is(o.timer.ticks, 1)
  assert.is(s.timer.ticks, 1)
})

test('define', () => {
  let [o, s] = timerStore()

  Object.defineProperty(s.timer, 'interval', {value: 1000})
  assert.is(o.timer.interval, 1000)
  assert.is(s.timer.interval, 1000)
})

test('delete', () => {
  let [o, s] = timerStore()

  delete s.timer.ticks
  assert.not('ticks' in s.timer)
  assert.not('ticks' in o.timer)
})

test('onWrite set root', () => new Promise(resolve => {
  let [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o)
    assert.is(key, 'show')
    resolve()
  })

  s.show = true
  assert.unreachable()
}))

test('onWrite set nested', () => new Promise(resolve => {
  let [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o.timer)
    assert.is(key, 'ticks')
    resolve()
  })

  s.timer.ticks = 1
  assert.unreachable()
}))

test('onWrite set same', () => {
  let [_, s] = timerStore()

  onWrite(s, () => {
    assert.unreachable()
  })

  s.timer.ticks = 0
})

test('onWrite set same obj', () => {
  let [_, s] = timerStore()

  onWrite(s, () => {
    assert.unreachable()
  })

  s.timer = s.timer
})

test('onWrite define nested', () => new Promise(resolve => {
  let [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o.timer)
    assert.is(key, 'interval')
    resolve()
  })

  Object.defineProperty(s.timer, 'interval', {value: 1000})
  assert.unreachable()
}))

test('onWrite delete nested', () => new Promise(resolve => {
  let [o, s] = timerStore()

  onWrite(s, (obj, key) => {
    assert.is(obj, o.timer)
    assert.is(key, 'ticks')
    resolve()
  })

  delete s.timer.ticks
  assert.unreachable()
}))

test('lock', () => {
  let [_, s] = timerStore()

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
  let [o, s] = timerStore()

  lock(s)
  unlock(s)

  s.timer.ticks = 1

  assert.is(o.timer.ticks, 1)
  assert.is(s.timer.ticks, 1)
})

test('onRead root', () => new Promise(resolve => {
  let [o, s] = timerStore()

  onRead(s, (obj, key) => {
    assert.is(obj, o)
    assert.is(key, 'timer')
    resolve()
  })

  s.timer
  assert.unreachable()
}))

test('onRead nested', () => new Promise(resolve => {
  let [o, s] = timerStore()

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

test.run()
