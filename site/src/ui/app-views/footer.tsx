import {Cfg} from '~/const'
import {Github, Npm} from '~/ui/views/icons'

export default function Footer() {
  return (
    <footer>
      <div class="icons">
        <a href={Cfg.links.github} aria-label="GitHub"><Github/></a>
        <a href={Cfg.links.npm} aria-label="npm"><Npm/></a>
      </div>

      <p class="note">picofly ❤️ preact</p>
    </footer>
  )
}
