import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  tex: string
  display?: boolean
}

export function MathFormula({ tex, display = true }: Props) {
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
  })

  return (
    <div
      className="overflow-x-auto rounded bg-neutral-50 dark:bg-neutral-900 px-4 py-4"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
