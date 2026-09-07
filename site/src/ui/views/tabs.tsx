import {cn} from '~/lib/cn'

type Props<Id extends string> = {
  items: {id: Id, name: string}[]
  current: Id
  onTab: (id: Id) => void
}

export default function Tabs<Id extends string>({items, current, onTab}: Props<Id>) {
  return (
    <div class="tabs" role="tablist">
      {items.map(({id, name}) => (
        <button
          key={id}
          role="tab"
          aria-selected={id === current}
          class={cn('tab', id === current && 'active')}
          onClick={() => onTab(id)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
