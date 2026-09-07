import type {ComponentChild} from 'preact'

let Re = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|==([^=]+)==|\[(`?)([^\]]+)\5\]\(([^)]+)\)/g

export let md = (text: string) => {
  let out: ComponentChild[] = []
  let last = 0
  let m: RegExpExecArray | null

  while ((m = Re.exec(text))) {
    out.push(text.slice(last, m.index))
    out.push(
      m[1] ? <code key={m.index}>{m[1]}</code> :
      m[2] ? <b key={m.index}>{m[2]}</b> :
      m[3] ? <i key={m.index}>{m[3]}</i> :
      m[4] ? <span key={m.index} class="hi">{m[4]}</span> :
      <a key={m.index} href={m[7]}>{m[5] ? <code>{m[6]}</code> : m[6]}</a>,
    )
    last = Re.lastIndex
  }

  out.push(text.slice(last))

  return out
}
