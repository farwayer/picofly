import {version} from 'picofly/package.json'
import logo from '~docs/logo-h.svg'
import {Cfg} from '~/const'
import {Github} from '~/ui/views/icons'
import Burger from './burger'
import Nav from './nav'

export default function Header() {
  return (
    <header class="top">
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
