import Body from '~docs/hook-vs-selectors.md'
import Article from '~/ui/views/article'
import Compare from './views/compare'

export default function Selectors() {
  return <Article body={Body} components={{Compare}}/>
}
