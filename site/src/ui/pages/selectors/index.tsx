import Body from '~docs/hook-vs-selectors.md'
import Article from '~/ui/views/article.tsx'
import Compare from './views/compare.tsx'

export default function Selectors() {
  return <Article body={Body} components={{Compare}}/>
}
