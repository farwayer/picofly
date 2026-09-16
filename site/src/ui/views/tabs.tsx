import {cn} from '~/lib/cn.ts'

type Props<Id extends string> = {
  items: {id: Id, name: string}[]
  current: Id
  // an anchor instead of a button: the tab gets a link of its own
  hash?: boolean
  onTab?: (id: Id) => void
}

export default function Tabs<Id extends string>(
  {items, current, hash, onTab}: Props<Id>,
) {
  return (
    <div class="tabs" role="tablist">
      {items.map(({id, name}) => {
        let props = {
          role: 'tab' as const,
          'aria-selected': id === current,
          class: cn('tab', id === current && 'active'),
        }

        return hash ? (
          <a key={id} href={`#${id}`} {...props}>
            {name}
          </a>
        ) : (
          <button key={id} onClick={() => onTab?.(id)} {...props}>
            {name}
          </button>
        )
      })}
    </div>
  )
}
