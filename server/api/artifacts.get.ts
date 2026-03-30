import { access, readFile } from 'node:fs/promises'
import { getQuery, sendStream, setHeader } from 'h3'
import { dirname, resolve } from 'node:path'
import { artifactMimeType, createArtifactStream, resolveArtifactCandidates } from '../utils/checker'

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
