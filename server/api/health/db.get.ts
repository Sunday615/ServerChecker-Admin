import { queryOne, queryRows } from '../../utils/mysql'

const REQUIRED_OBJECTS = [
  'check_runs',
  'service_results',
  'web_check_results',
  'latest_service_status_v',
  'latest_web_status_v'
]

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const database = String(config.mysqlDatabase || '').trim()
  const user = String(config.mysqlUser || '').trim()
  const host = String(config.mysqlHost || '').trim()
  const port = Number(config.mysqlPort || 3306)
  const hasPassword = Boolean(String(config.mysqlPassword ?? '').trim())

  const baseResponse = {
    configured: Boolean(database && user && host),
    connectionOk: false,
    config: {
      host,
      port,
      user,
      database,
      hasPassword
    }
  }

  try {
    await queryOne('SELECT 1 AS ok')

    const placeholders = REQUIRED_OBJECTS.map(() => '?').join(', ')
    const objectRows = await queryRows(`
      SELECT table_name AS name, table_type AS type
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name IN (${placeholders})
    `, [database, ...REQUIRED_OBJECTS]) as Array<{ name: string, type: string }>

    const foundNames = new Set(objectRows.map(row => row.name))
    const missingObjects = REQUIRED_OBJECTS.filter(name => !foundNames.has(name))

    const [runCountRow, serviceCountRow, webCountRow] = await Promise.all([
      queryOne('SELECT COUNT(*) AS count FROM check_runs'),
      queryOne('SELECT COUNT(*) AS count FROM service_results'),
      queryOne('SELECT COUNT(*) AS count FROM web_check_results')
    ])

    return {
      ...baseResponse,
      connectionOk: true,
      message: '',
      objects: {
        required: REQUIRED_OBJECTS,
        found: objectRows,
        missing: missingObjects
      },
      counts: {
        checkRuns: Number((runCountRow as { count?: number } | null)?.count || 0),
        serviceResults: Number((serviceCountRow as { count?: number } | null)?.count || 0),
        webCheckResults: Number((webCountRow as { count?: number } | null)?.count || 0)
      }
    }
  }
  catch (error: any) {
    return {
      ...baseResponse,
      message: error?.message || 'Failed to connect to MySQL.',
      objects: {
        required: REQUIRED_OBJECTS,
        found: [],
        missing: REQUIRED_OBJECTS
      },
      counts: null
    }
  }
})
