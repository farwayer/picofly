import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {create, obj, onWrite, onRead, lock, unlock} from 'picofly'


suite('obj', () => {
  let timerStore = () => {
    let o = {timer: {ticks: 0}}
    let s = create(o, obj)
    return [o, s]
  }

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

  test('define', () => {
    let [o, s] = timerStore()

    Object.defineProperty(s.timer, 'interval', {value: 1000})
    assert.equal(o.timer.interval, 1000)
    assert.equal(s.timer.interval, 1000)
  })

  test('delete', () => {
    let [o, s] = timerStore()

    delete s.timer.ticks
    assert.ok(!('ticks' in s.timer))
    assert.ok(!('ticks' in o.timer))
  })

  test('onWrite set root', () => new Promise(resolve => {
    let [o, s] = timerStore()

    onWrite(s, (obj, key) => {
      assert.equal(obj, o)
      assert.equal(key, 'show')
      resolve()
    })

    s.show = true
    assert.fail('unreachable')
  }))

  test('onWrite set nested', () => new Promise(resolve => {
    let [o, s] = timerStore()

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      assert.equal(key, 'ticks')
      resolve()
    })

    s.timer.ticks = 1
    assert.fail('unreachable')
  }))

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

  test('onWrite define nested', () => new Promise(resolve => {
    let [o, s] = timerStore()

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      assert.equal(key, 'interval')
      resolve()
    })

    Object.defineProperty(s.timer, 'interval', {value: 1000})
    assert.fail('unreachable')
  }))

  test('onWrite delete nested', () => new Promise(resolve => {
    let [o, s] = timerStore()

    onWrite(s, (obj, key) => {
      assert.equal(obj, o.timer)
      assert.equal(key, 'ticks')
      resolve()
    })

    delete s.timer.ticks
    assert.fail('unreachable')
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

    assert.equal(o.timer.ticks, 1)
    assert.equal(s.timer.ticks, 1)
  })

  test('onRead root', () => new Promise(resolve => {
    let [o, s] = timerStore()

    onRead(s, (obj, key) => {
      assert.equal(obj, o)
      assert.equal(key, 'timer')
      resolve()
    })

    s.timer
    assert.fail('unreachable')
  }))

  test('onRead nested', () => new Promise(resolve => {
    let [o, s] = timerStore()

    let called = 0

    onRead(s, (obj, key) => {
      if (!called++) {
        assert.equal(obj, o)
        assert.equal(key, 'timer')
      } else {
        assert.equal(obj, o.timer)
        assert.equal(key, 'ticks')
        resolve()
      }
    })

    s.timer.ticks
    assert.fail('unreachable')
  }))
})
