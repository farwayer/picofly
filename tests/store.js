import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {
  store, onWrite, readableStore, readable, unprotect, protect, ref
} from '../src/store.js'


test('store', () => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  const wObj = JSON.parse(JSON.stringify(w))
  assert.equal(wObj, obj)
})

test('store invalid init type', () => {
  assert.throws(() => {
    store(1)
  }, /Cannot create proxy with a non-object as target or handler/)
})

test('set', () => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  w.timer.ticks = 1
  assert.is(obj.timer.ticks, 1)
  assert.is(w.timer.ticks, 1)
})

test('define', () => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  Object.defineProperty(w.timer, 'interval', {value: 1000})
  assert.is(obj.timer.interval, 1000)
  assert.is(w.timer.interval, 1000)
})

test('delete', () => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  delete w.timer.ticks
  assert.not('ticks' in w.timer)
  assert.not('ticks' in obj.timer)
})

test('onWrite set root', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  onWrite(w, (proxy, prop) => {
    assert.is(proxy, w)
    assert.is(prop, 'show')
    resolve()
  })

  w.show = true
  assert.unreachable()
}))

test('onWrite set', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  onWrite(w, (proxy, prop) => {
    assert.is(prop, 'ticks')
    resolve()
  })

  w.timer.ticks = 1
  assert.unreachable()
}))

test('onWrite define', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  onWrite(w, (proxy, prop) => {
    assert.is(prop, 'interval')
    resolve()
  })

  Object.defineProperty(w.timer, 'interval', {value: 1000})
  assert.unreachable()
}))

test('onWrite delete', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  onWrite(w, (proxy, prop) => {
    assert.is(prop, 'ticks')
    resolve()
  })

  delete w.timer.ticks
  assert.unreachable()
}))

test('readable', () => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)
  const r = readable(w)

  const rObj = JSON.parse(JSON.stringify(r))
  assert.equal(rObj, obj)
})

test('readableStore', () => {
  const obj = {timer: {ticks: 0}}
  const r = readableStore(obj)

  const rObj = JSON.parse(JSON.stringify(r))
  assert.equal(rObj, obj)
})

test('onWrite readable', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)
  const r = readable(w)

  onWrite(r, (proxy, prop) => {
    assert.is(proxy, w)
    assert.is(prop, 'show')
    resolve()
  })

  unprotect(r)
  r.show = true

  assert.unreachable()
}))

test('onRead root', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  const r = readable(w, (proxy, prop) => {
    assert.is(proxy, w)
    assert.is(prop, 'timer')
    resolve()
  })

  r.timer
  assert.unreachable()
}))

test('onRead', () => new Promise(resolve => {
  const obj = {timer: {ticks: 0}}
  const w = store(obj)

  let called = 0

  const r = readable(w, (proxy, prop) => {
    if (!called++) {
      assert.is(proxy, w)
      assert.is(prop, 'timer')
    } else {
      assert.is(prop, 'ticks')
      resolve()
    }
  })

  r.timer.ticks
  assert.unreachable()
}))

test('protected', () => {
  const obj = {timer: {ticks: 0}}
  const r = readableStore(obj)

  assert.throws(() => {
    r.timer.ticks = 1
  }, /"store protected!" is not a function/)
})

test('unprotect', () => {
  const obj = {timer: {ticks: 0}}

  const r = readableStore(obj, () => {
    assert.unreachable()
  })

  unprotect(r)
  r.timer.ticks = 1

  assert.is(obj.timer.ticks, 1)
  assert.is(r.timer.ticks, 1)
})

test('unprotect->protect', () => {
  const obj = {timer: {ticks: 0}}

  let isProtected = true

  const r = readableStore(obj, () => {
    if (isProtected) return
    assert.unreachable()
  })

  unprotect(r)
  isProtected = false

  r.timer.ticks = 1

  protect(r)
  isProtected = true

  r.timer.ticks

  assert.is(obj.timer.ticks, 1)
  assert.is(r.timer.ticks, 1)
})

test('ref', () => {
  const obj = {timer: {ticks: 0}}
  const refObj = {show: true}
  const w = store(obj)

  w.options = ref(w, refObj)
  assert.is(w.options, refObj)
  assert.is(w.options.show, true)

  onWrite(w, () => {
    assert.unreachable()
  })

  w.options.show = false
})

test('ref readable', () => {
  const obj = {timer: {ticks: 0}}
  const refObj = {show: true}

  const w = store(obj)
  const r = readable(w, (proxy, prop) => {
    if (prop === 'options') return
    assert.unreachable()
  })

  unprotect(r)

  r.options = ref(r, refObj)
  assert.is(w.options, refObj)
  assert.is(w.options.show, true)
  assert.is(r.options, refObj)
  assert.is(r.options.show, true)

  onWrite(w, () => {
    assert.unreachable()
  })

  w.options.show = false

  protect(r)
  r.options.show
})


test.run()
