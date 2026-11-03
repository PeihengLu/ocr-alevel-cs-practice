export interface PythonCheck {
  name: string
  passed: boolean
  detail: string
}

export interface PythonRunResult {
  passed: boolean
  message: string
  checks: PythonCheck[]
  output: string
  error?: string
}

export interface PythonReport {
  checks: PythonCheck[]
  /** Lines the student printed, excluding check results. */
  output: string
}

const CHECK_HELPER = `def __check(name, fn):
    try:
        fn()
        print("PASS\\t" + name)
    except Exception as e:
        print("FAIL\\t" + name + "\\t" + type(e).__name__ + ": " + str(e))
`

/** Student code, then the check helper, then the hidden tests. */
export function buildPythonProgram(studentCode: string, tests: string): string {
  return `${studentCode.replace(/\s*$/, '')}\n\n${CHECK_HELPER}\n${tests.trim()}\n`
}

export function gradePythonRun(raw: {
  ok: boolean
  output: string
  error?: string
}): PythonRunResult {
  if (raw.error === 'TIMEOUT') {
    return {
      passed: false,
      message: 'Your program ran too long. Look for a loop that never stops.',
      checks: [],
      output: ''
    }
  }

  if (!raw.ok) {
    const lines = (raw.error ?? 'Python error').trim().split('\n')
    return {
      passed: false,
      message: 'Python error — fix the program and run the checks again.',
      checks: [],
      output: raw.output,
      error: lines.slice(-12).join('\n')
    }
  }

  const report = parsePythonReport(raw.output)
  const passedCount = report.checks.filter((check) => check.passed).length
  const passed = report.checks.length > 0 && passedCount === report.checks.length
  return {
    passed,
    message: passed
      ? 'Passed — every check succeeded.'
      : `Not yet — ${passedCount} of ${report.checks.length} checks passed.`,
    checks: report.checks,
    output: report.output
  }
}

/** Split Pyodide stdout into check rows and anything else the student printed. */
export function parsePythonReport(output: string): PythonReport {
  const checks: PythonCheck[] = []
  const printed: string[] = []

  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('PASS\t')) {
      checks.push({
        name: line.slice('PASS\t'.length),
        passed: true,
        detail: 'Passed.'
      })
      continue
    }
    if (line.startsWith('FAIL\t')) {
      const rest = line.slice('FAIL\t'.length)
      const tab = rest.indexOf('\t')
      if (tab === -1) {
        checks.push({ name: rest, passed: false, detail: 'Failed.' })
      } else {
        checks.push({
          name: rest.slice(0, tab),
          passed: false,
          detail: rest.slice(tab + 1)
        })
      }
      continue
    }
    if (line.trim()) printed.push(line)
  }

  return { checks, output: printed.join('\n') }
}
