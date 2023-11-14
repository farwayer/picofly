import React, {memo, forwardRef} from 'react'
import {useStore} from './use-store.js'


export let select = (...selectors) => (Component, options = {}) => {
  let {getStore, withRef} = options

  let render = isFunctional(Component)
    ? Component
    : (
      withRef
        ? forwardRef((props, ref) => <Component {...props} ref={ref}/>)
        : props => <Component {...props}/>
    )

  let Selector = (props, ref) => {
    let store = useStore(getStore?.())

    props = selectors.reduce((props, selector) => (
      Object.assign({}, props, selector(store, props))
    ), props)

    return render(props, ref)
  }

  if (withRef) {
    Selector = forwardRef(Selector)
  }
  Selector = memo(Selector)

  let name = Component.displayName || Component.name || 'Unknown'
  Selector.displayName = `select(${name})`

  return Selector
}

let isFunctional = Component => (
  typeof Component === 'function' &&
  !Component.prototype?.isReactComponent
)
