import type {ComponentChildren} from 'preact'
import {toChildArray} from 'preact'

type Props = {
  // a plain string, so the tag stays valid html and github hides it
  names: string
  children: ComponentChildren
}

export default function Compare({names, children}: Props) {
  let titles = names.split(' ')

  return (
    <div class="compare">
      {toChildArray(children).map((code, i) => (
        <div key={titles[i]}>
          <span class="name">{titles[i]}</span>
          {code}
        </div>
      ))}
    </div>
  )
}
