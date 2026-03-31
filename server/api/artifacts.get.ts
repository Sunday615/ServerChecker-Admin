import { access, readFile, readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { getQuery, sendStream, setHeader } from 'h3'
import { basename, dirname, relative, resolve } from 'node:path'
import { artifactMimeType, createArtifactStream, getCheckerPaths, resolveArtifactCandidates } from '../utils/checker'

const ABSOLUTE_OR_EXTERNAL_RE = /^(?:[a-z]+:|\/\/|#|\/)/i

const rewriteHtmlArtifactLinks = (html: string, htmlPath: string) => {
  return html.replace(/(src|href)=["']([^"']+)["']/gi, (full, attr: string, rawValue: string) => {
    if (!rawValue || ABSOLUTE_OR_EXTERNAL_RE.test(rawValue)) {
      return full
    }

    const [assetPathPart = '', suffix = ''] = rawValue.split(/(?=[?#])/)
    const absoluteAssetPath = resolve(dirname(htmlPath), assetPathPart)
    const rewrittenUrl = `/api/artifacts?path=${encodeURIComponent(absoluteAssetPath)}${suffix}`

    return `${attr}="${rewrittenUrl}"`
  })
}

const normalizePathForMatch = (value: string) => value.replace(/\\/g, '/').toLowerCase()

const outputRelativeMatch = (value: string) => {
  const normalized = normalizePathForMatch(value)
  const marker = '/output/'
  const markerIndex = normalized.lastIndexOf(marker)

  if (markerIndex === -1) {
    return ''
  }

  return normalized.slice(markerIndex + marker.length)
}

const findArtifactBySearch = async (requestedPath: string) => {
  const { checkerOutputRoot } = getCheckerPaths()
  const targetFileName = basename(requestedPath).toLowerCase()
  const targetRelative = outputRelativeMatch(requestedPath)
  const dirsToScan = [checkerOutputRoot]
  let fallbackByName = ''

  while (dirsToScan.length > 0) {
    const currentDir = dirsToScan.shift()
    if (!currentDir) {
      continue
    }

    try {
      const entries = await readdir(currentDir, { withFileTypes: true, encoding: 'utf8' })

      for (const entry of entries) {
        const fullPath = resolve(currentDir, entry.name)

        if (entry.isDirectory()) {
          dirsToScan.push(fullPath)
          continue
        }

        if (!entry.isFile()) {
          continue
        }

        const normalizedFullPath = normalizePathForMatch(fullPath)

        if (targetRelative && normalizedFullPath.endsWith(targetRelative)) {
          return fullPath
        }

        if (!fallbackByName && entry.name.toLowerCase() === targetFileName) {
          fallbackByName = fullPath
        }
      }
    }
    catch {
      continue
    }
  }

  return fallbackByName
}

const pathExists = async (candidate: string) => {
  try {
    await access(candidate)
    return true
  }
  catch {
    return false
  }
}

const findExistingCandidate = async (candidates: string[]) => {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return ''
}

const deriveHtmlCandidatesForPng = (imagePath: string) => {
  const { checkerOutputRoot } = getCheckerPaths()
  const outputRoot = resolve(checkerOutputRoot)
  const relativeImagePath = relative(outputRoot, resolve(imagePath)).replace(/\\/g, '/')
  const candidates: string[] = []
  let regenerateMode: 'never' | 'missing-only' | 'always' = 'never'

  if (relativeImagePath.startsWith('screenshots/services/')) {
    const suffix = relativeImagePath.slice('screenshots/services/'.length).replace(/\.png$/i, '.html')
    candidates.push(resolve(outputRoot, 'reports/services', suffix))
    regenerateMode = 'always'
  }

  if (relativeImagePath.startsWith('webshots/')) {
    const suffix = relativeImagePath.slice('webshots/'.length).replace(/\.png$/i, '.html')
    candidates.push(resolve(outputRoot, 'web_reports', suffix))

    if (regenerateMode === 'never') {
      regenerateMode = 'missing-only'
    }
  }

  if (relativeImagePath.startsWith('screenshots/')) {
    const parts = relativeImagePath.split('/')
    const site = parts[1] || ''
    const fileName = parts.at(-1) || ''

    if (site && fileName.endsWith(`__${site}__server_check_report.png`)) {
      const htmlFileName = fileName.replace(`__${site}__server_check_report.png`, '__server_check_report.html')
      candidates.push(resolve(outputRoot, 'reports', site, htmlFileName))
      regenerateMode = 'always'
    }
  }

  return {
    candidates: Array.from(new Set(candidates)),
    regenerateMode
  }
}

const resolvePythonBins = (checkerRoot: string, configuredBin: string) => {
  const venvPython = process.platform === 'win32'
    ? resolve(checkerRoot, '.venv', 'Scripts', 'python.exe')
    : resolve(checkerRoot, '.venv', 'bin', 'python')
  const venvPython3 = process.platform === 'win32'
    ? resolve(checkerRoot, '.venv', 'Scripts', 'python.exe')
    : resolve(checkerRoot, '.venv', 'bin', 'python3')

  return Array.from(new Set([
    configuredBin.trim(),
    venvPython,
    venvPython3,
    'python3',
    'python'
  ].filter(Boolean)))
}

const runScreenshotRegeneration = async (
  pythonBin: string,
  scriptPath: string,
  checkerRoot: string,
  htmlPath: string,
  imagePath: string
) => {
  return await new Promise<boolean>((resolvePromise) => {
    const child = spawn(pythonBin, [scriptPath, htmlPath, imagePath], {
      cwd: checkerRoot,
      env: process.env,
      stdio: ['ignore', 'ignore', 'pipe']
    })

    child.on('error', () => resolvePromise(false))
    child.on('close', (code) => resolvePromise(code === 0))
  })
}

const regeneratePngFromHtml = async (htmlPath: string, imagePath: string) => {
  const config = useRuntimeConfig()
  const { checkerRoot } = getCheckerPaths()
  const pythonBins = resolvePythonBins(checkerRoot, String(config.checkerPythonBin || ''))
  const scriptPath = resolve(checkerRoot, 'tools', 'regenerate_screenshot.py')

  for (const pythonBin of pythonBins) {
    if (await runScreenshotRegeneration(pythonBin, scriptPath, checkerRoot, htmlPath, imagePath)) {
      return true
    }
  }

  return false
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filePath = Array.isArray(query.path) ? query.path[0] : query.path

  if (!filePath || typeof filePath !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Artifact path is required.'
    })
  }

  const candidates = resolveArtifactCandidates(filePath)
  let resolved = await findExistingCandidate(candidates)

  if (!resolved) {
    const searchedPath = await findArtifactBySearch(filePath)

    if (searchedPath) {
      resolved = searchedPath
    }
  }

  if (filePath.toLowerCase().endsWith('.png')) {
    const targetImagePath = candidates[0] || resolved || ''
    const { candidates: htmlCandidates, regenerateMode } = deriveHtmlCandidatesForPng(targetImagePath || filePath)
    const resolvedHtmlPath = await findExistingCandidate(htmlCandidates)
    const shouldRegenerate = Boolean(
      resolvedHtmlPath
      && targetImagePath
      && (
        regenerateMode === 'always'
        || (regenerateMode === 'missing-only' && !resolved)
      )
    )

    if (shouldRegenerate) {
      const regenerated = await regeneratePngFromHtml(resolvedHtmlPath, targetImagePath)

      if (regenerated && await pathExists(targetImagePath)) {
        resolved = targetImagePath
      }
    }
  }

  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Artifact not found.'
    })
  }

  setHeader(event, 'content-type', artifactMimeType(resolved))

  if (resolved.toLowerCase().endsWith('.html')) {
    const html = await readFile(resolved, 'utf-8')
    return rewriteHtmlArtifactLinks(html, resolved)
  }

  return sendStream(event, createArtifactStream(resolved))
})
