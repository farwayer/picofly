# Picofly

_Lightweight state manager based on **Proxy**'s_

[![NPM version](https://img.shields.io/npm/v/picofly.svg)](https://www.npmjs.com/package/picofly)

<img src="docs/logo.webp" height="192" align="right">

⚡ **Fast**
  - code is hand-crafted and optimized for maximum performance
  - proxies are created during the first read, not the write
  - perf tested (soon)  

🤏 **Tiny**
  - **423 bytes** basic version (minified and brotlied)
  - **670 bytes** with React support  

🥧 **Simple**
  - ~130 lines of sparse code
  - ~70 lines for React support (with hook)

🍳**Easy to use**
  - simple API: just modify data, magic will take care of the rest!
  - unified state: no _state-for-writing_ and _state-for-reading_

⚛ **React support**
  - with hooks and selectors
  - modern React 18 `useSyncExternalStore` to improve performance with concurrent rendering  
  - state is locked during rendering to avoid subtle errors 

🔋 **Extendable**
  - can be used with other (than React) front-end frameworks
  - it's possible to proxify other types
  - **Map** support is already included as example (**Set** in plans)

## Why another one?
