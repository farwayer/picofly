import {version} from 'picofly/package.json'
import {Cfg} from '~/const'
import {Github} from '~/ui/views/icons'
import Burger from './burger'
import Nav from './nav'

export default function Header() {
  return (
    <header class="top">
      <a class="home" href="/">
        <img src="/icon.svg" width="26" height="26" alt=""/>
        <b>{Cfg.name}</b>
      </a>

      <Nav/>

      <a class="ver" href={Cfg.links.npm}>v{version}</a>
      <a class="gh" href={Cfg.links.github} aria-label="GitHub"><Github/></a>
      <Burger/>
    </header>
  )
}
