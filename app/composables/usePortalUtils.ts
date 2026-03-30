export const usePortalUtils = () => {
  const formatDate = (value?: string | null) => {
    if (!value) {
      return '-'
    }

    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value))
  }

  const artifactUrl = (filePath?: string | null) => {
    if (!filePath) {
      return '#'
    }

    return `/api/artifacts?path=${encodeURIComponent(filePath)}`
  }

  return {
    formatDate,
    artifactUrl
  }
}
