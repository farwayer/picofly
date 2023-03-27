// noinspection JSAnnotator,JSValidateTypes

import {$Sym} from './store.js'


export let KeysSym = Symbol('keys')
export let ValuesSym = Symbol('values')
export let EntriesSym = Symbol('entries')
export let ForEachSym = Symbol('forEach')


export let proxifyMap = ($, map) => {
  let [proxify, cache, writeSubs, readSubs] = $

  let proxy = cache.get(map)
  if (proxy) return proxy

  proxy = new Proxy(map, {
    get(map, prop, receiver) {
      let val, objProp

      switch (prop) {
        case $Sym: {
          return $
        }

        case 'size': {
          val = map.size
        }
        break

        case 'has': val = function (key) {
          let target = this === receiver ? map : this
          let has = target.has(key)

          for (let cb of readSubs) {
            cb(map, key)
          }

          return has
        }
        break

        case 'get': val = function (key) {
          let target = this === receiver ? map : this
          let item = target.get(key)

          for (let cb of readSubs) {
            cb(map, key)
          }

          return proxify($, item)
        }
        break

        case 'keys': val = function () {
          let target = this === receiver ? map : this
          let keysIt = target.keys()

          for (let cb of readSubs) {
            cb(map, KeysSym)
          }

          return keysIt
        }
        break

        case 'values': val = function () {
          let target = this === receiver ? map : this
          let valuesIt = target.values()

          for (let cb of readSubs) {
            cb(map, ValuesSym)
          }

          return valuesIt
        }
        break

        case 'entries':
        case SymIterator: val = function () {
          let target = this === receiver ? map : this
          let entriesIt = target.entries()

          for (let cb of readSubs) {
            cb(map, EntriesSym)
          }

          return entriesIt
        }
        break

        case 'forEach': val = function (cb, thisArg) {
          let target = this === receiver ? map : this

          target.forEach((val, key) => {
            cb(val, key, this)
          }, thisArg)

          for (let cb of readSubs) {
            cb(map, ForEachSym)
          }
        }
        break

        case 'delete': val = function (key) {
          $[4] && "store locked!"()

          let target = this === receiver ? map : this
          let has = target.has(key)
          if (!has) return false

          target.delete(key)

          for (let cb of writeSubs) {
            cb(map, '@@map.size')
            cb(map, KeysSym)
            cb(map, ValuesSym)
            cb(map, EntriesSym)
            cb(map, ForEachSym)
            cb(map, key)
          }

          return true
        }
        break

        case 'clear': val = function () {
          $[4] && "store locked!"()

          let target = this === receiver ? map : this
          if (!target.size) return

          // because keys() returns iterator
          // it will be empty after clear
          // so we need to save all keys first
          // maybe slow and takes memory (depending on map size and keys)
          // but anyway clear() should not be often operation
          let keys = Array.from(target.keys())

          target.clear()

          for (let cb of writeSubs) {
            cb(map, '@@map.size')
            cb(map, KeysSym)
            cb(map, ValuesSym)
            cb(map, EntriesSym)
            cb(map, ForEachSym)

            for (let key of keys) {
              cb(map, key)
            }
          }
        }
        break

        case 'set': val = function (key, val) {
          $[4] && "store locked!"()

          let target = this === receiver ? map : this
          let has = target.has(key, val)
          let prev = has && target.get(key)

          if (has && val === prev) {
            return this
          }

          target.set(key, val)

          for (let cb of writeSubs) {
            !has && cb(map, '@@map.size')
            !has && cb(map, KeysSym)
            cb(map, ValuesSym)
            cb(map, EntriesSym)
            cb(map, ForEachSym)
            cb(map, key)
          }

          return this
        }
        break

        default: {
          val = ReflectGet(map, prop, receiver)
          objProp = true
        }
      }

      // to distinguish map keys (if strings) and map object props
      let key = '@@map.' + (prop === SymIterator ? '@@iterator' : prop)

      for (let cb of readSubs) {
        cb(map, key)
      }

      return objProp
        ? proxify($, val)
        : val
    },

    // Map is js object so it's possible to define
    // and then delete some props
    defineProperty(map, prop, desc) {
      $[4] && "store locked!"()

      // in theory prop getter (prev or next) can modify object
      // so we need to use Reflect with the proxy as receiver
      // to catch this changes

      let has = prop in map
      let prev = has && ReflectGet(map, prop, proxy)

      ReflectDefineProperty(map, prop, desc)

      let next = has && ReflectGet(map, prop, proxy)

      if (!has || next !== prev) {
        let key = '@@map.' + prop

        for (let cb of writeSubs) {
          cb(map, key)
        }
      }

      return true
    },

    deleteProperty(map, prop) {
      $[4] && "store locked!"()

      let has = prop in map
      if (!has) return true

      delete map[prop]

      let key = '@@map.' + prop

      for (let cb of writeSubs) {
        cb(map, key)
      }

      return true
    },
  })

  cache.set(map, proxy)

  return proxy
}

let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
let SymIterator = Symbol.iterator
