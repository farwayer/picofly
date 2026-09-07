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

      server.watcher.on('change', file => {
        if (!file.startsWith(perf)) return

        let mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.reloadModule(mod)
      })
    },
  }
}

let snippets = () => {
  let all: Record<string, string> = {}

  for (let group of ['fill', 'update', 'read']) {
    for (let type of readdirSync(`${perf}/${group}`)) {
      for (let file of readdirSync(`${perf}/${group}/${type}`)) {
        let code = show(`${perf}/${group}/${type}/${file}`)
        if (code) all[`${group}/${type}/${file.slice(0, -3)}`] = code
      }
    }
  }

  return all
}

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
