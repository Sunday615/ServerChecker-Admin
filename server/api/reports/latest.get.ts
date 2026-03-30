import { queryOne, queryRows } from '../../utils/mysql'

export default defineEventHandler(async () => {
  try {
    const latestRun = await queryOne(`
      SELECT id, run_key, generated_at, overall_status, web_summary_report_path
      FROM check_runs
      ORDER BY generated_at DESC
      LIMIT 1
    `)

    if (!latestRun) {
      return {
        databaseOnline: true,
        message: '',
        latestRun: null,
        siteReports: []
      }
    }

    const siteReports = await queryRows(`
      SELECT si.site_name, sr.report_html_path, sr.summary_screenshot_file
      FROM site_run_reports sr
      JOIN sites si ON si.id = sr.site_id
      WHERE sr.check_run_id = ?
      ORDER BY si.site_name ASC
    `, [latestRun.id as number])

    return {
      databaseOnline: true,
      message: '',
      latestRun,
      siteReports
    }
  }
  catch (error: any) {
    return {
      databaseOnline: false,
      message: error?.message || 'Failed to load latest report artifacts.',
      latestRun: null,
      siteReports: []
    }
  }
})
