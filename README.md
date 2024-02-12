# Picofly

_Lightweight **Proxy**-based state manager built with ❤️_

[![NPM version](https://img.shields.io/npm/v/picofly.svg)](https://www.npmjs.com/package/picofly)

<img src="docs/logo.webp" height="192" align="right">

⚡ **Fast**
  - hand-crafted and optimized for maximum performance
  - perf tests included (soon)  

🤏 **Tiny**
  - **393 bytes** in minimal config, minified and brotlied
  - **677 bytes** in base config with React support  

🥧 **Simple**
  - ~130 lines of sparse code
  - ~70 lines extra for React support (with hook)

🍳 **Easy to use**
  - simple API: just modify data, magic will take care of the rest!
  - unified state: no _state-for-reading_ and _state-for-writing_

⚛️ **React**
  - **hooks** and **selectors**
  - modern React 18 `useSyncExternalStore` to improve performance with concurrent rendering  
  - state is locked during rendering to avoid subtle errors 

🔋 **Charged**
  - **Map** support (**Set** in plans)
  - **Typescript** definitions
  - can be used with **classes** (avoid method bindings!), even with getters and setters
  - `ref` allows to attach any object to the state without proxying (API, etc.)  
  - well tested
  - architecture agnostic
  - extendable

## Why another one?
