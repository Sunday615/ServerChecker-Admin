import { getQuery } from 'h3'
import { queryRows } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawLimit = Number(query.limit || 20)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20

  try {
    const items = await queryRows(`
      SELECT run_key, generated_at, overall_status, total_hosts, total_services, total_passed, total_failed, total_web_checks, total_web_passed, total_web_failed, web_summary_report_path
      FROM check_runs
      ORDER BY generated_at DESC
      LIMIT ?
    `, [limit])

    return {
      databaseOnline: true,
      message: '',
      items
    }
  }
  catch (error: any) {
    return {
      databaseOnline: false,
      message: error?.message || 'Failed to load run history.',
      items: []
    }
  }
})
