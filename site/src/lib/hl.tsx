import {parse, render, SugarHigh} from 'sugar-high/core'
import {tokenize as js} from 'sugar-high/lang/javascript'

let Identifier = SugarHigh.TokenMap.get('identifier')!
let Call = SugarHigh.TokenMap.get('class')!
let Sign = SugarHigh.TokenMap.get('sign')!

// an identifier followed by ( is a call, generics in between allowed
let tokenize = (code: string, options: object) => {
  let tokens = js(code, options)

  let opensCall = (i: number) => {
    let [type, text] = tokens[i] ?? []
    if (type !== Sign) return false
    if (text.startsWith('(')) return true

    if (text === '<') {
      while (++i < tokens.length && tokens[i][1] !== '>') {}
      return tokens[i + 1]?.[0] === Sign && tokens[i + 1][1].startsWith('(')
    }

    return false
  }

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i][0] === Identifier && opensCall(i + 1)) {
      tokens[i] = [Call, tokens[i][1]]
    }
  }

  return tokens
}

export let hl = (code: string) => (
  <code dangerouslySetInnerHTML={{__html: render(parse(code, {tokenize}))}}/>
)
