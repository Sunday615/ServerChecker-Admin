import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'

const MAX_LOG_TAIL = 12000

export type CheckerRunState = {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: string | null
  finishedAt: string | null
  exitCode: number | null
  pid: number | null
  stdoutTail: string
  stderrTail: string
  command: string
  checkerRoot: string
}

type CheckerPaths = {
  checkerRoot: string
  checkerRunScript: string
  checkerOutputRoot: string
  runtimeDir: string
  stateFile: string
  lockFile: string
}

const createDefaultState = (checkerRoot = '', command = ''): CheckerRunState => ({
  status: 'IDLE',
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  pid: null,
  stdoutTail: '',
  stderrTail: '',
  command,
  checkerRoot
})

const missingCheckerConfigError = () => createError({
  statusCode: 500,
  statusMessage: 'Checker path config is missing. Set CHECKER_ROOT, CHECKER_RUN_SCRIPT, and CHECKER_OUTPUT_ROOT in your .env file.'
})

export const getCheckerPaths = (): CheckerPaths => {
  const config = useRuntimeConfig()
  const rawCheckerRoot = String(config.checkerRoot || '').trim()
  const rawCheckerRunScript = String(config.checkerRunScript || '').trim()
  const rawCheckerOutputRoot = String(config.checkerOutputRoot || '').trim()

  if (!rawCheckerRoot || !rawCheckerRunScript || !rawCheckerOutputRoot) {
    throw missingCheckerConfigError()
  }

  const checkerRoot = resolve(rawCheckerRoot)
  const checkerRunScript = resolve(rawCheckerRunScript)
  const checkerOutputRoot = resolve(rawCheckerOutputRoot)
  const runtimeDir = resolve(checkerOutputRoot, 'runtime')

  return {
    checkerRoot,
    checkerRunScript,
    checkerOutputRoot,
    runtimeDir,
    stateFile: resolve(runtimeDir, 'web_trigger_state.json'),
    lockFile: resolve(runtimeDir, 'web_trigger.lock')
  }
}

const checkerSpawn = (paths: CheckerPaths) => {
  const config = useRuntimeConfig()
  const checkerPythonBin = String(config.checkerPythonBin || 'python').trim() || 'python'
  const runScript = paths.checkerRunScript
  const normalizedRunScript = runScript.toLowerCase()

  if (normalizedRunScript.endsWith('.py')) {
    return {
      command: checkerPythonBin,
      args: [runScript],
      display: `${checkerPythonBin} ${runScript}`
    }
  }

  if (normalizedRunScript.endsWith('.cmd') || normalizedRunScript.endsWith('.bat')) {
    return {
      command: runScript,
      args: [],
      display: runScript
    }
  }

  return {
    command: 'bash',
    args: [runScript],
    display: `bash ${runScript}`
  }
}

const checkerEnv = () => {
  const config = useRuntimeConfig()

  return {
    ...process.env,
    MYSQL_HOST: String(config.mysqlHost),
    MYSQL_PORT: String(config.mysqlPort),
    MYSQL_USER: String(config.mysqlUser),
    MYSQL_PASSWORD: String(config.mysqlPassword ?? ''),
    MYSQL_DATABASE: String(config.mysqlDatabase)
  }
}

const ensureRuntimeDir = async (paths = getCheckerPaths()) => {
  await mkdir(paths.runtimeDir, { recursive: true })
}

const appendTail = (current: string, incoming: string) => {
  const merged = `${current}${incoming}`
  if (merged.length <= MAX_LOG_TAIL) {
    return merged
  }

  return merged.slice(-MAX_LOG_TAIL)
}

const isPidRunning = (pid: number | null) => {
  if (!pid || pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  }
  catch (error: any) {
    return error?.code === 'EPERM'
  }
}

const readStateFile = async (paths = getCheckerPaths()) => {
  const { stateFile, checkerRoot, checkerRunScript } = paths

  try {
    const raw = await readFile(stateFile, 'utf-8')
    return JSON.parse(raw) as CheckerRunState
  }
  catch {
    return createDefaultState(checkerRoot, checkerRunScript)
  }
}

const writeCheckerRunState = async (state: CheckerRunState, paths = getCheckerPaths()) => {
  await ensureRuntimeDir(paths)
  await writeFile(paths.stateFile, JSON.stringify(state, null, 2), 'utf-8')
}

const readLockPid = async (paths = getCheckerPaths()) => {
  try {
    const raw = await readFile(paths.lockFile, 'utf-8')
    const pid = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(pid) ? pid : null
  }
  catch {
    return null
  }
}

const syncCheckerRunState = async (paths = getCheckerPaths()) => {
  const state = await readStateFile(paths)
  const lockPid = await readLockPid(paths)
  const activePid = state.status === 'RUNNING'
    ? (state.pid ?? lockPid)
    : lockPid

  if (state.status === 'RUNNING' && isPidRunning(activePid)) {
    return state
  }

  if (lockPid && !isPidRunning(lockPid)) {
    await clearLock(paths)
  }

  if (state.status !== 'RUNNING') {
    return state
  }

  const healedState: CheckerRunState = {
    ...state,
    status: 'FAILED',
    finishedAt: state.finishedAt ?? new Date().toISOString(),
    exitCode: state.exitCode ?? -1,
    pid: null,
    stderrTail: appendTail(
      state.stderrTail,
      '\nRun process is no longer active. Cleared a stale trigger lock.'
    )
  }

  await writeCheckerRunState(healedState, paths)
  return healedState
}

export const readCheckerRunState = async () => {
  return syncCheckerRunState()
}

const hasActiveLock = async (paths = getCheckerPaths()) => {
  const state = await syncCheckerRunState(paths)

  if (state.status === 'RUNNING' && isPidRunning(state.pid)) {
    return true
  }

  const lockPid = await readLockPid(paths)
  return isPidRunning(lockPid)
}

const writeLock = async (pid = process.pid, paths = getCheckerPaths()) => {
  await ensureRuntimeDir(paths)
  await writeFile(paths.lockFile, String(pid), 'utf-8')
}

const clearLock = async (paths = getCheckerPaths()) => {
  try {
    await rm(paths.lockFile, { force: true })
  }
  catch {
    // Ignore cleanup errors for stale lock removal attempts.
  }
}

export const triggerCheckerRun = async () => {
  const paths = getCheckerPaths()
  const spawnConfig = checkerSpawn(paths)

  if (await hasActiveLock(paths)) {
    return {
      started: false,
      state: await syncCheckerRunState(paths)
    }
  }

  await ensureRuntimeDir(paths)
  await writeLock(process.pid, paths)

  const startingState: CheckerRunState = {
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    pid: null,
    stdoutTail: '',
    stderrTail: '',
    command: spawnConfig.display,
    checkerRoot: paths.checkerRoot
  }

  await writeCheckerRunState(startingState, paths)

  const child = spawn(spawnConfig.command, spawnConfig.args, {
    cwd: paths.checkerRoot,
    env: checkerEnv(),
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stdoutTail = ''
  let stderrTail = ''

  startingState.pid = child.pid ?? null
  await writeLock(startingState.pid ?? process.pid, paths)
  await writeCheckerRunState(startingState, paths)

  child.stdout?.on('data', (chunk) => {
    stdoutTail = appendTail(stdoutTail, String(chunk))
  })

  child.stderr?.on('data', (chunk) => {
    stderrTail = appendTail(stderrTail, String(chunk))
  })

  child.on('error', async (error) => {
    await clearLock(paths)
    await writeCheckerRunState({
      status: 'FAILED',
      startedAt: startingState.startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      pid: null,
      stdoutTail,
      stderrTail: appendTail(stderrTail, `\n${error.message}`),
      command: spawnConfig.display,
      checkerRoot: paths.checkerRoot
    }, paths)
  })

  child.on('close', async (code) => {
    await clearLock(paths)
    await writeCheckerRunState({
      status: code === 0 || (code === 1 && !stderrTail.trim()) ? 'COMPLETED' : 'FAILED',
      startedAt: startingState.startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: code ?? -1,
      pid: null,
      stdoutTail,
      stderrTail,
      command: spawnConfig.display,
      checkerRoot: paths.checkerRoot
    }, paths)
  })

  return {
    started: true,
    state: startingState
  }
}

const stripFileProtocol = (value: string) => value.replace(/^file:(\/\/\/?)?/i, '').trim()

const outputRelativePath = (requestedPath: string) => {
  const normalized = stripFileProtocol(requestedPath).replace(/\\/g, '/')
  const marker = '/output/'
  const lower = normalized.toLowerCase()
  const markerIndex = lower.lastIndexOf(marker)

  if (markerIndex === -1) {
    return ''
  }

  return normalized.slice(markerIndex + marker.length)
}

const isInsideOutputRoot = (rootPath: string, candidatePath: string) => {
  const relativePath = relative(rootPath, candidatePath)
  return relativePath === ''
    || (!relativePath.startsWith('..') && !isAbsolute(relativePath))
}

export const resolveArtifactCandidates = (requestedPath: string) => {
  const { checkerOutputRoot } = getCheckerPaths()
  const resolvedRoot = resolve(checkerOutputRoot)
  const cleanedPath = stripFileProtocol(requestedPath)
  const candidates = new Set<string>()

  if (cleanedPath) {
    candidates.add(resolve(cleanedPath))

    if (!isAbsolute(cleanedPath)) {
      const trimmed = cleanedPath.replace(/^output[\\/]+/i, '')
      candidates.add(resolve(resolvedRoot, trimmed))
    }

    const relativeOutput = outputRelativePath(cleanedPath)
    if (relativeOutput) {
      candidates.add(resolve(resolvedRoot, relativeOutput))
    }
  }

  const resolvedCandidates = Array.from(candidates).filter(candidate => isInsideOutputRoot(resolvedRoot, candidate))

  if (resolvedCandidates.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Artifact path must be inside the checker output directory.'
    })
  }

  return resolvedCandidates
}

export const resolveArtifactPath = (requestedPath: string) => {
  return resolveArtifactCandidates(requestedPath)[0]
}

export const artifactMimeType = (filePath: string) => {
  if (filePath.endsWith('.html')) {
    return 'text/html; charset=utf-8'
  }

  if (filePath.endsWith('.png')) {
    return 'image/png'
  }

  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg'
  }

  if (filePath.endsWith('.json')) {
    return 'application/json; charset=utf-8'
  }

  if (filePath.endsWith('.log') || filePath.endsWith('.txt')) {
    return 'text/plain; charset=utf-8'
  }

  return 'application/octet-stream'
}

export const createArtifactStream = (filePath: string) => createReadStream(filePath)
