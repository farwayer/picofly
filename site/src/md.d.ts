declare module '*.md' {
  import type {MDXContent} from 'mdx/types'

  let Content: MDXContent
  export default Content
}
