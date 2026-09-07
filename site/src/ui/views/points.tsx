import {md} from '~/lib/md'

export default function Points({items}: {items: [string, string][]}) {
  return (
    <ul class="points">
      {items.map(([title, text]) => (
        <li key={title}><b>{title}</b> — {md(text)}</li>
      ))}
    </ul>
  )
}
