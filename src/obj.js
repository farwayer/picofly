// noinspection JSAnnotator,JSValidateTypes

import {$Sym} from './store.js'


export let proxifyObj = ($, obj) => {
  let [proxify, cache, writeSubs, readSubs] = $

  let proxy = cache.get(obj)
  if (proxy) return proxy

  proxy = new Proxy(obj, {
    get(obj, prop, receiver) {
      if (prop === $Sym) {
        return $
      }

      let val = ReflectGet(obj, prop, receiver)

      for (let cb of readSubs) {
        cb(obj, prop)
      }

      return proxify($, val)
    },

    defineProperty(obj, prop, desc) {
      $[4] && "store locked!"()

      // in theory prop getter (prev or next) can modify object
      // so we need to use Reflect with the proxy as receiver
      // to catch this changes

      let has = prop in obj
      let prev = has && ReflectGet(obj, prop, proxy)

      ReflectDefineProperty(obj, prop, desc)

      let next = has && ReflectGet(obj, prop, proxy)

      if (!has || next !== prev) {
        for (let cb of writeSubs) {
          cb(obj, prop)
        }
      }

      return true
    },

    deleteProperty(obj, prop) {
      $[4] && "store locked!"()

      let has = prop in obj
      if (!has) return true

      delete obj[prop]

      for (let cb of writeSubs) {
        cb(obj, prop)
      }

      return true
    },
  })

  cache.set(obj, proxy)

  return proxy
}

let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
