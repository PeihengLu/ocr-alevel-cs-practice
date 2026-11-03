import { useEffect, useLayoutEffect, useRef, type ReactElement } from 'react'
import { history, historyKeymap } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { indentUnit, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { Annotation, EditorSelection, EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const INDENT = '    '

/** Marks a document change that came from the parent, not from typing. */
const externalUpdate = Annotation.define<boolean>()

const tokenHighlight = HighlightStyle.define([
  { tag: tags.keyword, class: 'cm-tok-keyword' },
  { tag: tags.string, class: 'cm-tok-string' },
  { tag: tags.comment, class: 'cm-tok-comment' },
  { tag: tags.lineComment, class: 'cm-tok-comment' },
  { tag: tags.blockComment, class: 'cm-tok-comment' },
  { tag: tags.number, class: 'cm-tok-number' }
])

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'transparent'
  },
  '.cm-scroller': {
    fontFamily: '"SF Mono", "Cascadia Code", Menlo, Consolas, monospace',
    fontSize: '0.88rem',
    lineHeight: '1.4',
    minHeight: '100%'
  },
  '.cm-content': {
    padding: '0.45rem 0.55rem',
    caretColor: 'var(--ink)',
    tabSize: '4'
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--ink)'
  },
  '&.cm-focused': {
    outline: 'none'
  }
})

interface CodeEditorProps {
  id: string
  value: string
  onChange: (next: string) => void
  language: 'python' | 'sql'
  rows?: number
  className?: string
  /** After a line ending in `:`, Enter adds one extra indent. Used for Python. */
  indentAfterColon?: boolean
}

/** Code editor with syntax colours. Tab indents by four spaces and Enter keeps the current indent. */
export function CodeEditor({
  id,
  value,
  onChange,
  language,
  rows = 12,
  className,
  indentAfterColon = false
}: CodeEditorProps): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const indentAfterColonRef = useRef(indentAfterColon)
  const valueRef = useRef(value)
  onChangeRef.current = onChange
  indentAfterColonRef.current = indentAfterColon
  valueRef.current = value

  useEffect(() => {
    const parent = hostRef.current
    if (!parent) return

    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          keymap.of([
            { key: 'Tab', run: indentAtCursor },
            { key: 'Shift-Tab', run: outdentAtCursor },
            {
              key: 'Enter',
              run: (editor) => newlineAtCursor(editor, indentAfterColonRef.current)
            },
            { key: 'Backspace', run: backspaceIndent },
            ...historyKeymap
          ]),
          history(),
          indentUnit.of(INDENT),
          language === 'python' ? python() : sql(),
          syntaxHighlighting(tokenHighlight),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            spellcheck: 'false',
            autocapitalize: 'off',
            autocorrect: 'off',
            'aria-multiline': 'true'
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return
            if (update.transactions.some((tr) => tr.annotation(externalUpdate))) return
            onChangeRef.current(update.state.doc.toString())
          }),
          editorTheme
        ]
      })
    })
    view.contentDOM.id = id
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [id, language])

  useLayoutEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: { anchor: 0 },
      annotations: externalUpdate.of(true)
    })
  }, [value])

  return (
    <div
      ref={hostRef}
      className={['cm-code-host', className].filter(Boolean).join(' ')}
      style={{ minHeight: `calc(${rows} * 1.4em + 0.9rem)` }}
    />
  )
}

function indentAtCursor(view: EditorView): boolean {
  return replaceSelections(view, (text, from, to) =>
    from === to ? insertAt(text, from, INDENT) : indentLines(text, from, to)
  )
}

function outdentAtCursor(view: EditorView): boolean {
  return replaceSelections(view, (text, from, to) => outdent(text, from, to))
}

function newlineAtCursor(view: EditorView, indentAfterColon: boolean): boolean {
  return replaceSelections(view, (text, from, to) => newline(text, from, to, indentAfterColon))
}

function backspaceIndent(view: EditorView): boolean {
  const text = view.state.doc.toString()
  let handled = false
  const spec = view.state.changeByRange((range) => {
    if (!range.empty) return { range }
    const removed = leadingSpacesBefore(text, range.from)
    if (removed <= 1) return { range }
    handled = true
    const cut = Math.min(INDENT.length, removed)
    return {
      changes: { from: range.from - cut, to: range.from },
      range: EditorSelection.cursor(range.from - cut)
    }
  })
  if (!handled) return false
  view.dispatch(spec)
  return true
}

function replaceSelections(
  view: EditorView,
  edit: (text: string, from: number, to: number) => { text: string; start: number; end: number }
): boolean {
  const text = view.state.doc.toString()
  view.dispatch(
    view.state.changeByRange((range) => {
      const next = edit(text, range.from, range.to)
      const bounds = lineBounds(text, range.from, range.to)
      // A change that only replaces the selection (Tab at the caret, Enter) stays
      // on that range. Indenting or outdenting a line can start before the caret.
      const selectionOnly =
        next.text.startsWith(text.slice(0, range.from)) && next.text.endsWith(text.slice(range.to))
      const span = selectionOnly
        ? { from: range.from, to: range.to }
        : { from: bounds.from, to: bounds.to }
      return {
        changes: {
          from: span.from,
          to: span.to,
          insert: changedSlice(text, next.text, span.from, span.to)
        },
        range: EditorSelection.range(next.start, next.end)
      }
    })
  )
  return true
}

function changedSlice(original: string, next: string, from: number, to: number): string {
  const suffixLength = original.length - to
  return next.slice(from, next.length - suffixLength)
}

function insertAt(text: string, at: number, insert: string): { text: string; start: number; end: number } {
  return {
    text: text.slice(0, at) + insert + text.slice(at),
    start: at + insert.length,
    end: at + insert.length
  }
}

function indentLines(text: string, start: number, end: number): { text: string; start: number; end: number } {
  const bounds = lineBounds(text, start, end)
  const lines = text.slice(bounds.from, bounds.to).split('\n')
  const block = lines.map((line) => INDENT + line).join('\n')
  return {
    text: text.slice(0, bounds.from) + block + text.slice(bounds.to),
    start: start + INDENT.length,
    end: end + lines.length * INDENT.length
  }
}

function outdent(text: string, start: number, end: number): { text: string; start: number; end: number } {
  const bounds = lineBounds(text, start, end)
  const lines = text.slice(bounds.from, bounds.to).split('\n')
  let removedOnFirst = 0
  let removed = 0
  const block = lines
    .map((line, index) => {
      const cut = indentWidth(line)
      if (index === 0) removedOnFirst = cut
      removed += cut
      return line.slice(cut)
    })
    .join('\n')
  return {
    text: text.slice(0, bounds.from) + block + text.slice(bounds.to),
    start: Math.max(bounds.from, start - removedOnFirst),
    end: Math.max(bounds.from, end - removed)
  }
}

function newline(
  text: string,
  start: number,
  end: number,
  indentAfterColon: boolean
): { text: string; start: number; end: number } {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const before = text.slice(lineStart, start)
  const leading = /^[ \t]*/.exec(before)?.[0] ?? ''
  const extra = indentAfterColon && /:\s*(#.*)?$/.test(before) ? INDENT : ''
  const insert = `\n${leading}${extra}`
  const cursor = start + insert.length
  return {
    text: text.slice(0, start) + insert + text.slice(end),
    start: cursor,
    end: cursor
  }
}

/** How many leading spaces can be removed as one indent, when the cursor is still in that indent. */
function leadingSpacesBefore(text: string, cursor: number): number {
  const lineStart = text.lastIndexOf('\n', cursor - 1) + 1
  const before = text.slice(lineStart, cursor)
  if (!/^[ \t]+$/.test(before)) return 0
  return before.length
}

function lineBounds(text: string, start: number, end: number): { from: number; to: number } {
  const from = text.lastIndexOf('\n', start - 1) + 1
  let to = text.indexOf('\n', end)
  if (to === -1) to = text.length
  if (end > start && text[end - 1] === '\n') to = end - 1
  return { from, to }
}

function indentWidth(line: string): number {
  if (line.startsWith(INDENT)) return INDENT.length
  if (line.startsWith('\t')) return 1
  const spaces = /^ +/.exec(line)?.[0].length ?? 0
  return Math.min(spaces, INDENT.length)
}
