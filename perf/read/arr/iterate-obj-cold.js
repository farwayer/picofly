import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 objects
//   let store = create([{i: 0}, ...])
//
//   // bench
//   for (let v of store) sum += v.i

let fill = () => {
  let a = []

  for (let i = 0; i < 100; i++) {
    a.push({i})
  }

  return a
}

let sum = a => {
  let n = 0

  for (let v of a) n += v.i

  return n
}

loop('Iterate array with 100 objects, cold')
  .all({fresh: true, n: 50, repeats: 30, warm: 100, run: sum})
  .picofly({make: () => track(create(fill()))})
  .valtio({make: () => snap(proxy(fill()))})
  .mobx({make: () => observable.array(fill()), enter: derived})
  .run()
