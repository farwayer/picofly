import {readdirSync, readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import type {Plugin, ViteDevServer} from 'vite'

let perf = fileURLToPath(new URL('../../perf', import.meta.url))

// The perf table shows what every benchmark does. The snippet lives in the
// bench file itself, in a `// show:` block, so one edit changes both.
export let benchCode = (): Plugin => {
  let id = 'virtual:bench-code'
  let resolved = '\0' + id

  return {
    name: 'bench-code',

    resolveId(spec: string) {
      if (spec === id) return resolved
    },

    load(spec: string) {
      if (spec !== resolved) return

      return `export let BenchCode = ${JSON.stringify(snippets(), null, 2)}`
    },

    configureServer(server: ViteDevServer) {
      server.watcher.add(perf)

      // a new bench file is an add, not a change, so all three
      for (let event of ['add', 'change', 'unlink'] as const) {
        server.watcher.on(event, file => {
          if (!file.startsWith(perf)) return

          let mod = server.moduleGraph.getModuleById(resolved)
          if (mod) server.reloadModule(mod)
        })
      }
    },
  }
}

let snippets = () => {
  let all: Record<string, string> = {}

  for (let group of ['fill', 'update', 'read', 'app']) {
    // app keeps its shared code next to the types, so only dirs are benches
    for (let type of dirs(`${perf}/${group}`)) {
      for (let file of readdirSync(`${perf}/${group}/${type}`)) {
        let code = show(`${perf}/${group}/${type}/${file}`)
        if (code) all[`${group}/${type}/${file.slice(0, -3)}`] = code
      }
    }
  }

  return all
}

let dirs = (path: string) =>
  readdirSync(path, {withFileTypes: true})
    .filter(e => e.isDirectory())
    .map(e => e.name)

let show = (file: string) => {
  let lines = readFileSync(file, 'utf8').split('\n')
  let from = lines.indexOf('// show:')
  if (from < 0) return

  let block = []

  for (let line of lines.slice(from + 1)) {
    if (!line.startsWith('//')) break
    block.push(line.replace(/^\/\/ {0,3}/, ''))
  }

  return block.join('\n').trim()
}
