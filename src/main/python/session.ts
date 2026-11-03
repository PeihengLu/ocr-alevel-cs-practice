import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'

export interface PythonPaths {
  execPath: string
  runnerPath: string
  pyodideDir: string
}

export interface PythonRaw {
  ok: boolean
  output: string
  error?: string
}

/**
 * One Pyodide process for the app. The first Run loads the interpreter.
 * Each program then has a few seconds before that process is killed.
 */
export class PythonSession {
  private child: ChildProcessWithoutNullStreams | null = null
  private readyPromise: Promise<void> | null = null
  private waitReady: (() => void) | null = null
  private waitResult: ((line: string) => void) | null = null
  private pendingReady = false
  private stderr = ''
  private chain: Promise<void> = Promise.resolve()
  private paths: PythonPaths

  constructor(paths: PythonPaths) {
    this.paths = paths
  }

  run(code: string, execTimeoutMs: number): Promise<PythonRaw> {
    const job = this.chain.then(() => this.runExclusive(code, execTimeoutMs))
    this.chain = job.then(
      () => undefined,
      () => undefined
    )
    return job
  }

  stop(): void {
    const child = this.child
    this.child = null
    this.readyPromise = null
    this.waitReady = null
    this.pendingReady = false
    child?.kill('SIGKILL')
  }

  private async runExclusive(code: string, execTimeoutMs: number): Promise<PythonRaw> {
    await this.ensure(30_000)
    const child = this.child
    if (!child) {
      return { ok: false, output: '', error: 'Python did not start.' }
    }

    const resultLine = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waitResult = null
        this.stop()
        reject(new Error('TIMEOUT'))
      }, execTimeoutMs)
      this.waitResult = (line) => {
        clearTimeout(timer)
        this.waitResult = null
        resolve(line)
      }
    })

    child.stdin.write(`CODE ${Buffer.from(code, 'utf8').toString('base64')}\n`)

    try {
      const line = await resultLine
      return JSON.parse(line.slice('RESULT '.length)) as PythonRaw
    } catch (err) {
      if (err instanceof Error && err.message === 'TIMEOUT') {
        return { ok: false, output: '', error: 'TIMEOUT' }
      }
      return {
        ok: false,
        output: '',
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }

  private async ensure(timeoutMs: number): Promise<void> {
    if (this.child && this.readyPromise) {
      await this.readyPromise
      if (this.child) return
    }

    this.stderr = ''
    this.pendingReady = false
    const child = spawn(this.paths.execPath, [this.paths.runnerPath, this.paths.pyodideDir], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    })
    this.child = child
    child.on('error', (err) => {
      this.stderr += err instanceof Error ? err.message : String(err)
    })
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      this.stderr += chunk
      if (this.stderr.length > 8000) this.stderr = this.stderr.slice(-8000)
    })

    child.on('exit', () => {
      const current = this.child === child
      if (current) {
        this.child = null
        this.readyPromise = null
      }
      if (current && this.waitResult) {
        const fail = this.waitResult
        this.waitResult = null
        fail(
          `RESULT ${JSON.stringify({
            ok: false,
            output: '',
            error: `Python stopped. ${this.stderr}`.trim()
          })}`
        )
      }
    })

    const rl = createInterface({ input: child.stdout })
    rl.on('line', (line) => {
      if (this.child !== child) return
      if (line === 'READY') {
        if (this.waitReady) {
          const done = this.waitReady
          this.waitReady = null
          done()
        } else {
          this.pendingReady = true
        }
        return
      }
      if (line.startsWith('RESULT ') && this.waitResult) {
        const done = this.waitResult
        this.waitResult = null
        done(line)
      }
    })

    const ready = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waitReady = null
        const detail = this.stderr.trim()
        this.stop()
        reject(new Error(detail ? `Python failed to start. ${detail}` : 'Python failed to start.'))
      }, timeoutMs)
      let starting = true
      const finish = (): void => {
        starting = false
        clearTimeout(timer)
        resolve()
      }
      if (this.pendingReady) {
        this.pendingReady = false
        finish()
      } else {
        this.waitReady = finish
      }
      child.on('exit', () => {
        if (!starting) return
        starting = false
        clearTimeout(timer)
        if (this.waitReady === finish) this.waitReady = null
        const detail = this.stderr.trim()
        reject(
          new Error(detail ? `Python exited before it was ready. ${detail}` : 'Python exited before it was ready.')
        )
      })
    })
    this.readyPromise = ready
    await ready
  }
}
