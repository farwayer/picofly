import logo from '~docs/logo.svg'
import {Cfg} from '~/const'
import Install from './install'

export default function Hero() {
  return (
    <header class="hero">
      <h1>
        <img class="logo" src={logo} width="601" height="640" alt={Cfg.name}/>
      </h1>
      <p class="tagline">{Cfg.tagline}</p>

      <p class="size">
        <b>{Cfg.size.min}</b> minimal
        <b>{Cfg.size.react}</b> with React support
      </p>

      <div class="installs">
        {Cfg.install.map(cmd => <Install key={cmd} cmd={cmd}/>)}
      </div>
    </header>
  )
}
