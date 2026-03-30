import { access, readFile, readdir } from 'node:fs/promises'
import { getQuery, sendStream, setHeader } from 'h3'
import { basename, dirname, resolve } from 'node:path'
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
  let resolved = ''

  for (const candidate of candidates) {
    try {
      await access(candidate)
      resolved = candidate
      break
    }
    catch {
      // Try next candidate path.
    }
  }

  if (!resolved) {
    const searchedPath = await findArtifactBySearch(filePath)

    if (searchedPath) {
      resolved = searchedPath
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
