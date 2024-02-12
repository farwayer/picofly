import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {create, objMapIgnoreSpecialsRef, onWrite, ref} from 'picofly'


let timerStore = () => {
  let o = {timer: {ticks: 0}}
  let s = create(o, objMapIgnoreSpecialsRef)
  return [o, s]
}

test('ref', () => {
  let [o, s] = timerStore()
  let refObj = {show: true}

  s.options = ref(s, refObj)
  assert.is(s.options, refObj)
  assert.is(s.options.show, true)

  onWrite(s, () => {
    assert.unreachable()
  })

  s.options.show = false
})

test.run()
