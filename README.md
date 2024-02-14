# Picofly

_Lightweight **Proxy**-based state manager built with ❤️_

[![NPM version](https://img.shields.io/npm/v/picofly.svg)](https://www.npmjs.com/package/picofly)

<img src="docs/logo.webp" height="192" align="right">

⚡ **Fast**
  - hand-crafted and optimized to be as fast as possible
  - perf tests included (soon)  

🤏 **Tiny**
  - **403 bytes** in minimal config, minified and brotlied
  - **685 bytes** in base config with React support  

🥧 **Simple**
  - ~130 lines of sparse code (with obj proxifier)
  - ~70 lines extra for React support (with hook)
  - built-in functions is not overridden

🍳 **Easy to use**
  - simple API: just modify data, magic will take care of the rest!
  - no _state-for-reading_ and _state-for-writing_, snapshots: just one proxy

⚛️ **React & React Native**
  - **hooks** and **selectors**
  - modern React 18 **useSyncExternalStore** to improve performance with concurrent rendering
  - plays amazing with React Native's **New Architecture** and **Fabric Renderer** (highly recommended)
  - state is locked during rendering to avoid subtle errors 

🔋 **Charged**
  - **Map** support (**Set** in plans)
  - **Typescript** definitions
  - can be used with **classes** (avoid method bindings!), even with **getters** and **setters**
  - **ref** allows to attach any object to the state without proxying (API, etc.)  
  - well tested
  - architecture agnostic
  - extendable

🪟 **Transparent**
  - original object is not modified at all (no Symbol's or \_\_SECRET\_\_ properties added)
  - all operations are supported and proxied (defineProperty, getters, setters, Map iterators, etc.)
  - even using Map as object

## Why the hell another one?!
