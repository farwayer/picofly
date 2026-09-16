import {Features as items} from '~/const.ts'
import {ArrowRight} from '~/ui/views/icons.tsx'

export default function Features() {
  return (
    <section class="pluses">
      <p class="text">
        <a href="/why">Why the hell another one?</a><ArrowRight/>
      </p>

      <ul class="features">
        {items.map(([icon, name, text]) => (
          <li key={name}>
            <span class="icon">{icon}</span>
            <b>{name}</b>
            <span class="text">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
