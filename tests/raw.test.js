import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {create, onWrite, markRaw, isRaw} from 'picofly'


suite('raw', () => {
  let timerStore = () => {
    let o = {timer: {ticks: 0}}
    return [o, create(o)]
  }

  test('markRaw', () => {
    let [, s] = timerStore()
    let rawObj = {show: true}

    s.options = markRaw(s, rawObj)
    assert.equal(s.options, rawObj)
    assert.equal(s.options.show, true)

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.options.show = false
  })

  test('isRaw', () => {
    let [, s] = timerStore()
    let rawObj = {show: true}

    assert.ok(!isRaw(s, rawObj))

    markRaw(s, rawObj)

    assert.ok(isRaw(s, rawObj))
    assert.ok(!isRaw(s, {}))
    assert.ok(!isRaw(s, 1))
  })

  test('a marked Map stays raw', () => {
    let [, s] = timerStore()
    let m = new Map()

    markRaw(s, m)
    s.books = m

    assert.equal(s.books, m)
  })
})
