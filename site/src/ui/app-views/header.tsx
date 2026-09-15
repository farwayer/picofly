import {version} from 'picofly/package.json'
import logo from '~docs/logo-h.svg'
import {Cfg} from '~/const.ts'
import {Github} from '~/ui/views/icons.tsx'
import Backdrop from './backdrop.tsx'
import Burger from './burger.tsx'
import Nav from './nav.tsx'

export default function Header() {
  return (
    <header class="top">
      <Backdrop/>

      <a class="home" href="/">
        <img src={logo} alt={Cfg.name}/>
      </a>

      <Nav/>

      <a class="ver" href={Cfg.links.npm}>v{version}</a>
      <a class="gh" href={Cfg.links.github} aria-label="GitHub"><Github/></a>
      <Burger/>
    </header>
  )
}
