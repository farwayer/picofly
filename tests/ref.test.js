import {suite, test} from 'node:test'
import * as assert from 'node:assert/strict'
import {create, objMapSetIgnoreSpecialsRef, onWrite, ref} from 'picofly'


suite('ref', () => {
  let timerStore = () => {
    let o = {timer: {ticks: 0}}
    let s = create(o, objMapSetIgnoreSpecialsRef)
    return [o, s]
  }

  test('ref', () => {
    let [o, s] = timerStore()
    let refObj = {show: true}

    s.options = ref(s, refObj)
    assert.equal(s.options, refObj)
    assert.equal(s.options.show, true)

    onWrite(s, () => {
      assert.fail('unreachable')
    })

    s.options.show = false
  })
})
