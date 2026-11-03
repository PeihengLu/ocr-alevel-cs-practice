/**
 * Long-lived Pyodide process. Speaks a line protocol on stdout:
 *   READY
 *   RESULT <json>
 * Parent sends `CODE <base64>` lines on stdin.
 */
import { createInterface } from 'node:readline'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const indexURL = process.argv[2]
if (!indexURL) {
  process.stderr.write('missing pyodide directory\n')
  process.exit(1)
}

const { loadPyodide } = await import(pathToFileURL(join(indexURL, 'pyodide.mjs')).href)
const py = await loadPyodide({ indexURL })

function writeLine(text) {
  process.stdout.write(`${text}\n`)
}

writeLine('READY')

let chain = Promise.resolve()
const rl = createInterface({ input: process.stdin })
rl.on('line', (line) => {
  chain = chain.then(() => handle(line)).catch((err) => {
    writeLine(
      `RESULT ${JSON.stringify({
        ok: false,
        output: '',
        error: err instanceof Error ? err.message : String(err)
      })}`
    )
  })
})

async function handle(line) {
  if (!line.startsWith('CODE ')) return
  const code = Buffer.from(line.slice('CODE '.length), 'base64').toString('utf8')
  const chunks = []
  py.setStdout({ batched: (text) => chunks.push(String(text)) })
  py.setStderr({ batched: (text) => chunks.push(String(text)) })
  const globals = py.globals.get('dict')()
  try {
    await py.runPythonAsync(code, { globals })
    writeLine(`RESULT ${JSON.stringify({ ok: true, output: chunks.join('\n') })}`)
  } catch (err) {
    writeLine(
      `RESULT ${JSON.stringify({
        ok: false,
        output: chunks.join('\n'),
        error: err instanceof Error ? String(err) : String(err)
      })}`
    )
  } finally {
    globals.destroy?.()
  }
}
