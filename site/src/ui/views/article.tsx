import type {MDXComponents, MDXContent} from 'mdx/types'
import type {VNode} from 'preact'
import {hl} from '~/lib/hl'

type Props = {
  body: MDXContent
  components?: MDXComponents
}

// headings get an id, so the text can link to a section
let slug = (children: unknown) =>
  String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-')

let Heading = (tag: 'h2' | 'h3') => ({children, ...props}: any) => {
  let H = tag

  return <H id={slug(children)} {...props}>{children}</H>
}

// a fenced block arrives as <pre><code>{source}</code></pre>
let Pre = ({children}: {children: VNode<{children: string}>}) => (
  <pre>{hl(children.props.children)}</pre>
)

let Base: MDXComponents = {
  h2: Heading('h2'),
  h3: Heading('h3'),
  p: props => <p class="text" {...props}/>,
  ul: props => <ul class="points" {...props}/>,
  pre: Pre,
  Hi: props => <span class="hi" {...props}/>, // <Hi>570 B</Hi> in the text
  Small: props => <div class="small" {...props}/>, // a list of counts, not prose
  Note: props => <div class="note" {...props}/>, // a footnote under a block
}

export default function Article({body: Body, components}: Props) {
  return (
    <section class="page">
      <Body components={{...Base, ...components}}/>
    </section>
  )
}
