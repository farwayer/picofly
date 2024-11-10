import {$Sym, NakedSym} from '../store.js'


let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
let SymbolIterator = Symbol.iterator
let SymbolFor = Symbol.for
let ArrayFrom = Array.from


export let SizeSym = SymbolFor('size')

export let proxifySet = ($, set) => {
  let [proxify, cache, writeSubs, readSubs] = $

  let proxy = cache.get(set)
  if (proxy) return proxy

  proxy = new Proxy(set, {
    get(set, prop, receiver) {
      let val, objProp, iterateEntry

      switch (prop) {
        case $Sym: {
          return $
        }

        case NakedSym: {
          return set
        }

        case 'size': {
          val = set.size
        }
        break

        case 'has': val = function (val) {
          let target = this === receiver ? set : this
          let has = target.has(val)

          for (let cb of readSubs) {
            cb(set, val)
          }

          return has
        }
        break

				case 'entries':
					iterateEntry = true
				case 'keys':
        case 'values':
				case SymbolIterator: val = function () {
          let target = this === receiver ? set : this
          let valuesIt = target.values()

          for (let cb of readSubs) {
            cb(set, SizeSym)
          }

          return {
            [SymbolIterator]() {
              return this
            },
            next() {
              let next = valuesIt.next()

              if (!next.done) {
								let nextVal = proxify($, next.value)
                next.value = iterateEntry ? [nextVal, nextVal] : nextVal
              }

              return next
            },
          }
        }
        break

        case 'forEach': val = function (cb, thisArg) {
          let target = this === receiver ? set : this

          for (let cb of readSubs) {
            cb(set, SizeSym)
          }

          target.forEach(val => {
						val = proxify($, val)
            cb(val, val, this)
          }, thisArg)
        }
        break

        case 'delete': val = function (val) {
          $[4] && "store locked!"()

          let target = this === receiver ? set : this
          let has = target.has(val)
          if (!has) return false

          target.delete(val)

          for (let cb of writeSubs) {
            cb(set, SizeSym)
            cb(set, val)
          }

          return true
        }
        break

        case 'clear': val = function () {
          $[4] && "store locked!"()

          let target = this === receiver ? set : this
          if (!target.size) return

          // because values() returns iterator
          // it will be empty after clear
          // so we need to save all values first
          // may be slow and takes memory (depending on set size and values)
          // but anyway clear() should not be often operation
          let vals = ArrayFrom(target.values())

          target.clear()

          for (let cb of writeSubs) {
            cb(set, SizeSym)

            for (let val of vals) {
              cb(set, val)
            }
          }
        }
        break

        case 'add': val = function (val) {
          $[4] && "store locked!"()

          let target = this === receiver ? set : this
          let has = target.has(val)
          if (has) return this

          target.add(val)

          for (let cb of writeSubs) {
						cb(set, SizeSym)
            cb(set, val)
          }

          return this
        }
        break

        // Set is js object so it's possible to get some props
        default: {
          val = ReflectGet(set, prop, receiver)
          objProp = true
        }
      }

      // to differ set values and set object props (set.add('x') vs set.x)
      if (typeof prop !== 'symbol') {
        prop = SymbolFor(prop)
      }

      for (let cb of readSubs) {
        cb(set, prop)
      }

      return objProp
        ? proxify($, val)
        : val
    },

    // Set is js object so it's possible to define some props
    defineProperty(set, prop, desc) {
      $[4] && "store locked!"()

      // in theory prop getter (prev or next) can modify object
      // so we need to use Reflect with the proxy as receiver
      // to catch this changes

      let has = prop in set
      let prev = has && ReflectGet(set, prop, proxy)

      // unwrap value if it was proxied with current $
      let value = desc.value
      if (value != null && value[$Sym] === $) {
        desc.value = value[NakedSym]
      }

      ReflectDefineProperty(set, prop, desc)

      let next = has && ReflectGet(set, prop, proxy)

      if (!has || next !== prev) {
        // to differ set keys and set object props (set.add('x') vs set.x)
        if (typeof prop !== 'symbol') {
          prop = SymbolFor(prop)
        }

        for (let cb of writeSubs) {
          cb(set, prop)
        }
      }

      return true
    },

    // Set is js object so it's possible to delete some props
    deleteProperty(set, prop) {
      $[4] && "store locked!"()

      let has = prop in set
      if (!has) return true

      delete set[prop]

      // to differ set keys and set object props (set.add('x') vs set.x)
      if (typeof prop !== 'symbol') {
        prop = SymbolFor(prop)
      }

      for (let cb of writeSubs) {
        cb(set, prop)
      }

      return true
    },
  })

  cache.set(set, proxy)

  return proxy
}
