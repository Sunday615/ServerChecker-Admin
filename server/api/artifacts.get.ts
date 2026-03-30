import { access } from 'node:fs/promises'
import { getQuery, sendStream, setHeader } from 'h3'
import { artifactMimeType, createArtifactStream, resolveArtifactPath } from '../utils/checker'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filePath = Array.isArray(query.path) ? query.path[0] : query.path

  if (!filePath || typeof filePath !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Artifact path is required.'
    })
  }

  const resolved = resolveArtifactPath(filePath)

  try {
    await access(resolved)
  }
  catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Artifact not found.'
    })
  }

  setHeader(event, 'content-type', artifactMimeType(resolved))
  return sendStream(event, createArtifactStream(resolved))
})
